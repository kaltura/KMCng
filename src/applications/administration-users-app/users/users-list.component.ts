import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UsersStore } from './users.service';
import { subApplicationsConfig } from 'config/sub-applications';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { KalturaUser } from 'kaltura-ngx-client/api/types/KalturaUser';
import { AppLocalization } from '@kaltura-ng/kaltura-common/localization/app-localization.service';
import { Observer } from 'rxjs/Observer';
import { serverConfig } from 'config/server';
import { KMCPermissions } from 'app-shared/kmc-shared/kmc-permissions';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

export interface PartnerInfo {
  adminLoginUsersQuota: number,
  adminUserId: string
}

@Component({
  selector: 'kUsersList',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
    providers: [KalturaLogger.createLogger('UsersListComponent')]
})

export class UsersListComponent implements OnInit, OnDestroy {
  @ViewChild('editUserPopup') editUserPopup: PopupWidgetComponent;

  public _kmcPermissions = KMCPermissions;
  public _usersAmount: string;
  public _usersTotalCount: number;
  public _usersInfo = '';
  public _blockerMessage: AreaBlockerMessage = null;
  public _users: KalturaUser[];
  public _partnerInfo: PartnerInfo = { adminLoginUsersQuota: 0, adminUserId: null };
  public _user: KalturaUser;
  public _filter = {
    pageIndex: 0,
    pageSize: null // pageSize is set to null by design. It will be modified after the first time loading users
  };

  constructor(public _usersStore: UsersStore,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService,
              private _logger: KalturaLogger) {
  }

  ngOnInit() {
      this._logger.debug(`init component, subscribe to query and data changes`);
    this._usersStore.query$
      .cancelOnDestroy(this)
      .subscribe(
        query => {
            this._logger.debug(`query was updated`, { query });
          this._filter.pageSize = query.pageSize;
          this._filter.pageIndex = query.pageIndex - 1;
          this._browserService.scrollToTop();
        }
      );

    this._usersStore.users.data$
      .cancelOnDestroy(this)
      .subscribe(
        response => {
          this._usersInfo = this._appLocalization.get('applications.administration.users.usersInfo',
            {
              0: response.users.totalCount,
              1: response.users.totalCount > 1 ? this._appLocalization.get('applications.administration.users.users') : this._appLocalization.get('applications.administration.users.user'),
              2: response.partnerInfo.adminLoginUsersQuota - response.users.totalCount
            }
          );
          this._usersAmount = `${response.users.totalCount} ${response.users.totalCount > 1 ? this._appLocalization.get('applications.administration.users.users') : this._appLocalization.get('applications.administration.users.user')}`;
          this._usersTotalCount = response.users.totalCount;
          this._users = response.users.items;
          this._partnerInfo = {
            adminLoginUsersQuota: response.partnerInfo.adminLoginUsersQuota,
            adminUserId: response.partnerInfo.adminUserId
          };

          this._logger.debug(`users data was updated`, { totalUsers: this._usersTotalCount, partnerInfo: this._partnerInfo, usersInfo: this._usersTotalCount });
        }
      );
  }

  ngOnDestroy() {
  }

  private _getObserver(retryFn: () => void): Observer<void> {
    return <Observer<void>>{
      next: () => {
          this._logger.info(`handle successful action`);
        this._usersStore.reload(true);
      },
      error: (error) => {
          this._logger.warn(`handle failed action, show confirmation`);
        this._blockerMessage = new AreaBlockerMessage({
          message: error.message,
          buttons: [
            {
              label: this._appLocalization.get('app.common.retry'),
              action: () => {
                  this._logger.info(`user confirmed, retry action`);
                this._blockerMessage = null;
                retryFn();
              }
            },
            {
              label: this._appLocalization.get('app.common.cancel'),
              action: () => {
                  this._logger.info(`user didn't confirm, abort action`);
                this._blockerMessage = null;
              }
            }
          ]
        });
      },
      complete: () => {
        // empty by design
      }
    };
  }

  public _upgradeAccount(): void {
      this._logger.info(`handle upgrade account action by user`);
    this._browserService.openLink(serverConfig.externalLinks.kaltura.upgradeAccount, {}, '_blank');
  }

  public _onPaginationChanged(state: any): void {
      this._logger.info(`handle pagination changed action by user`, { state });
    if (state.page !== this._filter.pageIndex || state.rows !== this._filter.pageSize) {
      this._filter.pageSize = state.page + 1;
      this._filter.pageIndex = state.rows;
      this._usersStore.reload({
        pageIndex: state.page + 1,
        pageSize: state.rows
      });
    }
  }

  public _onEditUser(user: KalturaUser): void {
      this._logger.info(`handel edit user action by user`, { user });
    this._user = user;
    this.editUserPopup.open();
  }

  public _onToggleUserStatus(user: KalturaUser): void {
      this._logger.info(`handle toggle user status action by user`, { user });
    const retryFn = () => this._onToggleUserStatus(user);
    this._usersStore.toggleUserStatus(user)
      .cancelOnDestroy(this)
      .tag('block-shell')
      .subscribe(this._getObserver(retryFn));
  }

  public _onDeleteUser(user: KalturaUser): void {
      this._logger.info(`handle delete user action by user`, { user });
    const retryFn = () => this._onDeleteUser(user);
    this._usersStore.deleteUser(user)
      .cancelOnDestroy(this)
      .tag('block-shell')
      .subscribe(this._getObserver(retryFn))
  }

  public _addUser(): void {
      this._logger.info(`handle add user action by user`);
    this._user = null;
    this.editUserPopup.open();
  }

  public _reload(): void {
    this._usersStore.reload(true);
  }
}
