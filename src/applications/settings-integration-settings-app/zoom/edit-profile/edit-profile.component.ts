import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import {
    KalturaClient,
    KalturaFilterPager,
    KalturaNullableBoolean, KalturaUser, KalturaUserFilter,
    KalturaZoomIntegrationSetting,
    KalturaZoomUsersMatching,
    UserListAction
} from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";
import { Subject } from "rxjs";
import { SuggestionsProviderData } from "@kaltura-ng/kaltura-primeng-ui";
import { ISubscription } from "rxjs/Subscription";
import { Observable } from "rxjs";
import { CategoriesSearchService } from "app-shared/content-shared/categories/categories-search.service";
import { BrowserService } from "app-shared/kmc-shell";

@Component({
    selector: 'kZoomEditProfile',
    templateUrl: './edit-profile.component.html',
    styleUrls: ['./edit-profile.component.scss'],
    providers: [CategoriesSearchService, KalturaLogger.createLogger('EditZoomProfileComponent')]
})
export class EditZoomProfileComponent implements OnInit, OnDestroy {
    @Input() parentPopup: PopupWidgetComponent;
    @Input() profile: KalturaZoomIntegrationSetting | null;

    @Output() onSave = new EventEmitter<KalturaZoomIntegrationSetting>();

    public _profileForm: FormGroup;
    public formValid = true;

    public _recordingUpload: AbstractControl;
    public _accountId: AbstractControl;
    public _description: AbstractControl;
    public _deleteContent: AbstractControl;
    public _transcription: AbstractControl;
    public _defaultUserId: AbstractControl;
    public _userId: AbstractControl;
    public _postfix: AbstractControl;
    public _userPostfix: AbstractControl;
    public _participation: AbstractControl;
    public _categories: AbstractControl;
    public _createUser: AbstractControl;
    public _uploadMeeting: AbstractControl;
    public _uploadWebinar: AbstractControl;
    public _webinarCategory: AbstractControl;

    public _categoriesProvider = new Subject<SuggestionsProviderData>();
    private _searchCategoriesSubscription: ISubscription;
    public _usersProvider = new Subject<SuggestionsProviderData>();

    public _showDeleteContent = true;
    public _showTranscription = true;
    public _enableMeetingUpload = false;

    private _searchUsersSubscription: ISubscription;

    constructor(private _appLocalization: AppLocalization,
                private _fb: FormBuilder,
                private _browserService: BrowserService,
                private _kalturaServerClient: KalturaClient,
                private _categoriesSearchService: CategoriesSearchService,
                private _logger: KalturaLogger) {
        this._buildForm();
    }

    ngOnInit() {
        if (this.profile) {
            this._showDeleteContent = typeof this.profile.deletionPolicy !== "undefined";
            this._showTranscription = typeof this.profile.enableZoomTranscription !== "undefined";
            this._enableMeetingUpload = typeof this.profile.enableMeetingUpload !== "undefined";
            this._setInitialValue(this.profile);
        }
    }

    ngOnDestroy() {
        this._categoriesProvider.complete();
        this._usersProvider.complete();
    }

    private _setInitialValue(profile: KalturaZoomIntegrationSetting): void {
        this._profileForm.setValue({
            enabled: profile.enableRecordingUpload === KalturaNullableBoolean.trueValue,
            accountId: profile.accountId || '',
            defaultUserId: profile.defaultUserId ? [{screenName: profile.defaultUserId}] : [],
            description: profile.zoomAccountDescription || '',
            deleteContent: profile.deletionPolicy === KalturaNullableBoolean.trueValue,
            transcription: profile.enableZoomTranscription === KalturaNullableBoolean.trueValue,
            userId: profile.zoomUserMatchingMode !== KalturaZoomUsersMatching.cmsMatching,
            createUser: profile.createUserIfNotExist === KalturaNullableBoolean.trueValue,
            postfix: profile.zoomUserMatchingMode,
            userPostfix: profile.zoomUserPostfix,
            participation: profile.handleParticipantsMode,
            categories: profile.zoomCategory ? [{name: profile.zoomCategory}] : [],
            webinarCategory: profile.zoomWebinarCategory ? [{name: profile.zoomWebinarCategory}] : [],
            uploadMeeting: typeof profile.enableMeetingUpload === "undefined" || profile.enableMeetingUpload === KalturaNullableBoolean.trueValue,
            uploadWebinar: profile.enableWebinarUploads === KalturaNullableBoolean.trueValue
        });
        this.validate();
    }

    private _buildForm(): void {
        this._profileForm = this._fb.group({
            enabled: false,
            accountId: [''],
            defaultUserId: [[]],
            description: [''],
            deleteContent: false,
            transcription: false,
            createUser: false,
            userId: false,
            postfix: null,
            userPostfix: [''],
            participation: null,
            categories: [[]],
            webinarCategory: [[]],
            uploadMeeting: false,
            uploadWebinar: false
        });

        this._recordingUpload = this._profileForm.controls['enabled'];
        this._accountId = this._profileForm.controls['accountId'];
        this._accountId.disable();
        this._defaultUserId = this._profileForm.controls['defaultUserId'];
        this._description = this._profileForm.controls['description'];
        this._deleteContent = this._profileForm.controls['deleteContent'];
        this._transcription = this._profileForm.controls['transcription'];
        this._userId = this._profileForm.controls['userId'];
        this._createUser = this._profileForm.controls['createUser'];
        this._postfix = this._profileForm.controls['postfix'];
        this._userPostfix = this._profileForm.controls['userPostfix'];
        this._participation = this._profileForm.controls['participation'];
        this._categories = this._profileForm.controls['categories'];
        this._webinarCategory = this._profileForm.controls['webinarCategory'];
        this._uploadMeeting = this._profileForm.controls['uploadMeeting'];
        this._uploadWebinar = this._profileForm.controls['uploadWebinar'];
        if (!this._enableMeetingUpload) {
            this._uploadMeeting.disable();
        }

        this._recordingUpload.valueChanges
            .pipe(cancelOnDestroy(this))
            .subscribe(value => {
                if (value) {
                    this._description.enable();
                    this._deleteContent.enable();
                    this._transcription.enable();
                    this._userId.enable();
                    this._defaultUserId.enable();
                    this._createUser.enable();
                    this._postfix.enable();
                    this._userPostfix.enable();
                    this._participation.enable();
                    this._categories.enable();
                    this._webinarCategory.enable();
                    if (this._enableMeetingUpload) {
                        this._uploadMeeting.enable();
                    }
                    this._uploadWebinar.enable();
                } else {
                    this._description.disable();
                    this._deleteContent.disable();
                    this._transcription.disable();
                    this._userId.disable();
                    this._createUser.disable();
                    this._postfix.disable();
                    this._userPostfix.disable();
                    this._participation.disable();
                    this._categories.disable();
                    this._defaultUserId.disable();
                    this._webinarCategory.disable();
                    this._uploadMeeting.disable();
                    this._uploadWebinar.disable();
                }
            });
        this._userId.valueChanges
            .pipe(cancelOnDestroy(this))
            .subscribe(value => {
                if (value === false) {
                    this._postfix.disable();
                    this._userPostfix.disable();
                    this._profileForm.patchValue({
                        postfix: KalturaZoomUsersMatching.cmsMatching
                    });
                } else if (this._profileForm.controls['enabled'].value){
                    this._postfix.enable();
                    this._profileForm.patchValue({
                        postfix: KalturaZoomUsersMatching.doNotModify
                    });
                    this._userPostfix.enable();
                }
            });
        /*
        this._postfix.valueChanges
            .pipe(cancelOnDestroy(this))
            .subscribe(value => {
                if (value === KalturaZoomUsersMatching.addPostfix && (this._profileForm.controls['enabled'].value)) {
                    this._userPostfix.enable();
                } else {
                    this._userPostfix.disable();
                }
            });*/
        this._createUser.valueChanges
            .pipe(cancelOnDestroy(this))
            .subscribe(value => {
                if (value) {
                    this._defaultUserId.disable();
                } else if (this._profileForm.controls['enabled'].value) {
                    this._defaultUserId.enable();
                }
                this.validate();
            });
        this._defaultUserId.valueChanges
            .pipe(cancelOnDestroy(this))
            .subscribe(value => {
                this.validate();
            });
    }

    private validate(): void {
        const formValue = this._profileForm.getRawValue();
        this.formValid = formValue.defaultUserId.length || (!formValue.defaultUserId.length && formValue.createUser);
    }

    public openHelpLink(): void {
        this._browserService.openLink('https://marketplace.zoom.us/docs/api-reference/zoom-api/users/user');
    }

    public _save(): void {
        this._logger.info(`handle 'save' action by the user`);
        const formValue = this._profileForm.getRawValue();
        this.profile.enableRecordingUpload = formValue.enabled ? KalturaNullableBoolean.trueValue : KalturaNullableBoolean.falseValue;
        this.profile.zoomAccountDescription = formValue.description;
        this.profile.defaultUserId = formValue.defaultUserId.length ? formValue.defaultUserId[0].screenName : '';
        this.profile.zoomCategory = formValue.categories.length ? formValue.categories[0].name : '';
        this.profile.zoomWebinarCategory = formValue.webinarCategory.length ? formValue.webinarCategory[0].name : '';
        if (this._showDeleteContent) {
            this.profile.deletionPolicy = formValue.deleteContent ? KalturaNullableBoolean.trueValue : KalturaNullableBoolean.falseValue;
        }
        this.profile.createUserIfNotExist = formValue.createUser ? KalturaNullableBoolean.trueValue : KalturaNullableBoolean.falseValue;
        if (this._showTranscription) {
            this.profile.enableZoomTranscription = formValue.transcription ? KalturaNullableBoolean.trueValue : KalturaNullableBoolean.falseValue;
        }
        if (this._enableMeetingUpload) {
            this.profile.enableMeetingUpload = formValue.uploadMeeting ? KalturaNullableBoolean.trueValue : KalturaNullableBoolean.falseValue;
        }
        this.profile.enableWebinarUploads = formValue.uploadWebinar ? KalturaNullableBoolean.trueValue : KalturaNullableBoolean.falseValue;
        if (formValue.userId) {
            this.profile.zoomUserMatchingMode = formValue.postfix;
        } else {
            this.profile.zoomUserMatchingMode = KalturaZoomUsersMatching.cmsMatching;
        }
        this.profile.zoomUserPostfix = formValue.userPostfix;
        this.profile.handleParticipantsMode = formValue.participation;
        this.onSave.emit(this.profile);
        this.parentPopup.close();
    }

    /* ---------------------------- categories auto complete code starts ------------------------- */

    public _searchCategories(event): void {
        this._categoriesProvider.next({suggestions: [], isLoading: true});
        if (this._searchCategoriesSubscription) {
            // abort previous request
            this._searchCategoriesSubscription.unsubscribe();
            this._searchCategoriesSubscription = null;
        }
        this._searchCategoriesSubscription = this.searchCategories(event.query).subscribe(data => {
                const suggestions = [];
                const profileCategories = this.profile.zoomCategory.split(',');
                (data || []).forEach(suggestedCategory => {
                    const label = suggestedCategory.fullName + (suggestedCategory.referenceId ? ` (${suggestedCategory.referenceId})` : '');
                    const isSelectable = !profileCategories.find(category => {
                        return category === suggestedCategory.name;
                    });
                    suggestions.push({name: label, isSelectable: isSelectable, item: suggestedCategory});
                });
                this._categoriesProvider.next({suggestions: suggestions, isLoading: false});
            },
            (err) => {
                this._categoriesProvider.next({
                    suggestions: [],
                    isLoading: false,
                    errorMessage: <any>(err.message || err)
                });
            });
    }

    private searchCategories(text: string) {
        return Observable.create(
            observer => {
                const requestSubscription = this._categoriesSearchService.getSuggestions(text)
                    .pipe(cancelOnDestroy(this))
                    .subscribe(
                        result => {
                            observer.next(result);
                            observer.complete();
                        },
                        err => {
                            observer.error(err);
                        }
                    );
                return () => {
                    console.log("zoom profile edit: searchCategories(): cancelled");
                    requestSubscription.unsubscribe();
                }
            });
    }

    public _categoriesTooltipResolver = (value: any) => {
        return value.name;
    };

    /* ---------------------------- categories auto complete code ends ------------------------- */


    /* ---------------------------- users auto complete code start ------------------------- */

    public _searchUsers(event): void {
        this._logger.info(`handle search users action`, { query: event.query });
        this._usersProvider.next({suggestions: [], isLoading: true});

        if (this._searchUsersSubscription) {
            // abort previous request
            this._searchUsersSubscription.unsubscribe();
            this._searchUsersSubscription = null;
        }

        this._searchUsersSubscription = this._kalturaServerClient.request(
            new UserListAction(
                {
                    filter: new KalturaUserFilter({
                        idOrScreenNameStartsWith: event.query
                    }),
                    pager: new KalturaFilterPager({
                        pageIndex: 0,
                        pageSize: 30
                    })
                }
            )
        )
            .pipe(cancelOnDestroy(this))
            .subscribe(
                data => {
                    this._logger.info(`handle successful search users action`);
                    const suggestions = [];
                    (data.objects || []).forEach((suggestedUser: KalturaUser) => {
                        suggestions.push({
                            name: suggestedUser.screenName + '(' + suggestedUser.id + ')',
                            item: suggestedUser,
                            isSelectable: true
                        });
                    });
                    this._usersProvider.next({suggestions: suggestions, isLoading: false});
                },
                err => {
                    this._logger.warn(`handle successful search users action`, { errorMessage: err.message });
                    this._usersProvider.next({suggestions: [], isLoading: false, errorMessage: <any>(err.message || err)});
                }
            );
    }

    public _usersTooltipResolver = (value: any) => {
        return value.screenName;
    };

    /* ---------------------------- users auto complete code ends ------------------------- */


}

