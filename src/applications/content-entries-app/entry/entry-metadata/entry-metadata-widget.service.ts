import { Injectable, OnDestroy } from '@angular/core';
import { IterableDiffers, IterableDiffer, IterableChangeRecord } from '@angular/core';
import { async } from 'rxjs/scheduler/async';
import { Observable } from 'rxjs/Observable';
import { KalturaCategoryEntryFilter } from 'kaltura-ngx-client/api/types/KalturaCategoryEntryFilter';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { KalturaClient } from 'kaltura-ngx-client';
import { KalturaTagFilter } from 'kaltura-ngx-client/api/types/KalturaTagFilter';
import { KalturaTaggedObjectType } from 'kaltura-ngx-client/api/types/KalturaTaggedObjectType';
import { KalturaFilterPager } from 'kaltura-ngx-client/api/types/KalturaFilterPager';
import { TagSearchAction } from 'kaltura-ngx-client/api/types/TagSearchAction';
import { CategoryEntryListAction } from 'kaltura-ngx-client/api/types/CategoryEntryListAction';
import { KalturaLiveStreamEntry } from 'kaltura-ngx-client/api/types/KalturaLiveStreamEntry';
import { MetadataListAction } from 'kaltura-ngx-client/api/types/MetadataListAction';
import { KalturaMetadataFilter } from 'kaltura-ngx-client/api/types/KalturaMetadataFilter';
import { KalturaMetadata } from 'kaltura-ngx-client/api/types/KalturaMetadata';
import { MetadataUpdateAction } from 'kaltura-ngx-client/api/types/MetadataUpdateAction';
import { MetadataAddAction } from 'kaltura-ngx-client/api/types/MetadataAddAction';
import { KalturaMetadataObjectType } from 'kaltura-ngx-client/api/types/KalturaMetadataObjectType';
import { CategoryEntryAddAction } from 'kaltura-ngx-client/api/types/CategoryEntryAddAction';
import { CategoryEntryDeleteAction } from 'kaltura-ngx-client/api/types/CategoryEntryDeleteAction';
import { KalturaCategoryEntry } from 'kaltura-ngx-client/api/types/KalturaCategoryEntry';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import { MetadataProfileStore, MetadataProfileTypes, MetadataProfileCreateModes } from 'app-shared/kmc-shared';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { KalturaMultiRequest } from 'kaltura-ngx-client';
import { DynamicMetadataForm, DynamicMetadataFormFactory } from 'app-shared/kmc-shared';
import { CategoriesSearchService, CategoryData } from 'app-shared/content-shared/categories/categories-search.service';

import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/catch';
import { EntryWidget } from '../entry-widget';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { subApplicationsConfig } from 'config/sub-applications';
import { ContentEntryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-entry-view.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';


@Injectable()
export class EntryMetadataWidget extends EntryWidget implements OnDestroy
{
    private _entryCategoriesDiffers : IterableDiffer<CategoryData>;
    public _entryCategories: CategoryData[]  = [];
    private _entryMetadata: KalturaMetadata[] = [];

    public isLiveEntry : boolean;
    public metadataForm : FormGroup;
    public customDataForms : DynamicMetadataForm[] = [];

    constructor(private _kalturaServerClient: KalturaClient,
                private _categoriesSearchService : CategoriesSearchService,
                private _formBuilder : FormBuilder,
                private _iterableDiffers : IterableDiffers,
                private _permissionsService: KMCPermissionsService,
                private _dynamicMetadataFormFactory : DynamicMetadataFormFactory,
                logger: KalturaLogger,
                private _metadataProfileStore : MetadataProfileStore)
    {
        super(ContentEntryViewSections.Metadata, logger);
        this._buildForm();
    }

    private _buildForm() : void {
        const categoriesValidator = (input: FormControl) => {
          const categoriesCount = (Array.isArray(input.value) ? input.value : []).length;
            const isCategoriesValid = this._permissionsService.hasPermission(KMCPermissions.FEATURE_DISABLE_CATEGORY_LIMIT)
                ? categoriesCount <= subApplicationsConfig.contentEntriesApp.maxLinkedCategories.extendedLimit
                : categoriesCount <= subApplicationsConfig.contentEntriesApp.maxLinkedCategories.defaultLimit;

          return isCategoriesValid ? null : { maxLinkedCategoriesExceed: true };
        };

        this.metadataForm = this._formBuilder.group({
            name: ['', Validators.required],
            description: '',
            tags: null,
            categories: [null, categoriesValidator],
            offlineMessage: '',
            referenceId: '',
            entriesIdList: null
        });
    }

    private _monitorFormChanges() {
        const formGroups = [];
        const formsChanges: Observable<any>[] = [];

        if (this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_METADATA)) {
          formGroups.push(this.metadataForm);
        }

        if (this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_CUSTOM_DATA)) {
          formGroups.push(...this.customDataForms.map(customDataForm => customDataForm.formGroup));
        }

        if (!formGroups.length) {
          return;
        }

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
                        isValid = isValid && formGroup.status !== 'INVALID';
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

    public setDirty()
    {
	    super.updateState({
		    isDirty: true
	    });
    }

    protected onActivate(firstTimeActivating : boolean) : Observable<{failed : boolean}> {

        super._showLoader();
        super._removeBlockerMessage();

        this.isLiveEntry = this.data instanceof KalturaLiveStreamEntry;

        if (!this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_ASSIGN_CATEGORIES)) {
          this.metadataForm.get('categories').disable({ onlySelf: true });
        }

        const actions: Observable<boolean>[] = [
            this._loadEntryCategories(this.data),
        ];

        if (this._permissionsService.hasPermission(KMCPermissions.METADATA_PLUGIN_PERMISSION)) {
            actions.push(this._loadEntryMetadata(this.data));

            if (firstTimeActivating) {
                actions.push(this._loadProfileMetadata());
            }
        }

        if (!this._permissionsService.hasAnyPermissions([
          KMCPermissions.CONTENT_MANAGE_METADATA,
          KMCPermissions.CONTENT_MODERATE_METADATA
        ])) {
          this.metadataForm.get('name').disable({ onlySelf: true });
          this.metadataForm.get('description').disable({ onlySelf: true });
          this.metadataForm.get('tags').disable({ onlySelf: true });
        }


        return Observable.forkJoin(actions)
            .catch(() => {
                return Observable.of([false]);
            })
            .map(responses => {
                super._hideLoader();

                const isValid = responses.reduce(((acc, response) => (acc && response)), true);

                if (!isValid) {
                    super._showActivationError();
                    return {failed: true};
                } else {
                    try {
                        // the sync function is dealing with dynamically created forms so mistakes can happen
                        // as result of undesired metadata schema.
                        this._syncHandlerContent();
                        return {failed: false};
                    } catch (e) {
                        super._showActivationError();
                        return {failed: true, error: e};
                    }
                }
            });
    }

    private _syncHandlerContent()
    {
        this.metadataForm.reset(
            {
                name: this.data.name,
                description: this.data.description || null,
                tags: (this.data.tags ? this.data.tags.split(',').map(item => item.trim()) : null), // for backward compatibility we handle values separated with ',{space}'
                categories: this._entryCategories,
                offlineMessage: this.data instanceof KalturaLiveStreamEntry ? (this.data.offlineMessage || null) : '',
                referenceId: this.data.referenceId || null
            }
        );

        this._entryCategoriesDiffers = this._iterableDiffers.find([]).create<CategoryData>((index, item) =>
        {
            // use track by function to identify category by its' id. this will prevent sending add/remove of the same item once
            // a user remove a category and then re-select it before he clicks the save button.
            return item ? item.id : null;
        });
        this._entryCategoriesDiffers.diff(this._entryCategories);

        // map entry metadata to profile metadata
        if (this.customDataForms)
        {
            this.customDataForms.forEach(customDataForm => {
                if (!this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_CUSTOM_DATA)) {
                  customDataForm.disable();
                }
                const entryMetadata = this._entryMetadata.find(item => item.metadataProfileId === customDataForm.metadataProfile.id);

                // reset with either a valid entry metadata or null if not found a matching metadata for that entry
                customDataForm.resetForm(entryMetadata);
            });
        }

        this._monitorFormChanges();
    }

    private _loadEntryMetadata(entry : KalturaMediaEntry) : Observable<boolean> {

        // update entry categories
        this._entryMetadata = [];

        return this._kalturaServerClient.request(new MetadataListAction(
            {
                filter: new KalturaMetadataFilter(
                    {
                        objectIdEqual: entry.id
                    }
                )
            }
        ))
            .cancelOnDestroy(this, this.widgetReset$)
            .do(response => {
                this._entryMetadata = response.objects;
            })
            .map(response => true)
            .catch((error) => {
                this._logger.error('failed to get category custom metadata', error);
                return Observable.of(false);
            });
    }

    private _loadEntryCategories(entry : KalturaMediaEntry) : Observable<boolean> {

        // update entry categories
        this._entryCategories = [];

        return this._kalturaServerClient.request(
            new CategoryEntryListAction(
                {
                    filter: new KalturaCategoryEntryFilter({
                        entryIdEqual: entry.id
                    }),
                    pager: new KalturaFilterPager({
                        pageSize: 500
                    })
                }
            ))
            .flatMap(response => {
                const categoriesList = response.objects.map(category => category.categoryId);

                if (categoriesList.length) {
                    return this._categoriesSearchService.getCategories(categoriesList);
                } else {
                    return Observable.of({items: []});
                }
            })
            .cancelOnDestroy(this, this.widgetReset$)
            .do(
                categories =>
                {
                    this._entryCategories = categories.items;
                }
            )
            .map(response => true)
            .catch((error) => {
                this._logger.error('failed to load entry categories', error);
                return Observable.of(false);
            });
    }

    private _loadProfileMetadata() : Observable<boolean> {
        return this._metadataProfileStore.get({
            type: MetadataProfileTypes.Entry,
            ignoredCreateMode: MetadataProfileCreateModes.App
        })
            .cancelOnDestroy(this)
            .do(response => {

                this.customDataForms = [];
                if (response.items) {
                    response.items.forEach(serverMetadata => {
                        const newCustomDataForm = this._dynamicMetadataFormFactory.createHandler(serverMetadata);
                        this.customDataForms.push(newCustomDataForm);
                    });
                }
            })
            .map(response => true)
            .catch((error) => {
                this._logger.error('failed to load entry custom metadata profiles', error);
                return Observable.of(false);
            });
    }

    protected onDataSaving(newData : KalturaMediaEntry, request : KalturaMultiRequest) : void
    {

	    const metadataFormValue = this.metadataForm.value;

        // save static metadata form
        newData.name = metadataFormValue.name;
        newData.description = metadataFormValue.description;
        newData.referenceId = metadataFormValue.referenceId || null;
        newData.tags = (metadataFormValue.tags || []).join(',');
        if (newData instanceof KalturaLiveStreamEntry)
        {
            newData.offlineMessage = metadataFormValue.offlineMessage;
        }

        // save changes in entry categories
        if (this._entryCategoriesDiffers) {
            const changes = this._entryCategoriesDiffers.diff(metadataFormValue.categories);

            if (changes)
            {
                changes.forEachAddedItem((change : IterableChangeRecord<CategoryData>) =>
                {
                    request.requests.push(new CategoryEntryAddAction({
                        categoryEntry : new KalturaCategoryEntry({
                            entryId : this.data.id,
                            categoryId : Number(change.item.id)
                        })
                    }));
                });

                changes.forEachRemovedItem((change : IterableChangeRecord<CategoryData>) =>
                {
                    request.requests.push(new CategoryEntryDeleteAction({
                        entryId : this.data.id,
                        categoryId : Number(change.item.id)
                    }));
                });
            }
        }

        // save entry custom schema forms
        if (this.customDataForms) {
            this.customDataForms.forEach(customDataForm => {

                if (customDataForm.dirty) {

                    const customDataValue = customDataForm.getValue();

                    if (customDataValue.error) {
                        throw new Error('One of the forms is invalid');
                    } else {

                        const entryMetadata = this._entryMetadata.find(item => item.metadataProfileId === customDataForm.metadataProfile.id);

                        if (entryMetadata) {
                            request.requests.push(new MetadataUpdateAction({
                                id: entryMetadata.id,
                                xmlData: customDataValue.xml
                            }));
                        }else
                        {
                            request.requests.push(new MetadataAddAction({
                                objectType : KalturaMetadataObjectType.entry,
                                objectId : this.data.id,
                                metadataProfileId : customDataForm.metadataProfile.id,
                                xmlData: customDataValue.xml
                            }));
                        }
                    }
                }
            });
        }
    }

    public searchTags(text : string): Observable<string[]>
    {
        return Observable.create(
            observer => {
                const requestSubscription = this._kalturaServerClient.request(
                    new TagSearchAction(
                        {
                            tagFilter: new KalturaTagFilter(
                                {
                                    tagStartsWith : text,
                                    objectTypeEqual : KalturaTaggedObjectType.entry
                                }
                            ),
                            pager: new KalturaFilterPager({
                                pageIndex : 0,
                                pageSize : 30
                            })
                        }
                    )
                )
                    .cancelOnDestroy(this, this.widgetReset$)
                    .subscribe(
                    result =>
                    {
                        const tags = result.objects.map(item => item.tag);
                        observer.next(tags);
                        observer.complete();
                    },
                    err =>
                    {
                        observer.error(err);
                    }
                );

                return () =>
                {
                    console.log("entryMetadataHandler.searchTags(): cancelled");
                    requestSubscription.unsubscribe();
                }
            });
    }

    public searchCategories(text : string)
    {
        return Observable.create(
            observer => {

                const requestSubscription = this._categoriesSearchService.getSuggestions(text)
                    .cancelOnDestroy(this, this.widgetReset$)
                    .subscribe(
                        result =>
                        {
                            observer.next(result);
                            observer.complete();
                        },
                        err =>
                        {
                            observer.error(err);
                        }
                    );

                return () =>
                {
                    console.log("entryMetadataHandler.searchTags(): cancelled");
                    requestSubscription.unsubscribe();
                }
            });
    }

    /**
     * Do some cleanups if needed once the section is removed
     */
    protected onReset() {

        this.metadataForm.reset({});
        this._entryCategoriesDiffers = null;
        this._entryCategories = [];
        this._entryMetadata = [];
        this.isLiveEntry = false;
    }

    private _markFormFieldsAsTouched() {
        for (const controlName in this.metadataForm.controls) {
            if (this.metadataForm.controls.hasOwnProperty(controlName)) {
                this.metadataForm.get(controlName).markAsTouched();
                this.metadataForm.get(controlName).updateValueAndValidity();
            }
        }
        this.metadataForm.updateValueAndValidity();
    }

    onValidate(wasActivated: boolean): Observable<{ isValid : boolean}> {
        return Observable.create(observer => {
            this._markFormFieldsAsTouched();
            const isValid = this.metadataForm.valid;
            observer.next({isValid});
            observer.complete();
        });
    }

    ngOnDestroy()
    {

    }
}
