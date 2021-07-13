import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { MetadataItem, MetadataItemTypes } from 'app-shared/kmc-shared/custom-metadata/metadata-profile';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { PopupWidgetComponent, PopupWidgetStates } from '@kaltura-ng/kaltura-ui';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { KalturaMetadataObjectType } from "kaltura-ngx-client";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'kCustomSchemaFieldForm',
  templateUrl: './custom-schema-field-form.component.html',
  styleUrls: ['./custom-schema-field-form.component.scss'],
  providers: [KalturaLogger.createLogger('CustomSchemaFieldFormComponent')]
})
export class CustomSchemaFieldFormComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() field: MetadataItem | null;

  @Input() set applyTo(type: KalturaMetadataObjectType){
    this._isUserEntry = type === KalturaMetadataObjectType.userEntry;
  };

  @Input() fields: MetadataItem[] | null;

  @Input() parentPopupWidget: PopupWidgetComponent;

  @Output() onSave = new EventEmitter<MetadataItem>();

  private _field: MetadataItem;
  public _isNew = true;
  public _isUserEntry = true;
  private _systemNames: string[] = [];

  private get _requiredFieldsIsDirty(): boolean {
      return this._labelField.dirty || this._includeTimeField.dirty || this._listValuesFiled.dirty;
  }

  public _saveDisabled = false;
  public _title: string;
  public _saveBtnLabel: string;
  public _fieldForm: FormGroup;
  public _typeField: AbstractControl;
  public _labelField: AbstractControl;
  public _allowMultipleField: AbstractControl;
  public _shortDescriptionField: AbstractControl;
  public _descriptionField: AbstractControl;
  public _searchableField: AbstractControl;
  public _hiddenField: AbstractControl;
  public _requiredField: AbstractControl;
  // optional fields
  public _includeTimeField: AbstractControl;
  public _listValuesFiled: AbstractControl;
  public _systemName: string;

  public _metadataItemTypes = MetadataItemTypes;
  public _fieldTypes = [
    {
      label: this._appLocalization.get('applications.settings.metadata.type.text'),
      value: MetadataItemTypes.Text
    },
    {
      label: this._appLocalization.get('applications.settings.metadata.type.date'),
      value: MetadataItemTypes.Date
    },
    {
      label: this._appLocalization.get('applications.settings.metadata.type.object'),
      value: MetadataItemTypes.Object
    },
    {
      label: this._appLocalization.get('applications.settings.metadata.type.list'),
      value: MetadataItemTypes.List
    }
  ];

  constructor(private _fb: FormBuilder,
              private _appLocalization: AppLocalization,
              private _permissionsService: KMCPermissionsService,
              private _logger: KalturaLogger,
              private _browserService: BrowserService) {
    this._buildForm();
  }

  ngOnInit() {
    this._prepare();
  }

  ngAfterViewInit() {
    if (this.parentPopupWidget) {
      this.parentPopupWidget.state$
        .pipe(cancelOnDestroy(this))
        .pipe(filter(event => event.state === PopupWidgetStates.BeforeClose))
        .subscribe(event => {
          const canPreventClose = event.context && event.context.allowClose;

          if (canPreventClose && this._requiredFieldsIsDirty) {
            event.context.allowClose = false;
            this._cancel();
          }
        });
    }
  }

  ngOnDestroy() {

  }

  private _prepare(): void {
    if (this.field) {
      this._logger.info(`enter edit field mode`);
      this._isNew = false;
      this._field = <MetadataItem>Object.assign({}, this.field);
      this._title = this._appLocalization.get('applications.settings.metadata.editCustomField');
      this._saveBtnLabel = this._appLocalization.get('applications.settings.metadata.save');
      this._fieldForm.setValue({
        type: this._field.type,
        allowMultiple: this._field.allowMultiple,
        label: this._field.key,
        shortDescription: this._field.description,
        description: this._field.documentations,
        searchable: !!this._field.isSearchable,
        hidden: !!this._field.isHidden,
        required: !!this._field.isRequired,
        includeTime: !!this._field.isTimeControl,
        listValues: (this._field.optionalValues && this._field.optionalValues.length)
          ? this._field.optionalValues.map(({ value }) => value).join('\n')
          : ''
      });
      this._systemName = this.field.name;

      this._typeField.disable();
      this._allowMultipleField.disable();

      this._setPristine();
    } else {
      this._logger.info(`enter create field mode`);
      this._title = this._appLocalization.get('applications.settings.metadata.addCustomField');
      this._saveBtnLabel = this._appLocalization.get('applications.settings.metadata.add');
    }

    if (this.fields && this.fields.length) {
      this._systemNames = this.fields.map(({ name }) => name);
    }

    if (!this._isNew && !this._permissionsService.hasPermission(KMCPermissions.CUSTOM_DATA_PROFILE_UPDATE)) {
      this._saveDisabled = true;
      this._fieldForm.disable({ emitEvent: false });
    }
  }

  private _setPristine(): void {
    this._logger.debug(`mark field form as pristine`);
    this._fieldForm.markAsPristine();
    this._fieldForm.updateValueAndValidity();
  }

  private _buildForm(): void {
    this._fieldForm = this._fb.group({
      type: MetadataItemTypes.Text,
      allowMultiple: false,
      label: ['', Validators.required],
      shortDescription: '',
      description: '',
      searchable: true,
      hidden: false,
      required: false,
      // optional fields
      includeTime: false,
      listValues: '',
    });

    this._typeField = this._fieldForm.controls['type'];
    this._allowMultipleField = this._fieldForm.controls['allowMultiple'];
    this._labelField = this._fieldForm.controls['label'];
    this._shortDescriptionField = this._fieldForm.controls['shortDescription'];
    this._descriptionField = this._fieldForm.controls['description'];
    this._searchableField = this._fieldForm.controls['searchable'];
    this._hiddenField = this._fieldForm.controls['hidden'];
    this._requiredField = this._fieldForm.controls['required'];

    // optional fields
    this._includeTimeField = this._fieldForm.controls['includeTime'];
    this._listValuesFiled = this._fieldForm.controls['listValues'];

    this._typeField.valueChanges
      .pipe(cancelOnDestroy(this))
      .pipe(filter(() => this._isNew))
      .subscribe(change => {
        this._fieldForm.patchValue({ searchable: change !== MetadataItemTypes.Date });
      });
  }

  private _update(): MetadataItem {
    this._logger.info(`handle update field with form data`);
    const formValue = this._fieldForm.getRawValue();
    const { label, shortDescription, description, searchable, includeTime, listValues, required, hidden } = formValue;

    if (this._field.key !== label) {
      this._field.key = label;
    }

    if (this._field.description !== shortDescription) {
      this._field.description = shortDescription;
    }

    if (this._field.documentations !== description) {
      this._field.documentations = description;
    }

    if (this._field.isSearchable !== searchable) {
      this._field.isSearchable = searchable;
    }

    if (this._field.isHidden !== hidden) {
      this._field.isHidden = hidden;
    }

    if (this._field.isRequired !== required) {
      this._field.isRequired = required;
    }

    if (this._field.isTimeControl !== includeTime) {
      this._field.isTimeControl = includeTime;
    }

    if (formValue.type === MetadataItemTypes.List) {
      this._field.optionalValues = this._formatOptionalValues(listValues);
    }

    return this._field;
  }

  private _generateFieldId(): string {
    const ALPHA_CHAR_CODES = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70];
    const uid = new Array(36);
    let index = 0;

    let i;
    let j;

    for (i = 0; i < 8; i++) {
      uid[index++] = ALPHA_CHAR_CODES[Math.floor(Math.random() * 16)];
    }

    for (i = 0; i < 3; i++) {
      uid[index++] = 45; // charCode for "-"

      for (j = 0; j < 4; j++) {
        uid[index++] = ALPHA_CHAR_CODES[Math.floor(Math.random() * 16)];
      }
    }

    uid[index++] = 45; // charCode for "-"

    const time = new Date().getTime();
    // Note: time is the number of milliseconds since 1970,
    // which is currently more than one trillion.
    // We use the low 8 hex digits of this number in the UID.
    // Just in case the system clock has been reset to
    // Jan 1-4, 1970 (in which case this number could have only
    // 1-7 hex digits), we pad on the left with 7 zeros
    // before taking the low digits.
    const timeString = ('0000000' + time.toString(16).toUpperCase()).substr(-8);

    for (i = 0; i < 8; i++) {
      uid[index++] = timeString.charCodeAt(i);
    }

    for (i = 0; i < 4; i++) {
      uid[index++] = ALPHA_CHAR_CODES[Math.floor(Math.random() * 16)];
    }

    const fieldId = `md_${String.fromCharCode.apply(null, uid)}`;
    this._logger.debug(`generate custom id for new field`, { fieldId });
    return fieldId;
  }

  private _create(): MetadataItem {
    this._logger.info(`handle creation of new field with form data`);
    const formValue = this._fieldForm.value;
    const { label, type, allowMultiple, shortDescription, description, searchable, hidden, required, includeTime, listValues } = formValue;
    const formattedLabel = label.trim();
    const systemName = formattedLabel
      .replace(/[~`:;,!@#$%\^*()\-+.={}|?\\\/\[\]]/g, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.substr(1, word.length))
      .join('');

    this._logger.info(`validate 'systemName uniqueness`);
    const systemNameUnique = this._systemNames.indexOf(systemName) === -1;
    if (!systemNameUnique) {
      this._browserService.alert({
        header: this._appLocalization.get('applications.settings.metadata.fieldForm.validationErrors.invalidInput'),
        message: this._appLocalization.get('applications.settings.metadata.fieldForm.validationErrors.invalidSystemName'),
      });
      this._logger.info(`systemName is not unique, stop saving`, { systemName });
      return null;
    }

    this._logger.info(`systemName is unique, proceed saving`, { systemName });

    const newField: MetadataItem = {
      allowMultiple,
      type,
      name: systemName,
      key: formattedLabel,
      label: formattedLabel,
      isSearchable: searchable,
      isHidden: hidden,
      isRequired: required,
      isTimeControl: includeTime,
      description: shortDescription,
      documentations: description,
      optionalValues: [],
      children: [],
      id: this._generateFieldId()
    };

    if (type === MetadataItemTypes.List) {
      newField.optionalValues = this._formatOptionalValues(listValues);
    }

    return newField;
  }

  private _formatOptionalValues(values: string) : {value: string, text: string}[]
  {
      const trimmedValues = (values || '').trim();

      if (trimmedValues.length)
      {
          return trimmedValues.split('\n').map(row => {
              const value = (row || '').trim();
              if (value) {
                  return ({value, text: value})
              }else
              {
                  return null;
              }
          }).filter(Boolean);
      }
  }

  private _validateForm(): boolean {
    this._logger.info(`validate field form data`);
    const invalidLabelPrefix = /^[0-9`~:;!@#$%\^&*()\-_+=|',.?\/\\{}<>"\[\]]/;
    const invalidChars = /[<>'"&]/;
    const invalidListValuesOptions = /[`;!#*\,?\\{}<>"\[\]]/;
    const invalidListValuesOptionsPrefix = /^\s*-/gm;

    const label = this._labelField.value.trim();
    const shortDescription = this._shortDescriptionField.value;
    const description = this._descriptionField.value;
    const fieldType = this._typeField.value;
    const listValues = this._listValuesFiled.value.trim();
    let error = '';

    if (!label) {
      error = this._appLocalization.get('applications.settings.metadata.fieldForm.validationErrors.emptyLabel');

    } else if (invalidLabelPrefix.test(label)) {
      error = this._appLocalization.get('applications.settings.metadata.fieldForm.validationErrors.invalidLabelPrefix');

    } else if (invalidChars.test(label) || invalidChars.test(shortDescription) || invalidChars.test(description)) {
      error = this._appLocalization.get('applications.settings.metadata.fieldForm.validationErrors.invalidChars');

    } else if (fieldType === MetadataItemTypes.List) {
      if (!listValues) {
        error = this._appLocalization.get('applications.settings.metadata.fieldForm.validationErrors.emptyListValues');

      } else if (invalidListValuesOptions.test(listValues)) {
        error = this._appLocalization.get('applications.settings.metadata.fieldForm.validationErrors.invalidListOptions');

      } else if (invalidListValuesOptionsPrefix.test(listValues)) {
        error = this._appLocalization.get('applications.settings.metadata.fieldForm.validationErrors.invalidListOptionsPrefix');
      }
    }

    if (error) {
      this._browserService.alert({
        header: this._appLocalization.get('applications.settings.metadata.fieldForm.validationErrors.invalidInput'),
        message: error
      });
      this._logger.info('form data is not valid, stop saving', { errorMessage: error });
    } else {
      this._logger.info('form data is valid, proceed saving');
    }

    return !error;
  }

  public _cancel(): void {
    this._logger.info(`handle 'cancel' updated field by the user`);
    if (this._requiredFieldsIsDirty) {
      this._logger.info(`the form has unsaved changes, handle 'save' of unsaved changes`);
      this._browserService.confirm({
        header: this._appLocalization.get('applications.settings.metadata.fieldForm.saveChanges'),
        message: this._appLocalization.get('applications.settings.metadata.fieldForm.saveChangesMessage'),
        accept: () => {
          this._logger.info(`handle 'save' of unsaved changes by the user`);
          this._save();
        },
        reject: () => {
          this._logger.info(`handle 'discard' of unsaved changes by the user`);
          this._setPristine();
          this.parentPopupWidget.close();
        }
      });
    } else {
      this.parentPopupWidget.close();
    }
  }

  public _save(): void {
    this._logger.info(`handle 'save' updated field by the user`);
    const formValid = this._validateForm();

    if (formValid) {
      const updatedField = this._field ? this._update() : this._create();

      if (updatedField) {
        this.onSave.emit(updatedField);

        this._setPristine();
        this.parentPopupWidget.close();
      }
    }
  }
}

