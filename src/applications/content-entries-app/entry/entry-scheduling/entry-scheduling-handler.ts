import { Injectable, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, AbstractControl, ValidatorFn } from '@angular/forms';

import { KalturaUtils, KalturaServerClient } from '@kaltura-ng2/kaltura-api';
import { AppLocalization } from '@kaltura-ng2/kaltura-common';

import { EntrySectionTypes } from '../../entry-store/entry-sections-types';
import { EntrySectionHandler, OnSectionLoadedArgs } from '../../entry-store/entry-section-handler';
import { EntryStore } from '../../entry-store/entry-store.service';
import { EntryLoaded } from '../../entry-store/entry-sections-events';
import '@kaltura-ng2/kaltura-common/rxjs/add/operators';


function validate(fromSave: boolean = false): ValidatorFn{
	return (c: AbstractControl): {[key: string]: boolean} | null => {
		const startDate = c.get('startDate').value;
		const endDate = c.get('endDate').value;
		const scheduling = c.get('scheduling').value;
		const enableEndDate = c.get('enableEndDate').value;

		if (fromSave && scheduling === "scheduled"){
			if (!startDate) {
				return { 'noStartDate': true };
			}
			if (enableEndDate && !endDate){
				return { 'noEndDate': true };
			}
		}

		if (startDate && endDate && startDate > endDate){
			return { 'endDateBeforeStartDate': true };
		}

		return null;
	}
}

@Injectable()
export class EntrySchedulingHandler extends EntrySectionHandler
{
	public schedulingForm: FormGroup;
	public _timeZone = "";

	public saving: boolean = false;

    constructor(store : EntryStore, kalturaServerClient: KalturaServerClient, private appLocalization: AppLocalization, private fb: FormBuilder)
    {
        super(store, kalturaServerClient);
	    this.createForm();
	    this.getTimeZone();
    }

	protected _onSectionLoaded(data : OnSectionLoadedArgs): void {
		this._resetForm();
	}

	private _resetForm(){
		let scheduleSettings = "anytime";
		let startDate = "";
		let endDate = "";
		let enableEndDate = false;
		if (this.entry && this.entry.startDate){
			scheduleSettings = "scheduled";
			this.schedulingForm.get('startDate').enable();
			let startDate = KalturaUtils.fromServerDate(this.entry.startDate);
			if (this.entry.endDate){
				this.schedulingForm.get('endDate').enable();
				enableEndDate = true;
				endDate = KalturaUtils.fromServerDate(this.entry.endDate);
			}
		}
		this.schedulingForm.reset({
			scheduling: scheduleSettings,
			startDate: startDate,
			endDate: endDate,
			enableEndDate: enableEndDate
		});
	}

    private createForm(): void{
    	this.schedulingForm = this.fb.group({
		    scheduling: 'anytime',
		    startDate: {value: '', disabled: true},
		    endDate: {value: '', disabled: true},
		    enableEndDate: false
	    }, { validator: validate(this.saving) });
	    this.schedulingForm.get('scheduling').valueChanges
		    .cancelOnDestroy(this)
		    .subscribe(
	    	value => {
	    		if (value === "anytime"){
				    this.schedulingForm.get('startDate').disable();
				    this.schedulingForm.get('endDate').disable();
				    this.schedulingForm.get('enableEndDate').disable();
			    }else{
				    this.schedulingForm.get('startDate').enable();
				    this.schedulingForm.get('enableEndDate').enable();
				    if (this.schedulingForm.get('enableEndDate').value){
					    this.schedulingForm.get('endDate').enable();
				    }

			    }
		    }
	    );
	    this.schedulingForm.get('enableEndDate').valueChanges
		    .cancelOnDestroy(this)
		    .subscribe(
		    value => {
			    if (value){
				    this.schedulingForm.get('endDate').enable();
			    }else{

				    this.schedulingForm.get('endDate').disable();
			    }
		    }
	    );
    }


	public _clearDates(){
		this.schedulingForm.patchValue({
			startDate: '',
			endDate: ''
		});
	}

	private getTimeZone(){
		this._timeZone = this.appLocalization.get('applications.content.entryDetails.scheduling.note');
		const now: any = new Date();
		const zoneTimeOffset:number = (now.getTimezoneOffset() / 60) * (-1);
		const ztStr: string = (zoneTimeOffset == 0) ? '' : (zoneTimeOffset > 0) ? ('+' + zoneTimeOffset) : ('-' + zoneTimeOffset);
		this._timeZone = this._timeZone.split("(NUM)").join(ztStr);
	}

	public get sectionType() : EntrySectionTypes
	{
		return EntrySectionTypes.Scheduling;
	}
    /**
     * Do some cleanups if needed once the section is removed
     */
	protected _onSectionReset()
	{
		this.schedulingForm.reset();
		this.saving = false;
	}

}
