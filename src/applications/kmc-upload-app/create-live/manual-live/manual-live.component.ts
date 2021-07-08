import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {KalturaValidators} from '@kaltura-ng/kaltura-ui';
import {ManualLive} from './manual-live.interface';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
@Component({
  selector: 'kManualLive',
  templateUrl: './manual-live.component.html',
  styleUrls: ['./manual-live.component.scss'],
})
export class ManualLiveComponent implements OnInit, OnDestroy {

  public _form: FormGroup;
  public _streamUrlForm: FormGroup;

  @Input()
  data: ManualLive;

  @Output()
  dataChange = new EventEmitter<ManualLive>();

  @Input()
  blockerState: { isBusy: boolean, message: AreaBlockerMessage };

  @Output()
  blockerStateChange = new EventEmitter<{ isBusy: boolean, message: AreaBlockerMessage }>();

  constructor(private _fb: FormBuilder) {
  }

  ngOnInit(): void {
    this._createForm();
    this._form.reset({
      name: this.data.name,
      description: this.data.description,
      useAkamaiHdProtocol: this.data.useAkamaiHdProtocol,
      streamUrl: {
        flashHDSURL: this.data.flashHDSURL,
        hlsStreamUrl: this.data.hlsStreamUrl,
        dashStreamUrl: this.data.dashStreamUrl
      }
    });
  }

  ngOnDestroy(): void {
  }

  public validate(): boolean {
    if (!this._form.valid) {
      this.markFormFieldsAsTouched();
    }
    return this._form.valid;
  }


  public isFormDirty(): boolean {
    return this._form.dirty;
  }


  // Create empty structured form on loading
  private _createForm(): void {
    this._streamUrlForm = this._fb.group({
        flashHDSURL: ['', KalturaValidators.url],
        hlsStreamUrl: ['', KalturaValidators.url],
        dashStreamUrl: ['', KalturaValidators.url]
      },
      {
        validator: (formGroup: FormGroup) => {
          return this._atLeastOneUrlValidator(formGroup);
        }
      });

    this._form = this._fb.group({
      name: ['', Validators.required],
      description: [''],
      streamUrl: this._streamUrlForm,
      useAkamaiHdProtocol: [true]
    });

    this._form
      .valueChanges
      .pipe(cancelOnDestroy(this))
      .subscribe(data => {
        this.dataChange.emit({
            name: data.name,
            description: data.description,
            useAkamaiHdProtocol: data.useAkamaiHdProtocol,
            flashHDSURL: data.streamUrl.flashHDSURL,
            hlsStreamUrl: data.streamUrl.hlsStreamUrl,
            dashStreamUrl: data.streamUrl.dashStreamUrl
          });
      });
  }

  private _atLeastOneUrlValidator(formgroup: FormGroup) {
    if (!formgroup.controls['flashHDSURL'].value &&
        !formgroup.controls['hlsStreamUrl'].value &&
        !formgroup.controls['dashStreamUrl'].value) {
      return {atLeastOneUrl: true};
    } else {
      return null;
    }
  }


  private markFormFieldsAsTouched(): void {
    for (const inner in this._form.controls) {
      this._form.get(inner).markAsTouched();
      this._form.get(inner).updateValueAndValidity();
    }
  }
}
