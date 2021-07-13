import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient, KalturaMultiRequest, KalturaObjectBaseFactory } from 'kaltura-ngx-client';
import { KalturaPlaylist } from 'kaltura-ngx-client';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client';
import { KalturaResponseProfileType } from 'kaltura-ngx-client';
import { FriendlyHashId } from '@kaltura-ng/kaltura-common';
import { KalturaUtils } from '@kaltura-ng/kaltura-common';
import { KalturaBaseEntry } from 'kaltura-ngx-client';
import { BaseEntryListAction } from 'kaltura-ngx-client';
import { KalturaBaseEntryFilter } from 'kaltura-ngx-client';
import { PlaylistWidget } from '../../playlist-widget';
import { KalturaPlaylistType } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { ContentPlaylistViewSections } from 'app-shared/kmc-shared/kmc-views/details-views';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import {PlaylistsUtilsService} from "../../../playlists-utils.service";
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface PlaylistContentMediaEntry extends KalturaMediaEntry {
  selectionId?: string;
}

@Injectable()
export class ManualContentWidget extends PlaylistWidget implements OnDestroy {
  private _selectionIdGenerator = new FriendlyHashId();

  public entries: PlaylistContentMediaEntry[] = [];
  public entriesTotalCount = 0;
  public entriesDuration = 0;
  public _isRapt = false;


  constructor(private _kalturaClient: KalturaClient,
              logger: KalturaLogger,
              private _playlistsUtilsService: PlaylistsUtilsService) {
    super(ContentPlaylistViewSections.Content, logger);
  }

  ngOnDestroy() {
  }

  protected onValidate(wasActivated: boolean): Observable<{ isValid: boolean }> {
    if (this.data.playlistType === KalturaPlaylistType.staticList) { // validate only manual playlist
      if (this.wasActivated) {
        return of({ isValid: !!this.entries.length });
      }

      if (this.isNewData && (this.data.playlistContent || '').trim().length > 0) {
        return of({ isValid: true });
      }

      return of({ isValid: false });
    }

    return of({ isValid: true });
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
    this._isRapt = this._playlistsUtilsService.isRapt(this.data) || this._playlistsUtilsService.isPath(this.data);
    return this._getEntriesRequest()
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .pipe(map((entries: KalturaMediaEntry[]) => {
        this.entries = this._sortAndHandleDuplicates(entries);
        this.entries = this._extendWithSelectionId(this.entries);
        this._recalculateCountAndDuration();
        super._hideLoader();
        return { failed: false };
      }))
      .pipe(catchError(error => {
        super._hideLoader();
        super._showActivationError(error.message);
        return of({ failed: true, error });
      }));
  }

  private _getEntriesRequest(): Observable<KalturaBaseEntry[]> {

      const responseProfile = new KalturaDetachedResponseProfile({
          type: KalturaResponseProfileType.includeFields,
          fields: 'thumbnailUrl,id,name,mediaType,createdAt,duration,externalSourceType,capabilities'
      });

      if (this.data.playlistContent) {
          return this._kalturaClient.request(new BaseEntryListAction({
              filter: new KalturaBaseEntryFilter({idIn: this.data.playlistContent, statusIn: '1,2,7,5,6'}),
              pager: new KalturaFilterPager({pageSize: 500})
          }).setRequestOptions({
              acceptedTypes: [KalturaMediaEntry],
              responseProfile
          }))
              .pipe(map(response => {
                  return response.objects.map(entry => {
                      if ((entry.capabilities || '').indexOf('quiz.quiz') !== -1) {
                          entry['isQuizEntry'] = true;
                      }

                      return entry;
                  });
              }));
      } else {
          return of([]);
      }
  }

  private _sortAndHandleDuplicates(entries: KalturaMediaEntry[]): KalturaMediaEntry[] {
    let result = [];
    const entryIds = this.data.playlistContent ? this.data.playlistContent.split(",") : [];
    entryIds.forEach(id => {
        const entry = entries.find(entry => entry.id === id);
        if (entry) {
            // clone the entry to be able to extend duplicated entries with unique selectedId
            const clonedEntry = <PlaylistContentMediaEntry>Object.assign(KalturaObjectBaseFactory.createObject(entry), entry);
            result.push(clonedEntry);
        }
    });
    return result;
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
    const entryIndex = this.entries.indexOf(entry);

    if (entryIndex !== -1) {
      this.entries.splice(entryIndex, 1);
      this._recalculateCountAndDuration();

      this._setDirty();
    }
  }

  private _duplicateEntry(entry: PlaylistContentMediaEntry): void {
    const entryIndex = this.entries.indexOf(entry);

    if (entryIndex !== -1) {
      const clonedEntry = new KalturaMediaEntry(entry);
      this._extendWithSelectionId([clonedEntry]);
      this.entries.splice(entryIndex, 0, clonedEntry);
      this._recalculateCountAndDuration();
      this._setDirty();
    }
  }

  private _moveUpEntries(selectedEntries: PlaylistContentMediaEntry[]): void {
    if (KalturaUtils.moveUpItems(this.entries, selectedEntries)) {
      this._setDirty();
    }
  }

  private _moveDownEntries(selectedEntries: PlaylistContentMediaEntry[]): void {
    if (KalturaUtils.moveDownItems(this.entries, selectedEntries)) {
      this._setDirty();
    }
  }

  private _moveTopEntry(selectedEntry: PlaylistContentMediaEntry): void {
      const index = this.entries.indexOf(selectedEntry);
      if (index > 0){
          this.entries.splice(index, 1);
          this.entries.unshift(selectedEntry);
          this._setDirty();
      }
  }

  private _moveBottomEntry(selectedEntry: PlaylistContentMediaEntry): void {
      const index = this.entries.indexOf(selectedEntry);
      if (index > -1){
          this.entries.splice(index, 1);
          this.entries.push(selectedEntry);
          this._setDirty();
      }
  }

  public deleteSelectedEntries(entries: PlaylistContentMediaEntry[]): void {
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
      case 'moveTop':
        this._moveTopEntry(entry)
        break;
      case 'moveBottom':
        this._moveBottomEntry(entry);
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
    this.entries.push(...this._extendWithSelectionId(entries));
    this._recalculateCountAndDuration();
    this._setDirty();
  }

  public onSortChanged(event: { field: string, order: -1 | 1, multisortmeta: any }): void {
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
