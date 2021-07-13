import { Injectable, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, AbstractControl, ValidatorFn } from '@angular/forms';
import { Observable } from 'rxjs';
import { KalturaMultiRequest } from 'kaltura-ngx-client';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { EntryWidget } from '../entry-widget';
import { asyncScheduler } from 'rxjs';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { ContentEntryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-entry-view.service';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import { observeOn } from 'rxjs/operators';
import { merge } from 'rxjs';

function datesValidation(checkRequired: boolean = false): ValidatorFn {
	return (c: AbstractControl): {[key: string]: boolean} | null => {
		const startDate = c.get('startDate').value;
		const endDate = c.get('endDate').value;
		const scheduling = c.get('scheduling').value;
		const enableEndDate = c.get('enableEndDate').value;
		if (checkRequired && scheduling === "scheduled"){
			if (!startDate) {
				return { 'noStartDate': true };
			}
			if (enableEndDate && !endDate){
				return { 'noEndDate': true };
			}
		}

		if (scheduling === "scheduled" && startDate && endDate && startDate > endDate){
			return { 'endDateBeforeStartDate': true };
		}

		return null;
	}
}

@Injectable()
export class EntrySchedulingWidget extends EntryWidget implements OnDestroy
{
	public schedulingForm: FormGroup;
	public _timeZone = "";

    constructor(
				private _appLocalization: AppLocalization,
				private _permissionsService: KMCPermissionsService,
				private _fb: FormBuilder,
                logger: KalturaLogger)
    {
        super(ContentEntryViewSections.Scheduling, logger);
	    this.createForm();
    }

	protected onActivate(firstTimeActivating: boolean): void {
		this._syncForm();
		this.setValidators(false);
	}

	protected onDataSaving(data: KalturaMediaEntry, request: KalturaMultiRequest)
	{
		const startDate = this.schedulingForm.get('startDate').value;
		const endDate = this.schedulingForm.get('endDate').value;
		const scheduling = this.schedulingForm.get('scheduling').value;
		const enableEndDate = this.schedulingForm.get('enableEndDate').value;

		if (scheduling === "scheduled"){
			if (startDate) {
				data.startDate = startDate;
			}
			if (enableEndDate && endDate){
				data.endDate = endDate;
			}else{
				data.endDate = null;
			}
		}else{
			data.startDate = null;
			data.endDate = null;
		}
	}

	private _syncForm(){
		let scheduleSettings = "anytime";
		let startDate = null;
		let endDate = null;
		let enableEndDate = false;
		if (this.data && this.data.startDate){
			scheduleSettings = "scheduled";
			this.schedulingForm.get('startDate').enable();
			startDate = this.data.startDate;
		}
		if (this.data && this.data.endDate){
            scheduleSettings = "scheduled";
            endDate = this.data.endDate;
            enableEndDate = true;
            this.schedulingForm.get('endDate').enable();
        }

		this.schedulingForm.reset({
			scheduling: scheduleSettings,
			startDate: startDate,
			endDate: endDate,
			enableEndDate: enableEndDate
		});

    if (!this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_SCHEDULE)) {
      this.schedulingForm.disable({ emitEvent: false });
    }
  }

  private createForm(): void {
    this.schedulingForm = this._fb.group({
      scheduling: 'anytime',
      startDate: { value: '', disabled: true },
      endDate: { value: '', disabled: true },
      enableEndDate: false
    }, { validator: datesValidation(false) });

    if (this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_SCHEDULE)) {
      this.schedulingForm.get('scheduling').valueChanges
        .pipe(cancelOnDestroy(this))
        .subscribe(
          value => {
            if (value === 'anytime') {
              this.schedulingForm.get('startDate').disable();
              this.schedulingForm.get('endDate').disable();
              this.schedulingForm.get('enableEndDate').disable();
            } else {
              this.schedulingForm.get('startDate').enable();
              this.schedulingForm.get('enableEndDate').enable();
              if (this.schedulingForm.get('enableEndDate').value) {
                this.schedulingForm.get('endDate').enable();
              }

            }
          }
        );
      this.schedulingForm.get('enableEndDate').valueChanges
        .pipe(cancelOnDestroy(this))
        .subscribe(
          value => {
            if (value) {
              this.schedulingForm.get('endDate').enable();
            } else {

              this.schedulingForm.get('endDate').disable();
            }
          }
        );

      merge(this.schedulingForm.valueChanges,
        this.schedulingForm.statusChanges)
        .pipe(observeOn(asyncScheduler)) // using async scheduler so the form group status/dirty mode will be synchornized
        .pipe(cancelOnDestroy(this))
        .subscribe(
          () => {
            super.updateState({
              isValid: this.schedulingForm.status !== 'INVALID',
              isDirty: this.schedulingForm.dirty
            });
          }
        );
    }
  }


	public _clearDates(){
		this.schedulingForm.markAsDirty();
		this.schedulingForm.patchValue({
			startDate: '',
			endDate: ''
		});
	}

	private setValidators(checkRequired: boolean){
		this.schedulingForm.clearValidators();
		this.schedulingForm.setValidators(datesValidation(checkRequired));
		this.schedulingForm.updateValueAndValidity();
	}

	protected onValidate(wasActivated: boolean) : Observable<{ isValid : boolean}>
	{
		return Observable.create(observer =>
		{
			this.setValidators(true);
			const isValid = !this.schedulingForm.errors;
			observer.next({ isValid });
			observer.complete()
		});
	}

    /**
     * Do some cleanups if needed once the section is removed
     */
	protected onReset()
	{
		this.schedulingForm.reset();
	}

    ngOnDestroy()
    {

    }
}
