import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';
import { KalturaClient } from 'kaltura-ngx-client';
import { BaseEntryGetAction } from 'kaltura-ngx-client/api/types/BaseEntryGetAction';
import { DynamicFormControlBase } from '@kaltura-ng/kaltura-ui/dynamic-form/dynamic-form-control-base';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui/area-blocker/area-blocker-message';
import { KalturaUtils } from '@kaltura-ng/kaltura-common/utils/kaltura-utils';
import { AppLocalization } from '@kaltura-ng/kaltura-common/localization/app-localization.service';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';


@Component({
  selector: 'k-linked-entries',
  templateUrl: './linked-entries.component.html',
  styleUrls: ['./linked-entries.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: LinkedEntriesComponent,
    multi: true
  }]
})
export class LinkedEntriesComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() control: DynamicFormControlBase<any>;
  @Input() form: FormGroup;

  private _innerValue: string[] = [];

  public _blockerMessage: AreaBlockerMessage;
  public _showLoader = false;
  public _selectedEntries: KalturaMediaEntry[] = [];
  public _entries = [];
  public _isReady = false;

  private onTouchedCallback: () => void = () => {};
  private onChangeCallback: (_: any) => void = () => {};

  constructor(private _kalturaClient: KalturaClient,
              private _appLocalization: AppLocalization) {
  }

  ngOnInit() {
    this._isReady = true;
  }

  ngOnDestroy() {
  }

  private _updateEntries() {
    this._entries = [];

    if (this._innerValue && this._innerValue.length) {
      this._blockerMessage = null;
      this._showLoader = true;

      const requests = this._innerValue.map(entryId => new BaseEntryGetAction({ entryId }));

      this._kalturaClient.multiRequest(requests)
        .subscribe(
          responses => {
            if (responses.hasErrors()) {
              this._blockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.content.entryDetails.errors.entriesLoadError'), buttons: [
                  {
                    label: this._appLocalization.get('applications.content.entryDetails.errors.retry'),
                    action: () => {
                      this._updateEntries();
                    }
                  }
                ]
              });
            } else {
              this._entries = responses.map((response) => ({
                id: response.result.id,
                name: response.result.name,
                thumbnailUrl: response.result.thumbnailUrl
              }));
              this._showLoader = false;
            }
          }
        );
    }
  }

  private _propogateChanges() {
    this._innerValue = (this._entries || []).map(entry => entry.id);
    this.onChangeCallback(this._innerValue);
  }

  // Set touched on blur
  public onBlur(): void {
    this.onTouchedCallback();
  }

  // From ControlValueAccessor interface
  public writeValue(value: any): void {
    if (value !== this._innerValue) {
      this._innerValue = value || [];
      this._updateEntries();
    }
  }

  // From ControlValueAccessor interface
  public registerOnChange(fn: any): void {
    this.onChangeCallback = fn;
  }

  // From ControlValueAccessor interface
  public registerOnTouched(fn: any): void {
    this.onTouchedCallback = fn;
  }

  public _deleteEntry(entry) {
    this._clearSelection();
    this._entries.splice(this._entries.indexOf(entry), 1);
    this._propogateChanges();
  }


  public _moveUpSelections() {
    if (KalturaUtils.moveUpItems(this._entries, this._selectedEntries)) {
      this._propogateChanges();
    }
  }

  public _moveDownSelections() {
    if (KalturaUtils.moveDownItems(this._entries, this._selectedEntries)) {
      this._propogateChanges();
    }
  }

  public _deleteSelections() {
    if (this._selectedEntries && this._selectedEntries.length) {
      this._selectedEntries.forEach(selectedEntry => {
        const selectedEntryIndex = this._entries.indexOf(selectedEntry);

        if (selectedEntryIndex >= 0) {
          this._entries.splice(selectedEntryIndex, 1);
        }
      });

      this._propogateChanges();
    }
  }

  public _clearSelection(): void {
    this._selectedEntries = [];
  }
}
