import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient, KalturaMultiRequest, KalturaTypesFactory } from 'kaltura-ngx-client';
import { KalturaPlaylist } from 'kaltura-ngx-client/api/types/KalturaPlaylist';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { Observable } from 'rxjs/Observable';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client/api/types/KalturaDetachedResponseProfile';
import { KalturaResponseProfileType } from 'kaltura-ngx-client/api/types/KalturaResponseProfileType';
import { PlaylistExecuteAction } from 'kaltura-ngx-client/api/types/PlaylistExecuteAction';
import { FriendlyHashId } from '@kaltura-ng/kaltura-common/friendly-hash-id';
import { KalturaUtils } from '@kaltura-ng/kaltura-common';
import { KalturaBaseEntry } from 'kaltura-ngx-client/api/types/KalturaBaseEntry';
import { BaseEntryListAction } from 'kaltura-ngx-client/api/types/BaseEntryListAction';
import { KalturaBaseEntryFilter } from 'kaltura-ngx-client/api/types/KalturaBaseEntryFilter';
import { PlaylistWidget } from '../../playlist-widget';
import { PlaylistWidgetKeys } from '../../playlist-widget-keys';
import { KalturaPlaylistType } from 'kaltura-ngx-client/api/types/KalturaPlaylistType';
import { KalturaFilterPager } from 'kaltura-ngx-client/api/types/KalturaFilterPager';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

export interface PlaylistContentMediaEntry extends KalturaMediaEntry {
  selectionId?: string;
}

@Injectable()
export class ManualContentWidget extends PlaylistWidget implements OnDestroy {
  private _selectionIdGenerator = new FriendlyHashId();

  public entries: PlaylistContentMediaEntry[] = [];
  public entriesTotalCount = 0;
  public entriesDuration = 0;


  constructor(private _kalturaClient: KalturaClient,
              private _logger: KalturaLogger) {
    super(PlaylistWidgetKeys.Content);

      this._logger = _logger.subLogger('ManualContentWidget');
  }

  ngOnDestroy() {
  }

  protected onValidate(wasActivated: boolean): Observable<{ isValid: boolean }> {
    if (this.data.playlistType === KalturaPlaylistType.staticList) { // validate only manual playlist
      if (this.wasActivated) {
        return Observable.of({ isValid: !!this.entries.length });
      }

      if (this.isNewData && (this.data.playlistContent || '').trim().length > 0) {
        return Observable.of({ isValid: true });
      }

      return Observable.of({ isValid: false });
    }

    return Observable.of({ isValid: true });
  }

  protected onDataSaving(data: KalturaPlaylist, request: KalturaMultiRequest): void {
    if (this.data.playlistType === KalturaPlaylistType.staticList) { // handle only manual playlist
      if (this.wasActivated) {
        data.playlistContent = this.entries.map(({ id }) => id).join(',');
      } else if (this.isNewData && (this.data.playlistContent || '').trim().length > 0) {
        data.playlistContent = this.data.playlistContent
      } else {
        // shouldn't reach this part since 'onValidate' should prevent execution of this function
        // if data is invalid
        throw new Error('invalid scenario');
      }
    }
  }

  /**
   * Do some cleanups if needed once the section is removed
   */
  protected onReset(): void {
    this.entries = [];
    this.entriesTotalCount = 0;
    this.entriesDuration = 0;
  }

  protected onActivate(): Observable<{ failed: boolean, error?: Error }> {
    super._showLoader();

    return this._getEntriesRequest()
      .cancelOnDestroy(this, this.widgetReset$)
      .map((entries: KalturaMediaEntry[]) => {
        this.entries = this._extendWithSelectionId(entries);
        this._recalculateCountAndDuration();
        super._hideLoader();
        return { failed: false };
      })
      .catch(error => {
        super._hideLoader();
        super._showActivationError(error.message);
        return Observable.of({ failed: true, error });
      });
  }

  private _getEntriesRequest(): Observable<KalturaBaseEntry[]> {

    const responseProfile = new KalturaDetachedResponseProfile({
      type: KalturaResponseProfileType.includeFields,
      fields: 'thumbnailUrl,id,name,mediaType,createdAt,duration'
    });
    if (this.isNewData) {
      if (this.data.playlistContent) {
        return this._kalturaClient.request(new BaseEntryListAction({
          filter: new KalturaBaseEntryFilter({ idIn: this.data.playlistContent }),

          pager: new KalturaFilterPager({ pageSize: 500 })
        }).setRequestOptions({
            responseProfile
        }))
          .map(response => {
            return response.objects;
          });
      } else {
        return Observable.of([]);
      }
    } else {
      return this._kalturaClient.request(new PlaylistExecuteAction({
        id: this.data.id
      }).setRequestOptions({
          acceptedTypes: [KalturaMediaEntry],
          responseProfile
      }));
    }
  }

  private _extendWithSelectionId(entries: KalturaMediaEntry[]): PlaylistContentMediaEntry[] {
    return entries.map(entry => {
      (<PlaylistContentMediaEntry>entry).selectionId = this._selectionIdGenerator.generateUnique(this.entries.map(item => item.selectionId));

      return (<PlaylistContentMediaEntry>entry);
    });
  }

  private _setDirty(): void {
    this.updateState({ isDirty: true });
  }

  private _recalculateCountAndDuration(): void {
    this.entriesTotalCount = this.entries.length;
    this.entriesDuration = this.entries.reduce((acc, val) => acc + val.duration, 0);
  }

  private _deleteEntryFromPlaylist(entry: PlaylistContentMediaEntry): void {
      this._logger.info(`handle delete entry from playlist action by user`, { entryId: entry.id });
    const entryIndex = this.entries.indexOf(entry);

    if (entryIndex !== -1) {
      this.entries.splice(entryIndex, 1);
      this._recalculateCountAndDuration();

      this._setDirty();
    } else {
        this._logger.info(`entry not found in the list, abort action`);
    }
  }

  private _duplicateEntry(entry: PlaylistContentMediaEntry): void {
      this._logger.info(`handle duplicate entry action by user`, { entryId: entry.id });
    const entryIndex = this.entries.indexOf(entry);

    if (entryIndex !== -1) {
      const clonedEntry = <PlaylistContentMediaEntry>Object.assign(KalturaTypesFactory.createObject(entry), entry);
      this._extendWithSelectionId([clonedEntry]);
      this._logger.debug(`cloned entry`, { selectionId: clonedEntry.selectionId});
      this.entries.splice(entryIndex, 0, clonedEntry);
      this._recalculateCountAndDuration();
      this._setDirty();
    } else {
        this._logger.info(`entry not found in the list, abort action`);
    }
  }

  private _moveUpEntries(selectedEntries: PlaylistContentMediaEntry[]): void {
      this._logger.info(
          `handle move up entries action by user`,
          () => ({ entriesIds: selectedEntries.map(({ id }) => id) })
      );
    if (KalturaUtils.moveUpItems(this.entries, selectedEntries)) {
      this._setDirty();
    }
  }

  private _moveDownEntries(selectedEntries: PlaylistContentMediaEntry[]): void {
      this._logger.info(
          `handle move down entries action by user`,
          () => ({ entriesIds: selectedEntries.map(({ id }) => id) })
      );
    if (KalturaUtils.moveDownItems(this.entries, selectedEntries)) {
      this._setDirty();
    }
  }

  public deleteSelectedEntries(entries: PlaylistContentMediaEntry[]): void {
      this._logger.info(
          `handle delete selected entries action by user`,
          () => ({ entriesIds: entries.map(({ id }) => id) })
      );
    entries.forEach(entry => this._deleteEntryFromPlaylist(entry));
  }

  public onActionSelected({ action, entry }: { action: string, entry: PlaylistContentMediaEntry }): void {
    switch (action) {
      case 'remove':
        this._deleteEntryFromPlaylist(entry);
        break;
      case 'moveUp':
        this._moveUpEntries([entry]);
        break;
      case 'moveDown':
        this._moveDownEntries([entry]);
        break;
      case 'duplicate':
        this._duplicateEntry(entry);
        break;
      default:
        break;
    }
  }

  public moveEntries({ entries, direction }: { entries: PlaylistContentMediaEntry[], direction: 'up' | 'down' }): void {
    if (direction === 'up') {
      this._moveUpEntries(entries);
    } else {
      this._moveDownEntries(entries);
    }
  }

  public addEntries(entries: KalturaMediaEntry[]): void {
      this._logger.info(
          `handle add entries action by user`,
          () => ({ entriesIds: entries.map(({ id }) => id) })
      );
    this.entries.push(...this._extendWithSelectionId(entries));
    this._recalculateCountAndDuration();
    this._setDirty();
  }

  public onSortChanged(event: { field: string, order: -1 | 1, multisortmeta: any }): void {
      this._logger.info(`handle sort changed action by user`, { sortBy: event.field, order: event.order });
    this.entries.sort(this._getComparatorFor(event.field, event.order));
    this._setDirty();
  }

  private _getComparatorFor(field: string, order: -1 | 1): (a: PlaylistContentMediaEntry, b: PlaylistContentMediaEntry) => number {
    return (a, b) => {
      const fieldA = typeof a[field] === 'string' ? a[field].toLowerCase() : a[field];
      const fieldB = typeof b[field] === 'string' ? b[field].toLowerCase() : b[field];

      if (fieldA < fieldB) {
        return order;
      }

      if (fieldA > fieldB) {
        return -order;
      }

      return 0;
    };
  }
}
