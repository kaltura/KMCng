import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EqualFieldsValidator } from 'app-shared/kmc-shell/validators/equalFields.validator';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { serverConfig } from 'config/server';

@Component({
  selector: 'kKMCPasswordExpiredForm',
  templateUrl: './password-expired-form.component.html',
  styleUrls: ['./password-expired-form.component.scss']
})
export class PasswordExpiredFormComponent {
  @Input() errorMessage: string;
  @Input() errorCode: string;
  @Input() inProgress = false;
  @Input() passwordRestored = false;

  @Output() onResetPassword = new EventEmitter<{ password: string, newPassword: string }>();

  public _formSent = false;
  public _resetPasswordForm: FormGroup;
  public _passwords: FormGroup;
  public _oldPasswordField: AbstractControl;
  public _newPasswordField: AbstractControl;
  public _repeatPasswordField: AbstractControl;
  public _supportAddress: string;

  public get _sendBtnText(): string {
    return this.inProgress ? 'app.login.wait' : 'app.login.send';
  }

  public get _passwordsDontMatch(): boolean {
    return (this._repeatPasswordField.touched || this._formSent) && this._showError(this._passwords);
  }

  public get _oldPasswordWrong(): boolean {
    return 'WRONG_OLD_PASSWORD' === this.errorCode;
  }

  public get _passwordStructureInvalid(): boolean {
    return 'PASSWORD_STRUCTURE_INVALID' === this.errorCode;
  }

  public get _passwordStructureInvalidMessage(): string {
    return this._passwordStructureInvalid ? 'app.login.error.invalidStructure' : '';
  }

  constructor(private _fb: FormBuilder,
              private _browserService: BrowserService) {
      this._buildForm();

      if (serverConfig.externalLinks.kaltura && serverConfig.externalLinks.kaltura.support) {
          this._supportAddress = serverConfig.externalLinks.kaltura.support;
      }
  }

  private _buildForm(): void {
    this._resetPasswordForm = this._fb.group({
      oldPassword: ['', Validators.required],
      passwords: this._fb.group({
        newPassword: ['', Validators.compose([Validators.required, NotEqualFieldsValidator.validate('oldPassword')])],
        repeatPassword: ['', Validators.required],
      }, { validator: EqualFieldsValidator.validate('newPassword', 'repeatPassword') })
    });

    this._oldPasswordField = this._resetPasswordForm.controls['oldPassword'];
    this._passwords = <FormGroup>this._resetPasswordForm.controls['passwords'];
    this._newPasswordField = this._passwords.controls['newPassword'];
    this._repeatPasswordField = this._passwords.controls['repeatPassword'];
  }

  public _showError(control: AbstractControl): boolean {
    return control.invalid && (control.dirty || this._formSent);
  }

  public _getClientValidationMessage(control: AbstractControl): string {
    const invalid = this._showError(control);
    let message = '';
    if (control.hasError('fieldsEqual')) {
        message = 'app.login.passwordExpired.error.equal';
    }
    if (control.hasError('fieldsNotEqual')) {
        message = 'app.login.passwordExpired.error.notEqual';
    }
    if (control.hasError('required')) {
        message = 'app.login.passwordExpired.error.required';
    }
    return invalid ? message : '';
  }

  public _resetPassword(event: Event): void {
    event.preventDefault();

    this._formSent = true;

    if (this._resetPasswordForm.valid) {
      this._formSent = false;
      this.onResetPassword.emit({
        password: this._oldPasswordField.value,
        newPassword: this._newPasswordField.value
      });
    }
  }
    public _contactSupport(): void {
        this._browserService.openSupport();
    }
}

class NotEqualFieldsValidator {
    public static validate(compareControl: string) {
        return (c: AbstractControl) => {
            return (c && c.parent?.parent && c.value !== c.parent.parent.get(compareControl).value) ? null : {
                fieldsNotEqual: {
                    valid: false
                }
            };
        };
    }
}
