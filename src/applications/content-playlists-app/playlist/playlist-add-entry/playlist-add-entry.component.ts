import { Component, EventEmitter, Output } from '@angular/core';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { KalturaEntryStatus } from 'kaltura-ngx-client/api/types/KalturaEntryStatus';
import { EntriesFilters } from 'app-shared/content-shared/entries/entries-store/entries-store.service';

@Component({
  selector: 'kAddEntry',
  templateUrl: './playlist-add-entry.component.html',
  styleUrls: ['./playlist-add-entry.component.scss']
})
export class PlaylistAddEntryComponent {
  @Output() onClosePopupWidget = new EventEmitter<void>();
  @Output() onAddEntries = new EventEmitter<KalturaMediaEntry[]>();

  public _selectedEntries: KalturaMediaEntry[] = [];
  public _addButtonLabel = '';
  public _addButtonLabelTranslation = '';
  public _enforcedFilters: Partial<EntriesFilters> = {
    'ingestionStatuses': [
      KalturaEntryStatus.preconvert,
      KalturaEntryStatus.ready,
      KalturaEntryStatus.moderate,
      KalturaEntryStatus.blocked
    ]
  };

  constructor(private _appLocalization: AppLocalization) {
    this._addButtonLabelTranslation = this._addButtonLabel = this._appLocalization.get('applications.content.playlists.addToPlaylist');
  }

  public _selectionChanged(entries: KalturaMediaEntry[]): void {
    this._addButtonLabel = entries.length > 0
      ? `${this._addButtonLabelTranslation} ${entries.length}`
      : this._addButtonLabelTranslation;
  }

  public _addEntries(): void {
    this.onAddEntries.emit(this._selectedEntries);
    this.onClosePopupWidget.emit();
  }
}

