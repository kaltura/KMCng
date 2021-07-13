import {Injectable, OnDestroy} from '@angular/core';
import {ReachProfileWidget} from '../reach-profile-widget';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {SettingsReachProfileViewSections} from "app-shared/kmc-shared/kmc-views/details-views";
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {KMCPermissions, KMCPermissionsService} from "app-shared/kmc-shared/kmc-permissions";
import {AppLocalization} from "@kaltura-ng/mc-shared";
import {Observable} from "rxjs";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import { asyncScheduler } from 'rxjs';
import {KalturaMultiRequest, KalturaReachProfile, KalturaVendorCatalogItemOutputFormat} from "kaltura-ngx-client";
import { observeOn } from 'rxjs/operators';
import { merge } from 'rxjs';
import { of } from 'rxjs';

@Injectable()
export class ReachProfileServiceWidget extends ReachProfileWidget implements OnDestroy {

    public formatOptions: { label: string, value: number }[] = [];

    public serviceForm: FormGroup;
    public formatField: AbstractControl;
    public maxField: AbstractControl;
    public machineField: AbstractControl;
    public humanField: AbstractControl;
    public metadataField: AbstractControl;
    public speakerField: AbstractControl;
    public audioField: AbstractControl;
    public removalField: AbstractControl;
    public useMachineCaptionsLabelField: AbstractControl;
    public machineCaptionsLabelField: AbstractControl;
    public useHumanCaptionsLabelField: AbstractControl;
    public humanCaptionsLabelField: AbstractControl;

    constructor(logger: KalturaLogger,
                private _permissionsService: KMCPermissionsService,
                private _appLocalization: AppLocalization,
                private _formBuilder: FormBuilder) {

        super(SettingsReachProfileViewSections.Service, logger);
        this._buildForm();
    }


    private _buildForm(): void {
        this.serviceForm = this._formBuilder.group({
            format: '',
            max: ['', Validators.required],
            machine: '',
            human: '',
            metadata: '',
            speaker: '',
            audio: '',
            removal: '',
            useMachineCaptionsLabel: '',
            machineCaptionsLabel: '',
            useHumanCaptionsLabel: '',
            humanCaptionsLabel: ''
        });

        this.formatField = this.serviceForm.controls['format'];
        this.maxField = this.serviceForm.controls['max'];
        this.machineField = this.serviceForm.controls['machine'];
        this.humanField = this.serviceForm.controls['human'];
        this.metadataField = this.serviceForm.controls['metadata'];
        this.speakerField = this.serviceForm.controls['speaker'];
        this.audioField = this.serviceForm.controls['audio'];
        this.removalField = this.serviceForm.controls['removal'];
        this.useMachineCaptionsLabelField = this.serviceForm.controls['useMachineCaptionsLabel'];
        this.machineCaptionsLabelField = this.serviceForm.controls['machineCaptionsLabel'];
        this.useHumanCaptionsLabelField = this.serviceForm.controls['useHumanCaptionsLabel'];
        this.humanCaptionsLabelField = this.serviceForm.controls['humanCaptionsLabel'];
    }

    private _monitorFormChanges(): void {
        merge(this.serviceForm.valueChanges, this.serviceForm.statusChanges)
            .pipe(cancelOnDestroy(this))
            .pipe(observeOn(asyncScheduler)) // using async scheduler so the form group status/dirty mode will be synchornized
            .subscribe(() => {
                    super.updateState({
                        isValid: this.serviceForm.status !== 'INVALID',
                        isDirty: this.serviceForm.dirty
                    });
                }
            );
    }

    protected onValidate(wasActivated: boolean): Observable<{ isValid: boolean }> {
        const formData = wasActivated ? this.serviceForm.value : this.data;
        const max = (formData.max.toString() || '').trim();
        const hasValue = max !== '';

        return of({
            isValid: hasValue
        });
    }

    protected onDataSaving(newData: KalturaReachProfile, request: KalturaMultiRequest): void {
        const formData = this.wasActivated ? this.serviceForm.value : this.data;
        newData.defaultOutputFormat = formData.format;
        newData.maxCharactersPerCaptionLine = formData.max;
        newData.autoDisplayMachineCaptionsOnPlayer = formData.machine;
        newData.autoDisplayHumanCaptionsOnPlayer = formData.human;
        newData.enableMetadataExtraction = formData.metadata;
        newData.enableSpeakerChangeIndication = formData.speaker;
        newData.enableAudioTags = formData.audio;
        newData.enableProfanityRemoval = formData.removal;
        if (formData.useMachineCaptionsLabel) {
            newData.labelAdditionForMachineServiceType = formData.machineCaptionsLabel;
        } else {
            newData.labelAdditionForMachineServiceType = '';
        }
        if (formData.useHumanCaptionsLabel) {
            newData.labelAdditionForHumanServiceType = formData.humanCaptionsLabel;
        } else {
            newData.labelAdditionForHumanServiceType = '';
        }
    }

    /**
     * Do some cleanups if needed once the section is removed
     */
    protected onReset(): void {
        this.formatOptions = [];
        this.serviceForm.reset();
    }

    protected onActivate(firstTimeActivating: boolean): Observable<{ failed: boolean }> | void {

        if (firstTimeActivating && (this.isNewData || this._permissionsService.hasPermission(KMCPermissions.REACH_PLUGIN_PERMISSION))) {
            this._monitorFormChanges();
        }

        this.formatOptions = [
            {label: this._appLocalization.get('applications.settings.reach.service.formatOptions.dfxp'), value: KalturaVendorCatalogItemOutputFormat.dfxp},
            {label: this._appLocalization.get('applications.settings.reach.service.formatOptions.srt'), value: KalturaVendorCatalogItemOutputFormat.srt}
        ];

        this.serviceForm.reset({
            format: this.data.defaultOutputFormat,
            max: this.data.maxCharactersPerCaptionLine,
            machine: this.data.autoDisplayMachineCaptionsOnPlayer,
            human: this.data.autoDisplayHumanCaptionsOnPlayer,
            metadata: this.data.enableMetadataExtraction,
            speaker: this.data.enableSpeakerChangeIndication,
            audio: this.data.enableAudioTags,
            removal: this.data.enableProfanityRemoval,
            useMachineCaptionsLabel: this.data.labelAdditionForMachineServiceType && this.data.labelAdditionForMachineServiceType.length,
            machineCaptionsLabel: this.data.labelAdditionForMachineServiceType || this._appLocalization.get('applications.settings.reach.settings.defaultMachineCaptionsLabel'),
            useHumanCaptionsLabel: this.data.labelAdditionForHumanServiceType && this.data.labelAdditionForHumanServiceType.length,
            humanCaptionsLabel: this.data.labelAdditionForHumanServiceType
        });
    }

    ngOnDestroy() {}
}
