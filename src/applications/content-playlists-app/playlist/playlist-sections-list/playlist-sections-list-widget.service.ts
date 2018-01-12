import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { PlaylistWidget } from '../playlist-widget';
import { KalturaPlaylist } from 'kaltura-ngx-client/api/types/KalturaPlaylist';
import { SectionsList } from './sections-list';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import { KalturaPlaylistType } from 'kaltura-ngx-client/api/types/KalturaPlaylistType';
import { PlaylistWidgetKeys } from '../playlist-widget-keys';

export interface SectionWidgetItem {
  label: string,
  isValid: boolean,
  attached: boolean,
  key: string
}

@Injectable()
export class PlaylistSectionsListWidget extends PlaylistWidget implements OnDestroy {
  private _sections = new BehaviorSubject<SectionWidgetItem[]>([]);
  public sections$: Observable<SectionWidgetItem[]> = this._sections.asObservable();

  constructor(private _appLocalization: AppLocalization) {
    super('sectionsList');
  }

  ngOnDestroy() {
  }

  protected onDataLoading(dataId: any): void {
    this._clearSectionsList();
  }

  protected onActivate(firstTimeActivating: boolean) {
    if (firstTimeActivating) {
      this._initialize();
    }
  }

  protected onDataLoaded(data: KalturaPlaylist): void {
    this._reloadSections(data);
  }

  private _initialize(): void {
    this.form.widgetsState$
      .cancelOnDestroy(this)
      .subscribe(
        sectionsState => {
          this._sections.getValue().forEach((section: SectionWidgetItem) => {
            const sectionState = sectionsState[section.key];
            const isValid = (!sectionState || sectionState.isBusy || sectionState.isValid || !sectionState.isActive);
            const isAttached = (!!sectionState && sectionState.isAttached);

            if (section.attached !== isAttached || section.isValid !== isValid) {
              section.attached = isAttached;
              section.isValid = isValid;
            }
          });
        }
      );
  }

  /**
   * Do some cleanups if needed once the section is removed
   */
  protected onReset() {

  }

  private _clearSectionsList(): void {
    this._sections.next([]);

  }

  private _reloadSections(playlist: KalturaPlaylist): void {
    const sections = [];
    const formWidgetsState = this.form.widgetsState;

    if (playlist) {
      SectionsList.forEach((section) => {

        const sectionFormWidgetState = formWidgetsState ? formWidgetsState[section.key] : null;
        const isSectionActive = sectionFormWidgetState && sectionFormWidgetState.isActive;

        if (this._isSectionEnabled(section.key, playlist)) {
          sections.push(
            {
              label: this._appLocalization.get(section.label),
              active: isSectionActive,
              hasErrors: sectionFormWidgetState ? sectionFormWidgetState.isValid : false,
              key: section.key
            }
          );
        }
      });
    }

    this._sections.next(sections);
  }

  private _isSectionEnabled(sectionKey: string, playlist: KalturaPlaylist): boolean {
    switch (sectionKey) {
      case PlaylistWidgetKeys.Content:
        return playlist.playlistType === KalturaPlaylistType.staticList;
      case PlaylistWidgetKeys.ContentRuleBased:
        return playlist.playlistType === KalturaPlaylistType.dynamic;
      case PlaylistWidgetKeys.Metadata:
        return true;
      default:
        return false;
    }
  }
}
