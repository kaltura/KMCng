import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';

import {
    EndUserPermissionsUser, ManageEndUserPermissionsService,
    UsersFilters
} from './manage-end-user-permissions.service';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {BrowserService} from 'app-shared/kmc-shell';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui';
import {KalturaCategory} from 'kaltura-ngx-client';
import {KalturaCategoryUserPermissionLevel} from 'kaltura-ngx-client';
import {KalturaUpdateMethodType} from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import {
    ManageEndUserPermissionsRefineFiltersService,
    RefineList
} from './manage-end-user-permissions-refine-filters.service';
import { KMCPermissions } from 'app-shared/kmc-shared/kmc-permissions';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { first } from 'rxjs/operators';
import { skip } from 'rxjs/operators';

export interface UserActionData {
  action: 'activate' | 'deactivate' | 'permissionLevel'| 'updateMethod' | 'delete',
  users: EndUserPermissionsUser | EndUserPermissionsUser[],
  payload: {
    level?: KalturaCategoryUserPermissionLevel, method?: KalturaUpdateMethodType
  }
}

@Component({
  selector: 'kManageEndUsers',
  templateUrl: './manage-end-user-permissions.component.html',
  styleUrls: ['./manage-end-user-permissions.component.scss'],
  providers: [
      ManageEndUserPermissionsService,
      ManageEndUserPermissionsRefineFiltersService,
      KalturaLogger.createLogger('ManageEndUserPermissionsComponent')
  ]
})
export class ManageEndUserPermissionsComponent implements OnInit, OnDestroy {
  public _kmcPermissions = KMCPermissions;
  public _selectedUsers: EndUserPermissionsUser[] = [];
  public _users: EndUserPermissionsUser[];
  public _usersCount: number;
  public _actualUsersCount = { updated: false, total: 0};
  @Input() category: KalturaCategory = null;
  @Input() parentCategory: KalturaCategory = null;
  @Input() parentPopupWidget: PopupWidgetComponent;
  @Input() categoryInheritUserPermissions = false;

    public _isBusy = false;
    public _blockerMessage: AreaBlockerMessage = null;
    public _tableIsBusy = false;
    public _tableBlockerMessage: AreaBlockerMessage = null;
    public _refineFilters: RefineList[];

  @ViewChild('refinePopup', { static: true }) refinePopup: PopupWidgetComponent;

  public _query = {
    freetext: '',
    pageIndex: 0,
    pageSize: null,
  };
  public _isTagsBarVisible = false;

  constructor(private _usersService: ManageEndUserPermissionsService,
              private _refineFiltersService: ManageEndUserPermissionsRefineFiltersService,
              private _browserService: BrowserService,
              private _appLocalization: AppLocalization,
              private _logger: KalturaLogger) {
  }

  ngOnInit() {
      if (!this.category || !this.category.id) {
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
          return undefined;
      }

      this._usersService.filter(
          {
              categoryId: this.category.id,
              inheritUsers: this.categoryInheritUserPermissions
          });

      this._prepare();
  }

    private _prepare(): void {

        // NOTICE: do not execute here any logic that should run only once.
        // this function will re-run if preparation failed. execute your logic
        // only once the filters were fetched successfully.

        this._isBusy = true;
        this._refineFiltersService.getFilters()
            .pipe(cancelOnDestroy(this))
            .pipe(first()) // only handle it once, no need to handle changes over time
            .subscribe(
                lists => {
                    this._usersService.users.data$
                        .pipe(cancelOnDestroy(this))
                        .pipe(skip(1)) // skip the first emitted value which is the default for '_actualUsersCount' to behave correctly
                        .subscribe(response => {
                            this._users = response.items;
                            this._usersCount = response.totalCount;
                            this._actualUsersCount = { updated: true, total: response.actualUsersCount};
                        });

                    this._isBusy = false;
                    this._refineFilters = lists;
                    this._restoreFiltersState();
                    this._registerToFilterStoreDataChanges();
                    this._registerToDataChanges();
                },
                error => {
                    this._isBusy = false;
                    this._blockerMessage = new AreaBlockerMessage({
                        message: this._appLocalization.get('applications.content.filters.errorLoading'),
                        buttons: [{
                            label: this._appLocalization.get('app.common.retry'),
                            action: () => {
                                this._blockerMessage = null;
                                this._prepare();
                                this._usersService.reload();
                            }
                        }
                        ]
                    })
                });
    }

    private _registerToDataChanges(): void {
        this._usersService.users.state$
            .pipe(cancelOnDestroy(this))
            .subscribe(
                result => {

                    this._tableIsBusy = result.loading;

                    if (result.errorMessage) {
                        this._tableBlockerMessage = new AreaBlockerMessage({
                            message: result.errorMessage || 'Error loading users',
                            buttons: [{
                                label: 'Retry',
                                action: () => {
                                    this._tableBlockerMessage = null;
                                    this._usersService.reload();
                                }
                            }
                            ]
                        })
                    } else {
                        this._tableBlockerMessage = null;
                    }
                },
                error => {
                    console.warn('[kmcng] -> could not load users'); // navigate to error page
                    throw error;
                });
    }

  private _restoreFiltersState(): void {
    this._updateComponentState(this._usersService.cloneFilters(
      [
        'freetext',
        'pageSize',
        'pageIndex'
      ]
    ));
  }

  private _updateComponentState(updates: Partial<UsersFilters>): void {
    if (typeof updates.freetext !== 'undefined') {
      this._query.freetext = updates.freetext || '';
    }

    if (typeof updates.pageSize !== 'undefined') {
      this._query.pageSize = updates.pageSize;
    }

    if (typeof updates.pageIndex !== 'undefined') {
      this._query.pageIndex = updates.pageIndex;
    }
  }

  private _registerToFilterStoreDataChanges(): void {
    this._usersService.filtersChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(({changes}) => {
        this._updateComponentState(changes);
        this._clearSelection();
        this._browserService.scrollToTop();
      });
  }

  ngOnDestroy() {
  }

  public _reload() {
    this._clearSelection();
    this._usersService.reload();
  }

  _clearSelection() {
    this._selectedUsers = [];
  }

  _onPaginationChanged(state: any): void {
    if (state.page !== this._query.pageIndex || state.rows !== this._query.pageSize) {
      this._usersService.filter({
        pageIndex: state.page,
        pageSize: state.rows
      });
    }
  }

  _onActionSelected(userActionData: UserActionData) {

    const showInvalidActionError = () => {
        this._logger.info(`handle invalid action error, show alert`);
      this._blockerMessage = new AreaBlockerMessage({
        message: this._appLocalization
          .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.errors.invalidAction'),
        buttons: [{
          label: this._appLocalization.get('app.common.close'),
          action: () => {
              this._logger.info(`user dismissed alert`);
            this._blockerMessage = null;
          }
        }
        ]
      });
    };


    if (!userActionData || !userActionData.users || !userActionData.action ) {
      showInvalidActionError();
      return undefined;
    }

    const users = userActionData.users;
    const payload = userActionData.payload;
    const usersIds = Array.isArray(users) && users.length > 0 ? users.map(user => (user.id)) : [(<EndUserPermissionsUser>users).id];

    switch (userActionData.action) {
      case 'permissionLevel':
        if (!payload || typeof payload.level === 'undefined') {
          showInvalidActionError();
          return undefined;
        }
        this._executeAction(this._usersService.setPermissionLevel(this.category.id, usersIds, payload.level));
        break;
      case 'updateMethod':
        if (!payload || typeof payload.method === 'undefined') {
          showInvalidActionError();
          return undefined;
        }
        this._executeAction(this._usersService.setUpdateMethod(this.category.id, usersIds, payload.method));
        break;
      case 'delete':
          this._logger.info(`handle delete users action by user`, { categoryId: this.category.id, usersIds });
        if (usersIds.find(id => id === this.category.owner)) {
            this._logger.info(`category owner found in usersIds, abort action, show alert`, { usersIds, categoryOwnerId: this.category.owner });
          this._blockerMessage = new AreaBlockerMessage({
            message: this._appLocalization
              .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.errors.deleteOwner'),
            buttons: [{
              label: this._appLocalization.get('app.common.close'),
              action: () => {
                  this._logger.info(`user dismissed alert`);
                this._blockerMessage = null;
              }
            }
            ]
          });
        } else {
          this._executeAction(this._usersService.deleteUsers(this.category.id, usersIds));
        }
        break;
      case 'activate':
        this._executeAction(this._usersService.activateUsers(this.category.id, usersIds));
        break;
      case 'deactivate':
        this._executeAction(this._usersService.deactivateUsers(this.category.id, usersIds));
        break;
      default:
        showInvalidActionError();
        break;
    }
  }

  private _executeAction(observable$: Observable<void>) {
    this._blockerMessage = null;

    observable$
      .pipe(tag('block-shell'))
      .pipe(cancelOnDestroy(this))
      .subscribe(
        res => {
            this._logger.info(`handle successful action`);
          this._reload();
        }, error => {
              this._logger.info(`handle failed action, show alert`, { errorMessage: error.message });
          this._blockerMessage = new AreaBlockerMessage({
            message: this._appLocalization
              .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.errors.actionFailed'),
            buttons: [{
              label: this._appLocalization.get('applications.content.playlistDetails.errors.ok'),
              action: () => {
                  this._logger.info(`user dismissed alert`);
                this._blockerMessage = null;
                this._usersService.reload();
              }
            }
            ]
          });
        }
      );
  }


  public _onUsersAdded() {
      this._logger.info(`handle on users added action`);
    this._reload();
  }

  onFreetextChanged(): void {
      // prevent searching for empty strings
      if (this._query.freetext.length > 0 && this._query.freetext.trim().length === 0){
          this._query.freetext = '';
      }else {
          this._usersService.filter({freetext: this._query.freetext});
      }
  }
}
