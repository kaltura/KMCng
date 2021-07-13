import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AccountFilters, MultiAccountStoreService, SortDirection } from '../multi-account-store/multi-account-store.service';
import { PopupWidgetComponent, StickyComponent } from '@kaltura-ng/kaltura-ui';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AppAuthentication, BrowserService } from 'app-shared/kmc-shell';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { AdminMultiAccountMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { KalturaPartner, KalturaPartnerStatus } from "kaltura-ngx-client";
import { MultiAccountRefineFiltersService, RefineList } from '../multi-account-store/multi-account-refine-filters.service';
import { serverConfig, buildBaseUri } from "config/server";
import { first } from 'rxjs/operators';

@Component({
  selector: 'kAccountsList',
  templateUrl: './accounts-list.component.html',
  styleUrls: ['./accounts-list.component.scss'],
  providers: [MultiAccountRefineFiltersService, KalturaLogger.createLogger('AccountsListComponent')]
})

export class AccountsListComponent implements OnInit, OnDestroy {
  @ViewChild('newAccountPopup', { static: true }) public newAccountPopup: PopupWidgetComponent;
  @ViewChild('tags', { static: true }) private _tags: StickyComponent;

  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = false;
  public _tableIsBusy = false;
  public _tableBlockerMessage: AreaBlockerMessage = null;
  public _refineFilters: RefineList[];
  public _templateAccounts: KalturaPartner[] = [];
  public _usedAccounts = null;
  public _availableAccounts = null;

  public _query = {
    freeText: '',
    sortBy: 'createdAt',
    sortDirection: SortDirection.Asc,
    pageIndex: 0,
    pageSize: 25
  };

  constructor(public _accountsStore: MultiAccountStoreService,
              private _logger: KalturaLogger,
              private _browserService: BrowserService,
              private _refineFiltersService: MultiAccountRefineFiltersService,
              private _adminMultiAccountMainViewService: AdminMultiAccountMainViewService,
              private _appLocalization: AppLocalization, private _appAuthentication: AppAuthentication) {
  }

  ngOnInit() {
      if (this._adminMultiAccountMainViewService.viewEntered()) {
          this._prepare();
      }
  }

  ngOnDestroy() {
  }

  private _prepare(): void {
      this._logger.info(`initiate accounts list view`);
      this._refineFiltersService.getFilters()
          .pipe(cancelOnDestroy(this))
          .pipe(first()) // only handle it once, no need to handle changes over time
          .subscribe(
              lists => {
                  this._isBusy = false;
                  this._refineFilters = lists;
                  this._restoreFiltersState();
                  this._registerToFilterStoreDataChanges();
                  this._registerToDataChanges();
                  this._accountsStore.filter({ ['status']: ['1','2'] }); // initial filter for active and blocked status
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
                              this._accountsStore.reload();
                          }
                      }
                      ]
                  });
              });
  }

  private _restoreFiltersState(): void {
    this._updateComponentState(this._accountsStore.cloneFilters(
      [
        'freeText',
        'pageSize',
        'pageIndex',
        'sortBy',
        'sortDirection'
      ]
    ));
  }

  private _updateComponentState(updates: Partial<AccountFilters>): void {
    if (typeof updates.freeText !== 'undefined') {
        this._query.freeText = updates.freeText || '';
    }

    if (typeof updates.pageSize !== 'undefined') {
      this._query.pageSize = updates.pageSize;
    }

    if (typeof updates.pageIndex !== 'undefined') {
      this._query.pageIndex = updates.pageIndex;
    }

    if (typeof updates.sortBy !== 'undefined') {
        this._query.sortBy = updates.sortBy;
    }

    if (typeof updates.sortDirection !== 'undefined') {
        this._query.sortDirection = updates.sortDirection;
    }
  }

  private _registerToFilterStoreDataChanges(): void {
    this._accountsStore.filtersChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(({ changes }) => {
        this._updateComponentState(changes);
        this._browserService.scrollToTop();
      });
  }

  private _registerToDataChanges(): void {
    this._accountsStore.accounts.state$
      .pipe(cancelOnDestroy(this))
      .subscribe(
        result => {

          this._tableIsBusy = result.loading;

          if (result.errorMessage) {
            this._tableBlockerMessage = new AreaBlockerMessage({
              message: result.errorMessage || this._appLocalization.get('applications.administration.accounts.errors.loadError'),
              buttons: [{
                label: this._appLocalization.get('app.common.retry'),
                action: () => {
                  this._logger.info(`user selected retry, retry action`);
                  this._tableBlockerMessage = null;
                  this._accountsStore.reload();
                }
              }]
            });
          } else {
            this._tableBlockerMessage = null;
          }
        });

      this._accountsStore.accounts.data$
          .pipe(cancelOnDestroy(this))
          .subscribe(
              result => {
                this._templateAccounts = result.templateAccounts;
                this._usedAccounts = result.usedAccountsCount - result.templateAccounts.length - 1; // deduct template accounts and current account (admin)
                this._availableAccounts = this._appAuthentication.appUser.partnerInfo.publishersQuota - this._usedAccounts;
                if (result.totalCount === 0 || this._availableAccounts < 0) {
                    this._availableAccounts = 0;
                }
                if (this._usedAccounts < 0) {
                    this._usedAccounts = 0;
                }
              });
  }

  public _reload() {
    this._accountsStore.reload();
  }

  public _onPaginationChanged(state: any): void {
    if (state.page !== this._query.pageIndex || state.rows !== this._query.pageSize) {
      this._accountsStore.filter({
        pageIndex: state.page,
        pageSize: state.rows
      });
    }
  }

  public _onActionSelected(event: { action: string, account: KalturaPartner }): void {
    switch (event.action) {
      case 'kmc':
          this._openKmc(event.account.id);
        break;
      case 'block':
          this._updateAccountStatus(event.account, KalturaPartnerStatus.blocked);
        break;
      case 'unblock':
          this._updateAccountStatus(event.account, KalturaPartnerStatus.active);
        break;
      case 'remove':
        this._logger.info(`handle delete account action by user, show confirmation`, { id: event.account.id });
        this._browserService.confirm(
          {
            header: this._appLocalization.get('applications.administration.accounts.confirmDeleteHeader'),
            message: this._appLocalization.get('applications.administration.accounts.confirmDeleteBody', { 0: event.account.name }),
            accept: () => {
              this._logger.info(`user confirmed, proceed action`);
                this._updateAccountStatus(event.account, KalturaPartnerStatus.fullBlock);
            },
            reject: () => {
              this._logger.info(`user didn't confirmed, abort action`);
            }
          }
        );
        break;
      default:
        break;
    }
  }

    private _updateAccountStatus(account: KalturaPartner, status: KalturaPartnerStatus): void {
        this._logger.info(`handle delete role request by user`);
        this._blockerMessage = null;
        this._accountsStore.updateAccountStatus(account.id, status)
            .pipe(cancelOnDestroy(this))
            .pipe(tag('block-shell'))
            .subscribe(
                () => {
                    this._logger.info(`handle successful update account status request by user`);
                    this._blockerMessage = null;
                    this._accountsStore.reload();
                },
                error => {
                    this._logger.warn(`handle failed update account status request by user, show confirmation`, { errorMessage: error.message });
                    this._blockerMessage = new AreaBlockerMessage(
                        {
                            message: error.message,
                            buttons: [
                                {
                                    label: this._appLocalization.get('app.common.retry'),
                                    action: () => {
                                        this._logger.info(`user confirmed, retry action`);
                                        this._updateAccountStatus(account, status);
                                    }
                                },
                                {
                                    label: this._appLocalization.get('app.common.cancel'),
                                    action: () => {
                                        this._logger.info(`user didn't confirm, abort action, dismiss alert`);
                                        this._blockerMessage = null;
                                    }
                                }
                            ]
                        }
                    );
                }
            );
    }

    private _openKmc(pId: number): void {
        this._logger.info(`handle delete role request by user`);
        this._blockerMessage = null;
        this._accountsStore.getAdminSession(pId)
            .pipe(cancelOnDestroy(this))
            .pipe(tag('block-shell'))
            .subscribe(
                ks => {
                    this._logger.info(`handle successful open KMC request by user`);
                    this._blockerMessage = null;
                    const redirectUrl = buildBaseUri('') + this._browserService.getDocumentBase() + '/actions/persist-login-by-ks/' + ks;
                    this._browserService.openLink(redirectUrl);
                },
                error => {
                    this._logger.warn(`handle failed open KMC request by user, show confirmation`, { errorMessage: error.message });
                    this._blockerMessage = new AreaBlockerMessage(
                        {
                            message: error.message,
                            buttons: [
                                {
                                    label: this._appLocalization.get('app.common.retry'),
                                    action: () => {
                                        this._logger.info(`user confirmed, retry action`);
                                        this._openKmc(pId);
                                    }
                                },
                                {
                                    label: this._appLocalization.get('app.common.cancel'),
                                    action: () => {
                                        this._logger.info(`user didn't confirm, abort action, dismiss alert`);
                                        this._blockerMessage = null;
                                    }
                                }
                            ]
                        }
                    );
                }
            );
    }

  public _onFreetextChanged(): void {
      // prevent searching for empty strings
      if (this._query.freeText.length > 0 && this._query.freeText.trim().length === 0){
          this._query.freeText = '';
      }else {
          this._accountsStore.filter({freeText: this._query.freeText});
      }
  }

  public _onSortChanged(event): void {
      if (event.field !== this._query.sortBy || event.order !== this._query.sortDirection) {
          this._accountsStore.filter({
              sortBy: event.field,
              sortDirection: event.order === 1 ? SortDirection.Asc : SortDirection.Desc
          });
      }
    }

  public _addAccount(): void {
    this._logger.info(`handle create new account action by user`);
    this.newAccountPopup.open();
  }

  public _onTagsChange() {
      this._tags.updateLayout();
  }

  public _upgradeAccount(): void {
      this._browserService.openLink(serverConfig.externalLinks.kaltura.contactUs, {}, '_blank');
  }
}
