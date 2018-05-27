import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AppLocalization} from '@kaltura-ng/kaltura-common';
import {EntriesListComponent} from 'app-shared/content-shared/entries/entries-list/entries-list.component';
import {BrowserService, NewEntryUploadFile} from 'app-shared/kmc-shell';
import {EntriesStore} from 'app-shared/content-shared/entries/entries-store/entries-store.service';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {EntriesTableColumns} from 'app-shared/content-shared/entries/entries-table/entries-table.component';
import {ContentEntriesAppService} from '../content-entries-app.service';
import {AppEventsService} from 'app-shared/kmc-shared';
import {PreviewAndEmbedEvent} from 'app-shared/kmc-shared/events';
import {UploadManagement} from '@kaltura-ng/kaltura-common/upload-management/upload-management.service';
import {TrackedFileStatuses} from '@kaltura-ng/kaltura-common/upload-management/tracked-file';
import {UpdateEntriesListEvent} from 'app-shared/kmc-shared/events/update-entries-list-event';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { EntriesListService } from './entries-list.service';
import { ContentEntryViewSections, ContentEntryViewService } from 'app-shared/kmc-shared/kmc-views/details-views';
import { LiveDashboardAppViewService } from 'app-shared/kmc-shared/kmc-views/component-views';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

@Component({
  selector: 'kEntriesListHolder',
  templateUrl: './entries-list-holder.component.html',
    providers: [KalturaLogger.createLogger('EntriesListHolderComponent')]
})
export class EntriesListHolderComponent implements OnInit, OnDestroy {
  @ViewChild(EntriesListComponent) public _entriesList: EntriesListComponent;
  @ViewChild('liveDashboard') _liveDashboard: PopupWidgetComponent;

  public _entryId: string = null;
  public _blockerMessage: AreaBlockerMessage = null;

  public _columns: EntriesTableColumns = {
    thumbnailUrl: { width: '100px' },
    name: { sortable: true },
    id: { width: '100px' },
    mediaType: { sortable: true, width: '80px', align: 'center' },
    plays: { sortable: true, width: '76px' },
    createdAt: { sortable: true, width: '140px' },
    duration: { sortable: true, width: '104px' },
    status: { width: '100px' }
  };

  public _rowActions = [
    {
      label: this._appLocalization.get('applications.content.table.previewAndEmbed'),
      commandName: 'preview',
      styleClass: ''
    },
    {
      label: this._appLocalization.get('applications.content.table.view'),
      commandName: 'view',
      styleClass: ''
    },
    {
      label: this._appLocalization.get('applications.content.table.liveDashboard'),
      commandName: 'liveDashboard',
      styleClass: '',
      disabled: !this._liveDashboardAppViewService.isAvailable()
    },
    {
      label: this._appLocalization.get('applications.content.table.delete'),
      commandName: 'delete',
      styleClass: 'kDanger'
    }
  ];

  constructor(private _router: Router,
              private _activatedRoute: ActivatedRoute,
              private _entriesListService: EntriesListService,
              private _browserService: BrowserService,
              private _appEvents: AppEventsService,
              private _appLocalization: AppLocalization,
              private _uploadManagement: UploadManagement,
              private _permissionsService: KMCPermissionsService,
              public _entriesStore: EntriesStore,
              private _contentEntryViewService: ContentEntryViewService,
              private _contentEntriesAppService: ContentEntriesAppService,
              private _liveDashboardAppViewService: LiveDashboardAppViewService,
              private _logger: KalturaLogger) {
  }

  ngOnInit() {

      if (this._entriesListService.isViewAvailable)
      {
          this._entriesStore.reload();
      }

      this._uploadManagement.onTrackedFileChanged$
          .cancelOnDestroy(this)
          .filter(trackedFile => trackedFile.data instanceof NewEntryUploadFile && trackedFile.status === TrackedFileStatuses.uploadCompleted)
          .subscribe(() => {
              this._entriesStore.reload();
          });

      this._appEvents.event(UpdateEntriesListEvent)
          .cancelOnDestroy(this)
          .subscribe(() => this._entriesStore.reload());

      const hasEmbedPermission = this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_EMBED_CODE);
      if (!hasEmbedPermission) {
          this._rowActions[0].label = this._appLocalization.get('applications.content.table.previewInPlayer');
      }
  }

  ngOnDestroy() {

  }

  public _onActionSelected({ action, entry }) {
      this._entriesList.clearSelection();
    switch (action) {
      case 'preview':
          this._logger.info(`handle preview and ember action by user, publish 'PreviewAndEmbedEvent' event`, { entryId: entry.id });
        this._appEvents.publish(new PreviewAndEmbedEvent(entry));
        break;
      case 'view':
          this._logger.info(`handle view entry action by user`, { entryId: entry.id });
          this._contentEntryViewService.open({ entry, section: ContentEntryViewSections.Metadata });
        break;
      case 'delete':
          this._logger.info(`handle delete entry action by user, show confirmation`, { entryId: entry.id });
        this._browserService.confirm(
            {
              header: this._appLocalization.get('applications.content.entries.deleteEntry'),
              message: this._appLocalization.get('applications.content.entries.confirmDeleteSingle', { 0: entry.id }),
              accept: () => {
                  this._logger.info(`user confirmed, proceed action`);
                  this._deleteEntry(entry.id);
              },
                reject: () => {
                    this._logger.info(`user didn't confirm, abort action`);
                }
            }
        );
        break;
      case 'liveDashboard':
        if (entry && entry.id) {
            this._logger.info(`handle open live dashboard action by user`, { entryId: entry.id });
          this._entryId = entry.id;
          this._liveDashboard.open();
        }
        break;
      default:
        break;
    }
  }

  private _deleteEntry(entryId: string): void {
      this._logger.info(`handle delete entry request by user`, { entryId });
    if (!entryId) {
      this._logger.warn('entryId is not defined');
      return;
    }

    this._blockerMessage = null;
    this._contentEntriesAppService.deleteEntry(entryId)
      .tag('block-shell')
      .subscribe(
        () => {
            this._logger.info(`handle successful delete entry request`);
          this._entriesStore.reload();
        },
        error => {
            this._logger.warn(`handle failed delete entry request, show confirmation`, { errorMessage: error.message });
          this._blockerMessage = new AreaBlockerMessage({
            message: error.message,
            buttons: [
              {
                label: this._appLocalization.get('app.common.retry'),
                action: () => {
                    this._logger.info(`user confirmed, retry action`);
                    this._deleteEntry(entryId);
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
        }
      );
  }
}
