import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/primeng';
import { UsersStore } from '../users.service';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { IsUserExistsStatuses } from '../user-exists-statuses';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { KalturaUser } from 'kaltura-ngx-client/api/types/KalturaUser';
import { KalturaUserRole } from 'kaltura-ngx-client/api/types/KalturaUserRole';

export interface PartnerInfo {
  adminLoginUsersQuota: number,
  adminUserId: string
}

@Component({
  selector: 'kEditUser',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})

export class EditUserComponent implements OnInit, OnDestroy {
  @Input() parentPopupWidget: PopupWidgetComponent;
  @Input() user: KalturaUser;

  private _partnerInfo: PartnerInfo = { adminLoginUsersQuota: 0, adminUserId: null };
  private _roles: KalturaUserRole[] = [];
  private _users: KalturaUser[];

  public _rolesList: SelectItem[] = [];
  public _selectedRoleDescription = '';
  public _userForm: FormGroup;
  public _emailField: AbstractControl;
  public _firstNameField: AbstractControl;
  public _lastNameField: AbstractControl;
  public _idField: AbstractControl;
  public _roleIdsField: AbstractControl;
  public _isNewUser = true;
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = false;

  constructor(public _usersStore: UsersStore,
              private _formBuilder: FormBuilder,
              private _browserService: BrowserService,
              private _appLocalization: AppLocalization) {
    // build FormControl group
    this._userForm = _formBuilder.group({
      email: ['', Validators.compose([Validators.required, Validators.email])],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      id: '',
      roleIds: ''
    });

    this._emailField = this._userForm.controls['email'];
    this._firstNameField = this._userForm.controls['firstName'];
    this._lastNameField = this._userForm.controls['lastName'];
    this._idField = this._userForm.controls['id'];
    this._roleIdsField = this._userForm.controls['roleIds'];
  }


  ngOnInit() {
    this._usersStore.users.data$
      .cancelOnDestroy(this)
      .first()
      .subscribe(({ roles, users, partnerInfo }) => {
        this._roles = roles.items;
        this._users = users.items;
        this._partnerInfo = {
          adminLoginUsersQuota: partnerInfo.adminLoginUsersQuota,
          adminUserId: partnerInfo.adminUserId
        };
        this._rolesList = this._roles.map(({ name, id }) => ({ label: name, value: id }));

        const relevantUser = this._users.find(user => this.user && this.user.id === user.id);
        this._isNewUser = !relevantUser;

        if (this._isNewUser) {
          this._userForm.reset({
            email: '',
            firstName: '',
            lastName: '',
            id: '',
            roleIds: null
          });
          this._userForm.get('email').enable();
          this._userForm.get('firstName').enable();
          this._userForm.get('lastName').enable();
          this._userForm.get('roleIds').enable();
          this._setRoleDescription();
        } else {
          this._userForm.reset({
            email: this.user.email,
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            id: this.user.id,
            roleIds: relevantUser.roleIds ? relevantUser.roleIds : this.user.roleIds
          });
          this._userForm.get('email').disable();
          this._userForm.get('firstName').disable();
          this._userForm.get('lastName').disable();

          if (this.user.id === this._partnerInfo.adminUserId) {
            this._userForm.get('roleIds').disable()
          } else {
            this._userForm.get('roleIds').enable();
          }

          this._setRoleDescription(relevantUser.roleIds);
        }
      });
  }

  ngOnDestroy() {
  }

  private _isUserAlreadyExists(): void {
    const { email } = this._userForm.value;
    this._isBusy = true;
    this._usersStore.isUserAlreadyExists(email)
      .cancelOnDestroy(this)
      .subscribe((status) => {
        this._isBusy = false;

        if (status !== null) {
            switch (status) {
                case IsUserExistsStatuses.kmcUser:
                    this._browserService.alert({
                        message: this._appLocalization.get('applications.administration.users.alreadyExistError', {0: email})
                    });
                    break;
                case IsUserExistsStatuses.otherSystemUser:
                    this._isUserAssociated();
                    break;
                case IsUserExistsStatuses.unknownUser:
                    this._browserService.confirm({
                            header: this._appLocalization.get('applications.administration.users.alreadyExist'),
                            message: this._appLocalization.get('applications.administration.users.userAlreadyExist', {0: email}),
                            accept: () => this._isUserAssociated()
                        }
                    );
                    break;
            }
        }else {
            this._blockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.administration.users.commonError'),
                buttons: [{
                    label: this._appLocalization.get('app.common.ok'),
                    action: () => this._blockerMessage = null
                }]
            });
        }
      });
  }

  private _updateUser(): void {
    if (!this._userForm.valid) {
      return;
    }

    this._usersStore.updateUser(this._userForm, this.user.id)
      .tag('block-shell')
      .cancelOnDestroy(this)
      .subscribe(
        () => {
          this._usersStore.reload(true);
          this._browserService.alert({ message: this._appLocalization.get('applications.administration.users.successSavingUser') });
          this.parentPopupWidget.close();
        },
        error => {
          let buttons = [
            {
              label: this._appLocalization.get('app.common.retry'),
              action: () => {
                this._blockerMessage = null;
                this._updateUser();
              }
            },
            {
              label: this._appLocalization.get('app.common.cancel'),
              action: () => {
                this._blockerMessage = null;
              }
            }
          ];
          if (error.message === 'Invalid user id') {
            buttons = [{
              label: this._appLocalization.get('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
              }
            }]
          }
          this._blockerMessage = new AreaBlockerMessage(
            {
              message: error.message,
              buttons: buttons
            }
          )
        }
      );
  }

  private _isUserAssociated(): void {
    const { id, email } = this._userForm.value;
    const userId = id || email;
    this._isBusy = true;
    this._usersStore.isUserAssociated(userId)
      .cancelOnDestroy(this)
      .subscribe(
        user => {
          this._isBusy = false;
          this._browserService.confirm({
            header: this._appLocalization.get('applications.administration.users.userAssociatedCaption'),
            message: this._appLocalization.get('applications.administration.users.userAssociated', { 0: userId }),
            accept: () => this._updateUserPermissions(user)
          });
        },
        error => {
          this._isBusy = false;
          if (error.code === 'INVALID_USER_ID') {
            this._addNewUser();
          }
        }
      );
  }

  private _updateUserPermissions(user: KalturaUser): void {
    this._blockerMessage = null;
    this._usersStore.updateUserPermissions(user, this._userForm)
      .cancelOnDestroy(this)
      .tag('block-shell')
      .subscribe(
        () => {
          this._usersStore.reload(true);
          this.parentPopupWidget.close();
        },
        error => {
          this._blockerMessage = new AreaBlockerMessage({
            message: error.message,
            buttons: [{
              label: this._appLocalization.get('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
              }
            }]
          });
        }
      );
  }

  private _addNewUser(): void {
    this._blockerMessage = null;

    if (!this._userForm.valid) {
      return;
    }

    this._usersStore.addUser(this._userForm)
      .cancelOnDestroy(this)
      .tag('block-shell')
      .subscribe(
        () => {
          this._usersStore.reload(true);
          this.parentPopupWidget.close();
        },
        error => {
          this._blockerMessage = new AreaBlockerMessage({
            message: error.message,
            buttons: [{
              label: this._appLocalization.get('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
              }
            }]
          });
        }
      );
  }

  public _setRoleDescription(event?: any): void {
    if (!event) {
      this._selectedRoleDescription = this._roles[0] ? this._roles[0].description : '';
    } else {
      const relevantRole = this._roles.find(role => event === role.id || event.value === role.id);
      if (relevantRole) {
        this._selectedRoleDescription = relevantRole.description;
      }
    }
  }

  public _saveUser(): void {
    if (this._userForm.valid) {
      if (this._isNewUser) {
        this._isUserAlreadyExists();
      } else {
        this._updateUser();
      }
    }
  }
}
