import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ISubscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs';
import {SuggestionsProviderData} from '@kaltura-ng/kaltura-primeng-ui';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui';
import {KalturaCategory} from 'kaltura-ngx-client';
import {KalturaUser} from 'kaltura-ngx-client';
import {KalturaInheritanceType} from 'kaltura-ngx-client';
import {KalturaCategoryUserPermissionLevel} from 'kaltura-ngx-client';
import {KalturaUpdateMethodType} from 'kaltura-ngx-client';
import {AddUsersService} from './add-users.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'kAddUsers',
  templateUrl: './add-users.component.html',
  styleUrls: ['./add-users.component.scss'],
  providers: [
      AddUsersService,
      KalturaLogger.createLogger('AddUsersComponent')
  ]
})
export class AddUsersComponent implements OnInit, OnDestroy {

  @Input() parentPopupWidget: PopupWidgetComponent;
  @Input() category: KalturaCategory;
  @Input() parentCategoryMembersCount: number;
  @Input() categoryInheritUserPermissions = false;
  @Input() usersCount: number;
  @Output() usersAdded = new EventEmitter<void>();

  public _loading = false;
  public _blockerMessage: AreaBlockerMessage;

  public _usersProvider = new Subject<SuggestionsProviderData>();
  public _users: KalturaUser[] = null;
  public _selectedPermissionLevel = KalturaCategoryUserPermissionLevel.member;
  public _selectedUpdateMethod = KalturaUpdateMethodType.automatic;
  public _permissionLevelOptions: { value: number, label: string }[] = [];
  public _updateMethodOptions: { value: number, label: string }[] = [];
  public _kalturaInheritanceType = KalturaInheritanceType;

  public _selectedPermissionSettings: 'inherit' | 'setPermissions' = 'setPermissions';

  private _searchUsersSubscription: ISubscription;
  private _parentPopupStateChangesSubscription: ISubscription;

  constructor( private _appLocalization: AppLocalization,
               private _addUsersService: AddUsersService,
               private _logger: KalturaLogger) {
      this._convertUserInputToValidValue = this._convertUserInputToValidValue.bind(this);
  }

  ngOnInit() {
    if (this.category) {
      this._fillPermissionLevelOptions();
      this._fillUpdateMethodOptions();
    } else {
      this._blockerMessage = new AreaBlockerMessage({
        message: this._appLocalization
          .get('applications.content.categoryDetails.entitlements.usersPermissions.errors.loadEndUserPermissions'),
        buttons: [{
          label: this._appLocalization.get('app.common.close'),
          action: () => {
            this._blockerMessage = null;
            if (this.parentPopupWidget) {
              this.parentPopupWidget.close();
            }
          }
        }
        ]
      });
    }
  }


  ngOnDestroy() {
    if (this._parentPopupStateChangesSubscription) {
      this._parentPopupStateChangesSubscription.unsubscribe();
    }
  }

  public _searchUsers(event): void {
      this._logger.info(`handle search users action by user`, {query: event.query });
    this._usersProvider.next({suggestions: [], isLoading: true});

    if (this._searchUsersSubscription) {
      // abort previous request
      this._searchUsersSubscription.unsubscribe();
      this._searchUsersSubscription = null;
    }

    this._searchUsersSubscription = this._addUsersService.getUsersSuggestions(event.query)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        data => {
            this._logger.info(`handle successful search users action by user`);
          const suggestions = [];
          (data.objects || []).forEach((suggestedUser: KalturaUser) => {
              suggestedUser['__tooltip'] = suggestedUser.id;
            suggestions.push({
              name: suggestedUser.screenName + '(' + suggestedUser.id + ')',
              item: suggestedUser,
              isSelectable: true
            });
          });
          this._usersProvider.next({suggestions: suggestions, isLoading: false});
        },
        err => {
            this._logger.info(`handle failed search users action by user`, { errorMessage: err.message });
          this._usersProvider.next({suggestions: [], isLoading: false, errorMessage: <any>(err.message || err)});
        }
      );
  }

  public _convertUserInputToValidValue(value: string): KalturaUser {
    let result = null;
    const tooltip = this._appLocalization.get('applications.content.bulkActions.userTooltip', {0: value});

    if (value) {
        result = {
            id: value,
            screenName: value,
            __tooltip: tooltip,
            __class: 'userAdded'
        };
    }
    return result;
  }

  public _addUsers() {

    if (this._users) {

        this._logger.info(`handle add users action`, () =>({
            users: this._users.map(user => user.id || user.email),
            categoryId: this.category.id,
            permissionLevel: this._selectedPermissionLevel,
            updateMethod: this._selectedUpdateMethod
        }));

      this._addUsersService
        .addUsers(
          {
            usersIds: this._users.map(user => user.id),
            categoryId: this.category.id,
            permissionLevel: this._selectedPermissionLevel,
            updateMethod: this._selectedUpdateMethod
          })
        .pipe(tag('block-shell'))
        .pipe(cancelOnDestroy(this))
        .subscribe(
          result => {
              this._logger.info(`handle successful add users action`);
            this.usersAdded.emit();
            if (this.parentPopupWidget) {
              this.parentPopupWidget.close();
            }
          },
          error => {
              this._logger.warn(`handle failed add users action, show alert`);
            this._blockerMessage = new AreaBlockerMessage({
              title: this._appLocalization
                .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.errors.error'),
              message: error.message,
              buttons: [{
                label: this._appLocalization.get('app.common.ok'),
                action: () => {
                    this._logger.info(`user dismissed alert`);
                  this._blockerMessage = null;
                  this.usersAdded.emit();
                  if (this.parentPopupWidget) {
                    this.parentPopupWidget.close();
                  }
                }
              }]
            });
          }
        );
    } else {
        this._logger.info(`no users were defined, abort action, show alert`);
      this._blockerMessage = new AreaBlockerMessage({
        message: this._appLocalization
          .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.errors.missingUsers'),
        buttons: [{
          label: this._appLocalization.get('app.common.ok'),
          action: () => {
              this._logger.info(`user dismissed alert`);
            this._blockerMessage = null;
          }
        }
        ]
      });
    }
  }


  public _copyUsersFromParent() {
      this._logger.info(`handle copy users from parent action by user, show confirmation`, { categoryId: this.category.id });
    const _executeCopyUsers = () => {
      this._addUsersService
        .copyUsersFromParent({categoryId: this.category.id})
        .pipe(tag('block-shell'))
        .pipe(cancelOnDestroy(this))
        .subscribe(
          result => {
              this._logger.info(`handle successful copy users from parent action by user`);
            this.usersAdded.emit();
            if (this.parentPopupWidget) {
              this.parentPopupWidget.close();
            }
          },
          error => {
              this._logger.warn(`handle failed copy users from parent action by user, show alert`, { errorMessage: error.message });
            this._blockerMessage = new AreaBlockerMessage({
              title: this._appLocalization
                .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.errors.error'),
              message: error.message,
              buttons: [{
                label: this._appLocalization.get('app.common.ok'),
                action: () => {
                    this._logger.info(`user dismissed alert`);
                  this._blockerMessage = null;
                  this.usersAdded.emit();
                  if (this.parentPopupWidget) {
                    this.parentPopupWidget.close();
                  }
                }
              }]
            });
          }
        );
    };

    this._blockerMessage = new AreaBlockerMessage({
      title: this._appLocalization
        .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.copyUsersFromParentConfirmationTitle'),
      message: this._appLocalization
        .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.copyUsersFromParentConfirmation'),
      buttons: [
        {
          label: this._appLocalization.get('app.common.yes'),
          action: () => {
              this._logger.info(`user confrimed, proceed action`);
            _executeCopyUsers();
          }
        }, {
          label: this._appLocalization.get('app.common.no'),
          action: () => {
              this._logger.info(`user didn't confrim, abort action`);
            this._blockerMessage = null;
          }
        }]
    });
  }

  private _fillPermissionLevelOptions() {
    this._permissionLevelOptions = [{
      value: KalturaCategoryUserPermissionLevel.member,
      label: this._appLocalization
        .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.permissionsLevelOptions.member')
    }, {
      value: KalturaCategoryUserPermissionLevel.contributor,
      label: this._appLocalization
        .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.permissionsLevelOptions.contributor')
    }, {
      value: KalturaCategoryUserPermissionLevel.moderator,
      label: this._appLocalization
        .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.permissionsLevelOptions.moderator')
    }, {
      value: KalturaCategoryUserPermissionLevel.manager,
      label: this._appLocalization
        .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.permissionsLevelOptions.manager')
    }];
  }

  private _fillUpdateMethodOptions() {
    this._updateMethodOptions = [{
      value: KalturaUpdateMethodType.automatic,
      label: this._appLocalization
        .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.updateMethodOptions.automatic')
    }, {
      value: KalturaUpdateMethodType.manual,
      label: this._appLocalization
        .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.updateMethodOptions.manual')
    }];
  }

  public _clearUsers() {
      this._logger.info(`handle clear users action by user`);
    this._users = null;
  }
}

