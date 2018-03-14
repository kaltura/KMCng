import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MenuItem} from 'primeng/primeng';
import {AppLocalization} from '@kaltura-ng/kaltura-common';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import {BrowserService} from 'app-shared/kmc-shell/providers/browser.service';
import { CategoriesStatusMonitorService, CategoriesStatus } from 'app-shared/content-shared/categories-status/categories-status-monitor.service';

import {
 BulkAccessControlService,  BulkAddCategoriesService, BulkAddTagsService, BulkChangeOwnerService,  BulkDeleteService, BulkDownloadService ,
  BulkRemoveCategoriesService,
  BulkRemoveTagsService,
  BulkSchedulingService,
  SchedulingParams
} from './services'
import {KalturaMediaEntry} from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import {BulkActionBaseService} from './services/bulk-action-base.service';
import { subApplicationsConfig } from 'config/sub-applications';
import {KalturaUser} from 'kaltura-ngx-client/api/types/KalturaUser';
import {KalturaMediaType} from 'kaltura-ngx-client/api/types/KalturaMediaType';
import {KalturaAccessControl} from 'kaltura-ngx-client/api/types/KalturaAccessControl';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import {CreateNewCategoryEvent} from 'app-shared/kmc-shared/events/category-creation';
import {AppEventsService} from 'app-shared/kmc-shared';
import { CreateNewPlaylistEvent } from 'app-shared/kmc-shared/events/playlist-creation';
import { KalturaPlaylistType } from 'kaltura-ngx-client/api/types/KalturaPlaylistType';
import { KalturaEntryStatus } from 'kaltura-ngx-client/api/types/KalturaEntryStatus';
import { CategoryData } from 'app-shared/content-shared/categories/categories-search.service';
import { AppPermissionsService } from '@kaltura-ng/mc-shared/app-permissions';

@Component({
  selector: 'kBulkActions',
  templateUrl: './bulk-actions.component.html',
  styleUrls: ['./bulk-actions.component.scss'],
    providers: [
        BulkSchedulingService,
        BulkAccessControlService,
        BulkAddTagsService,
        BulkRemoveTagsService,
        BulkAddCategoriesService,
        BulkChangeOwnerService,
        BulkRemoveCategoriesService,
        BulkDeleteService,
        BulkDownloadService,
    ]
})
export class BulkActionsComponent implements OnInit, OnDestroy {
  private _allowedStatusesForPlaylist = [
    KalturaEntryStatus.ready.toString(),
    KalturaEntryStatus.moderate.toString(),
    KalturaEntryStatus.blocked.toString()
  ];

  public _bulkActionsMenu: MenuItem[] = [];
  public _bulkWindowWidth = 500;
  public _bulkWindowHeight = 500;
  public _bulkAction = '';

  private _categoriesLocked = false;

  @Input() selectedEntries: KalturaMediaEntry[];

  @Output() onBulkChange = new EventEmitter<{ reload: boolean }>();

  @ViewChild('bulkActionsPopup') public bulkActionsPopup: PopupWidgetComponent;

  constructor(private _appLocalization: AppLocalization, private _browserService: BrowserService,
    private _bulkSchedulingService: BulkSchedulingService,
    private _bulkAccessControlService: BulkAccessControlService,
    private _bulkAddTagsService: BulkAddTagsService,
    private _bulkRemoveTagsService: BulkRemoveTagsService,
    private _bulkAddCategoriesService: BulkAddCategoriesService,
    private _bulkChangeOwnerService: BulkChangeOwnerService,
    private _bulkRemoveCategoriesService: BulkRemoveCategoriesService,
    private _bulkDownloadService: BulkDownloadService,
    private _bulkDeleteService: BulkDeleteService,
    private _appEvents: AppEventsService,
    private _categoriesStatusMonitorService: CategoriesStatusMonitorService,
              private _permissionsService: AppPermissionsService) {

  }

  ngOnInit() {
    this._categoriesStatusMonitorService.status$
	    .cancelOnDestroy(this)
	    .subscribe((status: CategoriesStatus) => {
          this._categoriesLocked = status.lock;
        });

    this._bulkActionsMenu = this.getBulkActionItems();
  }

  ngOnDestroy() {

  }

  private _onAddToNewPlaylist(): void {
    const creationEvent = new CreateNewPlaylistEvent({
      type: KalturaPlaylistType.staticList,
      name: this._appLocalization.get('applications.content.bulkActions.newPlaylist'),
    }, 'metadata');
    const invalidEntries = this.selectedEntries.filter(entry => {
      return this._allowedStatusesForPlaylist.indexOf(entry.status.toString()) === -1
    });

    if (!invalidEntries.length) {
      creationEvent.data.playlistContent = this.selectedEntries.map(({ id }) => id).join(',');
      this._appEvents.publish(creationEvent);
    } else {
      this._handlePlaylistCreationErrors(invalidEntries, creationEvent);
    }
  }

  private _handlePlaylistCreationErrors(invalidEntries: KalturaMediaEntry[], creationEvent: CreateNewPlaylistEvent): void {
    const canCreate = this.selectedEntries.length !== invalidEntries.length;

    if (canCreate) {
      const invalidEntriesNames = invalidEntries.length < 11 ? invalidEntries.map(entry => `${entry.name}`).join('\n') : '';
      this._browserService.confirm({
        header: this._appLocalization.get('applications.content.bulkActions.createPlaylistWarning'),
        message: this._appLocalization.get('applications.content.bulkActions.createPlaylistWarningMsg', {
          0: invalidEntriesNames
        }),
        accept: () => {
          creationEvent.data.playlistContent = this.selectedEntries
            .filter(({ status }) => this._allowedStatusesForPlaylist.indexOf(status.toString()) !== -1) // include only valid
            .map(({ id }) => id).join(',');
          this._appEvents.publish(creationEvent);
        }
      });
    } else {
      this._browserService.alert({
        header: this._appLocalization.get('applications.content.bulkActions.createPlaylistWarning'),
        message: this._appLocalization.get('applications.content.bulkActions.createPlaylistErrorMsg'),
      });
    }
  }

  openBulkActionWindow(action: string, popupWidth: number, popupHeight: number) {
    if (this._categoriesLocked && (action === "addToNewCategory" || action === "addToCategories")){
      this._browserService.alert({
        header: this._appLocalization.get('applications.content.categories.categoriesLockTitle'),
        message: this._appLocalization.get('applications.content.categories.categoriesLockMsg')
      });
    }else {
      this._bulkAction = action;
      this._bulkWindowWidth = popupWidth;
      this._bulkWindowHeight = popupHeight;
      // use timeout to allow data binding of popup dimensions to update before opening the popup
      setTimeout(() => {
        this.bulkActionsPopup.open();
      }, 0);
    }
  }

  performBulkAction(action: string): void {
    switch (action) {
      case 'addToNewPlaylist':
        this._onAddToNewPlaylist();
        break;
      default:
        break;
    }
  }

  // set scheduling changes
  onSchedulingChanged(schedulingParams: SchedulingParams): void {
    this.executeService(this._bulkSchedulingService, schedulingParams);
  }

  // set access control changes
  onAccessControlChanged(profile: KalturaAccessControl): void {
    this.executeService(this._bulkAccessControlService, profile);
  }

  // add tags changed
  onAddTagsChanged(tags: string[]): void {
    this.executeService(this._bulkAddTagsService, tags);
  }

  // remove tags changed
  onRemoveTagsChanged(tags: string[]): void {
    this.executeService(this._bulkRemoveTagsService, tags);
  }

  // add to categories changed
  onAddToCategoriesChanged(categories: CategoryData[]): void {
    this.executeService(this._bulkAddCategoriesService, (categories || []));
  }

  // remove categories changed
  onRemoveCategoriesChanged(categories: number[]): void {
    this.executeService(this._bulkRemoveCategoriesService, categories);
  }

  // owner changed
  onOwnerChanged(owners: KalturaUser[]): void {
    if (owners && owners.length) {
      this.executeService(this._bulkChangeOwnerService, owners[0]);
    }
  }

  // download changed
  onDownloadChanged(flavorId: number): void {
    const showSuccessMsg = (result) => {
      this._browserService.alert(
        {
          header: this._appLocalization.get('applications.content.bulkActions.download'),
          message: this._appLocalization.get('applications.content.bulkActions.downloadMsg', { 0: result && result.email ? result.email : '' })
        }
      );
    };
    this.executeService(this._bulkDownloadService, flavorId, false, true, showSuccessMsg);
  }

  // bulk delete
  public deleteEntries(): void {
    const entriesToDelete = this.selectedEntries.map((entry, index) => `${index + 1}: ${entry.name}` ),
      entries: string = this.selectedEntries.length <= 10 ? entriesToDelete.join(',').replace(/,/gi, '\n') : '',
      message: string = this.selectedEntries.length > 1 ?
        this._appLocalization.get('applications.content.entries.confirmDeleteMultiple', { 0: entries }) :
        this._appLocalization.get('applications.content.entries.confirmDeleteSingle', { 0: entries });
    this._browserService.confirm(
      {
        header: this._appLocalization.get('applications.content.bulkActions.deleteEntries'),
        message: message,
        accept: () => {
          setTimeout(() => {
            this.executeService(this._bulkDeleteService, {}, true, false); // need to use a timeout between multiple confirm dialogues (if more than 50 entries are selected)
          }, 0);
        }
      }
    );
  }

  // bulk download initial check
  private downloadEntries(): void {
    // check for single image selection - immediate download
    if (this.selectedEntries.length === 1 && this.selectedEntries[0].mediaType === KalturaMediaType.image) {
      this._browserService.openLink(this.selectedEntries[0].downloadUrl + '/file_name/name');
    } else {
      this.openBulkActionWindow('download', 570, 500)
    }
  }

  private executeService(service: BulkActionBaseService<any>, data: any = {}, reloadEntries: boolean = true, confirmChunks: boolean = true, callback?: Function): void {
    this._bulkAction = '';

    const execute = () => {
      service.execute(this.selectedEntries, data)
        .tag('block-shell')
        .subscribe(
        result => {if (callback) {
            callback(result);
          }
          this.onBulkChange.emit({ reload: reloadEntries });
        },
        error => {
          const message = error.type === 'bulkDelete' || error.type === 'bulkDownload'
            ? error.message
            : this._appLocalization.get('applications.content.bulkActions.error');
          this._browserService.alert({ message });
        }
      );
    };

    if (confirmChunks && this.selectedEntries.length > subApplicationsConfig.shared.bulkActionsLimit) {
      this._browserService.confirm(
        {
          header: this._appLocalization.get('applications.content.bulkActions.note'),
          message: this._appLocalization.get('applications.content.bulkActions.confirm', { '0': this.selectedEntries.length }),
          accept: () => {
            execute();
          }
        }
      );
    } else {
      execute();
    }
  }

  private _addSelectedEntriesToNewCategory() {
    if (this._categoriesLocked){
      this._browserService.alert({
        header: this._appLocalization.get('applications.content.categories.categoriesLockTitle'),
        message: this._appLocalization.get('applications.content.categories.categoriesLockMsg')
      });
    }else {
      if (this.selectedEntries.length > 0) {
        const creationEvent = new CreateNewCategoryEvent({entries: this.selectedEntries});
        this._appEvents.publish(creationEvent);
      }
    }
  }

  getBulkActionItems(): MenuItem[] {
      let result: MenuItem[] = [
          {
              label: this._appLocalization.get('applications.content.bulkActions.download'), command: (event) => {
              this.downloadEntries()
          },
              disabled: !this._permissionsService.hasPermission('CONTENT_MANAGE_DOWNLOAD')
          },
          {
              label: this._appLocalization.get('applications.content.bulkActions.changeOwner'), command: (event) => {
              this.openBulkActionWindow('changeOwner', 500, 280)
          }
          },
          {
              label: this._appLocalization.get('applications.content.bulkActions.addToNewCategoryPlaylist'), items: [
              {
                  label: this._appLocalization.get('applications.content.bulkActions.addToNewCategory'),
                  command: (event) => {
                      this._addSelectedEntriesToNewCategory();
                  }
              },
              {
                  label: this._appLocalization.get('applications.content.bulkActions.addToNewPlaylist'),
                  command: (event) => {
                      this.performBulkAction('addToNewPlaylist')
                  }
              }]
          },
          {
              label: this._appLocalization.get('applications.content.bulkActions.addRemoveCategories'), items: [
              {
                  label: this._appLocalization.get('applications.content.bulkActions.addToCategories'),
                  command: (event) => {
                      this.openBulkActionWindow('addToCategories', 560, 586)
                  }
              },
              {
                  label: this._appLocalization.get('applications.content.bulkActions.removeFromCategories'),
                  command: (event) => {
                      this.openBulkActionWindow('removeFromCategories', 500, 500)
                  }
              }]
          },
          {
              label: this._appLocalization.get('applications.content.bulkActions.addRemoveTags'), items: [
              {
                  label: this._appLocalization.get('applications.content.bulkActions.addTags'), command: (event) => {
                  this.openBulkActionWindow('addTags', 500, 500)
              }
              },
              {
                  label: this._appLocalization.get('applications.content.bulkActions.removeTags'), command: (event) => {
                  this.openBulkActionWindow('removeTags', 500, 500)
              }
              }]
          },
          {
              id: 'setAccessControl',
              label: this._appLocalization.get('applications.content.bulkActions.setAccessControl'),
              command: (event) => {
                  this.openBulkActionWindow('setAccessControl', 500, 550)
              }
          },
          {
              label: this._appLocalization.get('applications.content.bulkActions.setScheduling'), command: (event) => {
              this.openBulkActionWindow('setScheduling', 500, 500)
          }
          }
      ];

      return result;
  }
}
