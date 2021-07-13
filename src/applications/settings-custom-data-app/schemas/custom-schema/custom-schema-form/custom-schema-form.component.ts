import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SettingsMetadataProfile } from '../../schemas-store/settings-metadata-profile.interface';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KalturaMetadataObjectType } from 'kaltura-ngx-client';
import { KalturaAPIException } from 'kaltura-ngx-client';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';

@Component({
  selector: 'kCustomSchemaForm',
  templateUrl: './custom-schema-form.component.html',
  styleUrls: ['./custom-schema-form.component.scss']
})
export class CustomSchemaFormComponent {

    public _kmcPermissions = KMCPermissions;

  @Input() set serverValidationError(value: KalturaAPIException) {
    if (value) {
      if (value.code === 'SYSTEM_NAME_ALREADY_EXISTS') {
        this._systemNameField.setErrors({ 'incorrect': true });
      }
    }
  }

  @Input() set schema(value: SettingsMetadataProfile) {
      if (value) {
          this._schema = value;
          this._schemaForm.patchValue(
              {
                  name: (value.name || '').trim(),
                  description: value.description,
                  systemName: value.systemName,
                  applyTo: value.applyTo
              },
              {emitEvent: false}
          );

          if (!this._schema.isNew) {

              if (!this._permissionsService.hasPermission(KMCPermissions.CUSTOM_DATA_PROFILE_UPDATE)) {
                  this._schemaForm.disable();
              } else {
                  this._schemaForm.get('applyTo').disable({onlySelf: true});
              }
          }

      } else {
          throw Error('schema must be provided');
      }
  }

  @Output() schemaChanges = new EventEmitter<SettingsMetadataProfile>();

  private _schema: SettingsMetadataProfile;

  public _schemaForm: FormGroup;
  public _nameField: AbstractControl;
  public _descriptionField: AbstractControl;
  public _systemNameField: AbstractControl;
  public _applyToField: AbstractControl;
  public _applyToValues = {
    entry: KalturaMetadataObjectType.entry.toString(),
    category: KalturaMetadataObjectType.category.toString(),
    userEntry: KalturaMetadataObjectType.userEntry.toString()
  };
    public _nameMaxLength = 32;

    public get isValid(): boolean {
        return this._schemaForm.valid;
    }

  constructor(private _fb: FormBuilder,
              private _permissionsService: KMCPermissionsService,
  ) {
    this._buildForm();
  }

  private _buildForm(): void {
    this._schemaForm = this._fb.group({
      name: ['', Validators.compose([Validators.required, Validators.maxLength(this._nameMaxLength)])],
      description: '',
      systemName: '',
      applyTo: KalturaMetadataObjectType.entry.toString()
    });

    this._nameField = this._schemaForm.controls['name'];
    this._descriptionField = this._schemaForm.controls['description'];
    this._systemNameField = this._schemaForm.controls['systemName'];

    this._schemaForm.valueChanges.subscribe((change) => {
      let sendUpdate = false;
      if (this._schema.name !== change.name) {
        this._schema.name = (change.name || '').trim();;
        sendUpdate = true;
      }

      if (this._schema.description !== change.description) {
        this._schema.description = (change.description || '').trim();
        sendUpdate = true;
      }

      if (this._schema.systemName !== change.systemName) {
        this._schema.systemName = change.systemName.trim();
        sendUpdate = true;
      }

      if (change.applyTo) {
        const applyTo = change.applyTo;
        if (this._schema.applyTo !== applyTo) {
          this._schema.applyTo = applyTo;
          sendUpdate = true;
        }
      }

      if (sendUpdate) {
        this.schemaChanges.emit(this._schema);
      }
    });
  }
}

