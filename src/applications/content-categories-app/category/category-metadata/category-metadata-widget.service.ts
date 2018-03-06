import {MetadataAddAction} from 'kaltura-ngx-client/api/types/MetadataAddAction';
import {MetadataUpdateAction} from 'kaltura-ngx-client/api/types/MetadataUpdateAction';
import {KalturaTagFilter} from 'kaltura-ngx-client/api/types/KalturaTagFilter';
import {TagSearchAction} from 'kaltura-ngx-client/api/types/TagSearchAction';
import {KalturaFilterPager} from 'kaltura-ngx-client/api/types/KalturaFilterPager';
import {KalturaTaggedObjectType} from 'kaltura-ngx-client/api/types/KalturaTaggedObjectType';
import {MetadataListAction} from 'kaltura-ngx-client/api/types/MetadataListAction';
import {KalturaMetadataObjectType} from 'kaltura-ngx-client/api/types/KalturaMetadataObjectType';
import {KalturaClient, KalturaMultiRequest} from 'kaltura-ngx-client';
import {KalturaCategory} from 'kaltura-ngx-client/api/types/KalturaCategory';
import {KalturaMetadataFilter} from 'kaltura-ngx-client/api/types/KalturaMetadataFilter';
import {KalturaMetadata} from 'kaltura-ngx-client/api/types/KalturaMetadata';
import {Observable} from 'rxjs/Observable';
import {
  DynamicMetadataForm,
  DynamicMetadataFormFactory,
  MetadataProfileCreateModes,
  MetadataProfileStore,
  MetadataProfileTypes
} from 'app-shared/kmc-shared';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CategoryWidgetKeys} from './../category-widget-keys';
import {Injectable, OnDestroy} from '@angular/core';
import {CategoryWidget} from '../category-widget';
import {async} from 'rxjs/scheduler/async';

@Injectable()
export class CategoryMetadataWidget extends CategoryWidget implements OnDestroy {

    public metadataForm: FormGroup;
    public customDataForms: DynamicMetadataForm[] = [];
    private _categoryMetadata: KalturaMetadata[] = [];

    constructor(private _kalturaServerClient: KalturaClient,
        private _formBuilder: FormBuilder,
        private _metadataProfileStore: MetadataProfileStore,
        private _dynamicMetadataFormFactory: DynamicMetadataFormFactory) {
        super(CategoryWidgetKeys.Metadata);

        this._buildForm();
    }

    private _buildForm(): void {
        this.metadataForm = this._formBuilder.group({
            name: ['', Validators.required],
            description: '',
            tags: null,
            offlineMessage: '',
            referenceId: ''
        });
    }

    private _monitorFormChanges() {
        const formGroups = [this.metadataForm, ...this.customDataForms.map(customDataForm => customDataForm.formGroup)];
        const formsChanges: Observable<any>[] = [];

        formGroups.forEach(formGroup => {
            formsChanges.push(formGroup.valueChanges, formGroup.statusChanges);
        });

        Observable.merge(...formsChanges)
            .cancelOnDestroy(this, this.widgetReset$)
            .observeOn(async) // using async scheduler so the form group status/dirty mode will be synchornized
            .subscribe(
            () => {
                let isValid = true;
                let isDirty = false;

                formGroups.forEach(formGroup => {
                    isValid = isValid && formGroup.status === 'VALID';
                    isDirty = isDirty || formGroup.dirty;

                });

                if (this.isDirty !== isDirty || this.isValid !== isValid) {
                    super.updateState({
                        isValid: isValid,
                        isDirty: isDirty
                    });
                }
            }
            );
    }

    public setDirty() {
        super.updateState({
            isDirty: true
        });
    }

    protected onActivate(firstTimeActivating: boolean): Observable<{ failed: boolean }> {

        super._showLoader();
        super._removeBlockerMessage();

        const actions: Observable<{ failed: boolean, error?: Error }>[] = [
            this._loadCategoryMetadata(this.data)
        ];

        if (firstTimeActivating) {
            actions.push(this._loadProfileMetadata());
        }


        return Observable.forkJoin(actions)
            .catch((error, caught) => {
                return Observable.of([{ failed: true }]);
            })
            .map(responses => {
                super._hideLoader();

                const hasFailure = (<Array<{ failed: boolean, error?: Error }>>responses).reduce((result, response) => result || response.failed, false);

                if (hasFailure) {
                    super._showActivationError();
                    return { failed: true };
                } else {
                    try {
                        // the sync function is dealing with dynamically created forms so mistakes can happen
                        // as result of undesired metadata schema.
                        this._syncHandlerContent();
                        return { failed: false };
                    } catch (e) {
                        super._showActivationError();
                        return { failed: true, error: e };
                    }
                }
            });
    }

    private _syncHandlerContent() {

        // validate reference ID
        let referenceId = '';
        if (this.data.referenceId &&
            this.data.referenceId !== '') {
            referenceId = this.data.referenceId;
        }

        this.metadataForm.reset(
            {
                name: this.data.name,
                description: this.data.description || null,
                tags: (this.data.tags ? this.data.tags.split(',').map(item => item.trim()) : null), // for backward compatibility we handle values separated with ',{space}'
                referenceId: referenceId
            }
        );

        // map category metadata to profile metadata
        if (this.customDataForms) {
            this.customDataForms.forEach(customDataForm => {
                const categoryMetadata = this._categoryMetadata.find(item => item.metadataProfileId === customDataForm.metadataProfile.id);

                // reset with either a valid category metadata or null if not found a matching metadata for that category
                customDataForm.resetForm(categoryMetadata);
            });
        }

        this._monitorFormChanges();
    }

    private _loadCategoryMetadata(category: KalturaCategory): Observable<{ failed: boolean, error?: Error }> {

        this._categoryMetadata = [];

        return this._kalturaServerClient.request(new MetadataListAction(
            {
                filter: new KalturaMetadataFilter(
                    {
                        objectIdEqual: String(category.id),
                        metadataObjectTypeEqual: KalturaMetadataObjectType.category
                    }
                )
            }
        ))
            .cancelOnDestroy(this, this.widgetReset$)
            .monitor('get category custom metadata')
            .do(response => {
                this._categoryMetadata = response.objects;
            })
            .map(response => ({ failed: false }))
            .catch((error, caught) => Observable.of({ failed: true, error }))
    }

    private _loadProfileMetadata(): Observable<{ failed: boolean, error?: Error }> {
        return this._metadataProfileStore.get({
            type: MetadataProfileTypes.Category,
            ignoredCreateMode: MetadataProfileCreateModes.App
        })
            .cancelOnDestroy(this)
            .monitor('load metadata profiles')
            .do(response => {

                this.customDataForms = [];
                if (response.items) {
                    response.items.forEach(serverMetadata => {
                        const newCustomDataForm = this._dynamicMetadataFormFactory.createHandler(serverMetadata);
                        this.customDataForms.push(newCustomDataForm);
                    });
                }
            })
            .map(response => ({ failed: false }))
            .catch((error, caught) => Observable.of({ failed: true, error }));
    }

    protected onDataSaving(newData: KalturaCategory, request: KalturaMultiRequest): void {

        const metadataFormValue = this.metadataForm.value;

        // save static metadata form
        newData.name = metadataFormValue.name;
        newData.description = metadataFormValue.description;
        newData.referenceId = metadataFormValue.referenceId || null;
        newData.tags = (metadataFormValue.tags || []).join(',');

        // save entry custom schema forms
        if (this.customDataForms) {
            this.customDataForms.forEach(customDataForm => {

                if (customDataForm.dirty) {

                    const customDataValue = customDataForm.getValue();
                    if (customDataValue.error) {
                        throw new Error('One of the forms is invalid');
                    } else {

                        const entryMetadata = this._categoryMetadata.find(item => item.metadataProfileId === customDataForm.metadataProfile.id);
                        if (entryMetadata) {
                            request.requests.push(new MetadataUpdateAction({
                                id: entryMetadata.id,
                                xmlData: customDataValue.xml
                            }));
                        } else {
                            request.requests.push(new MetadataAddAction({
                                objectType: KalturaMetadataObjectType.category,
                                objectId: String(this.data.id),
                                metadataProfileId: customDataForm.metadataProfile.id,
                                xmlData: customDataValue.xml
                            }));
                        }
                    }
                }
            });
        }
    }

    public searchTags(text: string): Observable<string[]> {
        return Observable.create(
            observer => {
                const requestSubscription = this._kalturaServerClient.request(
                    new TagSearchAction(
                        {
                            tagFilter: new KalturaTagFilter(
                                {
                                    tagStartsWith: text,
                                    objectTypeEqual: KalturaTaggedObjectType.category
                                }
                            ),
                            pager: new KalturaFilterPager({
                                pageIndex: 0,
                                pageSize: 30
                            })
                        }
                    )
                )
                    .cancelOnDestroy(this, this.widgetReset$)
                    .monitor('search tags')
                    .subscribe(
                    result => {
                        const tags = result.objects.map(item => item.tag);
                        observer.next(tags);
                        observer.complete();
                    },
                    err => {
                        observer.error(err);
                    }
                    );

                return () => {
                    console.log('categoryMetadataHandler.searchTags(): cancelled');
                    requestSubscription.unsubscribe();
                }
            });
    }

    /**
   * Do some cleanups if needed once the section is removed
   */
    protected onReset() {
        this.metadataForm.reset({});
        this._categoryMetadata = [];
    }

    onValidate(wasActivated: boolean): Observable<{ isValid: boolean }> {
        return Observable.create(observer => {
            this.metadataForm.updateValueAndValidity();
            const isValid = this.metadataForm.valid;
            observer.next({ isValid });
            observer.complete();
        });
    }

    ngOnDestroy() {
    }
}


