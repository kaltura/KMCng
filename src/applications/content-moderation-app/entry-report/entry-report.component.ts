import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { AreaBlockerMessage, KalturaPlayerComponent } from '@kaltura-ng/kaltura-ui';
import { ModerationStore } from '../moderation-store/moderation-store.service';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { Router } from '@angular/router';
import { AppAuthentication, BrowserService } from 'app-shared/kmc-shell';
import { BulkService } from '../bulk-service/bulk.service';
import { EntriesStore } from 'app-shared/content-shared/entries/entries-store/entries-store.service';
import { EntryReportSections } from './entry-report-sections';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import { KalturaModerationFlag } from 'kaltura-ngx-client/api/types/KalturaModerationFlag';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { KalturaSourceType } from 'kaltura-ngx-client/api/types/KalturaSourceType';
import { KalturaEntryStatus } from 'kaltura-ngx-client/api/types/KalturaEntryStatus';
import { KalturaMediaType } from 'kaltura-ngx-client/api/types/KalturaMediaType';
import { Observer } from 'rxjs/Observer';
import { serverConfig } from 'config/server';

export interface Tabs {
  name: string;
  isActive: boolean;
  disabled: boolean;
}

@Component({
  selector: 'kEntryReport',
  templateUrl: './entry-report.component.html',
  styleUrls: ['./entry-report.component.scss'],
  providers: [ModerationStore]
})

export class EntryReportComponent implements OnInit, OnDestroy {

  @ViewChild('player') player: KalturaPlayerComponent;

  @Input() parentPopupWidget: PopupWidgetComponent;
  @Input() entryId: string;

  private _isRecordedLive = false;
  private _userId = '';
  private _shouldConfirmEntryApproval = false; // TODO [kmcng] need to get such permissions from somewhere
  private _shouldConfirmEntryRejection = false; // TODO [kmcng] need to get such permissions from somewhere

  public _areaBlockerMessage: AreaBlockerMessage = null;
  public _tabs: Tabs[] = [];
  public _flags: KalturaModerationFlag[] = null;
  public _entry: KalturaMediaEntry = null;
  public _hasDuration = false;
  public _isEntryReady = false;
  public _isClip = false;
  public _flagsAmount = '';
  public EntryReportSections = EntryReportSections;
  public _playerConfig : any = {};
  public _isBusy = false;

  constructor(public _moderationStore: ModerationStore,
              private _appLocalization: AppLocalization,
              private _router: Router,
              private _browserService: BrowserService,
              private _bulkService: BulkService,
              private appAuthentication: AppAuthentication,
              private _entriesStore: EntriesStore) {
  }

  ngOnInit() {
    this._loadEntryModerationDetails();
    this._playerConfig = {
      uiconfid: serverConfig.kalturaServer.previewUIConf,
      pid: this.appAuthentication.appUser.partnerId,
      entryid: this.entryId,
      flashvars: {'closedCaptions': { 'plugin': true }, 'ks': this.appAuthentication.appUser.ks}
    };
  }

  ngOnDestroy() {
  }

  private _getObserver(retryFn: () => void): Observer<any> {
    return {
      next: () => {
        this._closePopup();
        this._entriesStore.reload();
        this._areaBlockerMessage = null;
      },
      error: (error) => {
        this._areaBlockerMessage = new AreaBlockerMessage({
          message: error.message,
          buttons: [
            {
              label: this._appLocalization.get('app.common.retry'),
              action: () => {
                this._areaBlockerMessage = null;
                retryFn();
              }
            },
            {
              label: this._appLocalization.get('app.common.cancel'),
              action: () => {
                this._areaBlockerMessage = null;
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

  private _doApproveEntry(): void {
    const retryFn = () => this._doApproveEntry();
    this._areaBlockerMessage = null;
    this._bulkService.approveEntry([this._entry.id])
      .cancelOnDestroy(this)
      .tag('block-shell')
      .subscribe(this._getObserver(retryFn));
  }

  private _doRejectEntry(): void {
    const retryFn = () => this._doRejectEntry();
    this._areaBlockerMessage = null;
    this._bulkService.rejectEntry([this._entry.id])
      .cancelOnDestroy(this)
      .tag('block-shell')
      .subscribe(this._getObserver(retryFn));
  }

  private _loadEntryModerationDetails(): void {
    this._isBusy = true;
    this._tabs = [
      { name: this._appLocalization.get('applications.content.moderation.report'), isActive: false, disabled: false },
      { name: this._appLocalization.get('applications.content.moderation.details'), isActive: false, disabled: false }
    ];
    this._moderationStore.loadEntryModerationDetails(this.entryId)
      .cancelOnDestroy(this)
      .subscribe(
        response => {
          this._isBusy = false;
          this._areaBlockerMessage = null;
          if (response.entry && response.flag) {
            this._entry = response.entry;
            this._flags = response.flag.objects;
            const moderationCount = this._entry.moderationCount;
            this._flagsAmount = moderationCount === 1
              ? this._appLocalization.get('applications.content.moderation.flagSingular', { 0: moderationCount })
              : this._appLocalization.get('applications.content.moderation.flagPlural', { 0: moderationCount });
            this._userId = this._entry.userId;

            if (this._entry.moderationCount > 0) {
              this._tabs[EntryReportSections.Report].isActive = true;
            } else {
              this._tabs[EntryReportSections.Details].isActive = true;
              this._tabs[EntryReportSections.Report].disabled = true;
            }

            if (this._entry.sourceType) {
              const sourceType = this._entry.sourceType;
              const isLive = (sourceType === KalturaSourceType.liveStream ||
                sourceType === KalturaSourceType.akamaiLive ||
                sourceType === KalturaSourceType.akamaiUniversalLive ||
                sourceType === KalturaSourceType.manualLiveStream);
              this._hasDuration = this._entry.status !== KalturaEntryStatus.noContent
                && !isLive
                && this._entry.mediaType !== KalturaMediaType.image;
              this._isEntryReady = this._entry.status === KalturaEntryStatus.ready;
              if (isLive) {
                this._playerConfig['flashvars']['disableEntryRedirect'] = true;
              }
              this._isRecordedLive = (sourceType === KalturaSourceType.recordedLive);
              this._isClip = !this._isRecordedLive && (this._entry.id !== this._entry.rootEntryId);
            }
            this.player.Embed();
          }
        },
        error => {
          this._isBusy = false;
          this._areaBlockerMessage = new AreaBlockerMessage({
            message: error.message,
            buttons: [
              {
                label: this._appLocalization.get('app.common.retry'),
                action: () => {
                  this._areaBlockerMessage = null;
                  this._loadEntryModerationDetails();
                }
              },
              {
                label: this._appLocalization.get('app.common.cancel'),
                action: () => {
                  this._closePopup();
                  this._areaBlockerMessage = null;
                }
              }
            ]
          });
        }
      );
  }

  public _closePopup(): void {
    if (this.parentPopupWidget) {
      this.parentPopupWidget.close();
    }
  }

  public _changeTab(index: number): void {
    if (!this._tabs[index].disabled) {
      this._tabs.forEach(tab => tab.isActive = false);
      this._tabs[index].isActive = true;
    }
  }

  public _navigateToEntry(entryId): void {
    this._router.navigate(['content/entries/entry', entryId]);
  }

  public _banCreator(): void {
    this._moderationStore.banCreator(this._userId)
      .cancelOnDestroy(this)
      .tag('block-shell')
      .subscribe(
        () => {
          this._browserService.alert({
            message: this._appLocalization.get('applications.content.moderation.notificationHasBeenSent')
          });
        },
        error => {
          this._areaBlockerMessage = new AreaBlockerMessage({
            message: error.message,
            buttons: [
              {
                label: this._appLocalization.get('app.common.retry'),
                action: () => {
                  this._areaBlockerMessage = null;
                  this._banCreator();
                }
              },
              {
                label: this._appLocalization.get('app.common.cancel'),
                action: () => {
                  this._areaBlockerMessage = null;
                }
              }
            ]
          });
        }
      );
  }

  public _approveEntry(): void {
    if (!this._shouldConfirmEntryApproval) { // TODO [kmcng] need to get such permissions from somewhere
      this._browserService.confirm({
        header: this._appLocalization.get('applications.content.moderation.approveMedia'),
        message: this._appLocalization.get('applications.content.moderation.sureToApprove', { 0: this._entry.name }),
        accept: () => this._doApproveEntry()
      });
    } else {
      this._doApproveEntry();
    }
  }

  public _rejectEntry(): void {
    if (!this._shouldConfirmEntryRejection) { // TODO [kmcng] need to get such permissions from somewhere
      this._browserService.confirm({
        header: this._appLocalization.get('applications.content.moderation.rejectMedia'),
        message: this._appLocalization.get('applications.content.moderation.sureToReject', { 0: this._entry.name }),
        accept: () => this._doRejectEntry()
      });
    } else {
      this._doRejectEntry();
    }
  }
}
