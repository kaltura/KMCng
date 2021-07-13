import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { SectionsList } from './sections-list';
import { TranscodingProfileWidget } from '../transcoding-profile-widget';
import { KalturaConversionProfileWithAsset } from '../../transcoding-profiles/transcoding-profiles-store/base-transcoding-profiles-store.service';
import {
    SettingsTranscodingProfileViewSections,
    SettingsTranscodingProfileViewService
} from 'app-shared/kmc-shared/kmc-views/details-views';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

export interface SectionWidgetItem {
  label: string;
  isValid: boolean;
  attached: boolean;
  key: SettingsTranscodingProfileViewSections;
}

@Injectable()
export class TranscodingProfileSectionsListWidget extends TranscodingProfileWidget implements OnDestroy {
  private _sections = new BehaviorSubject<SectionWidgetItem[]>([]);
  public sections$: Observable<SectionWidgetItem[]> = this._sections.asObservable();

  constructor(private _appLocalization: AppLocalization,
              private _settingsTranscodingProfileViewService: SettingsTranscodingProfileViewService,
              logger: KalturaLogger) {
    super('sectionsList', logger);
  }

  ngOnDestroy() {

  }

  private _initialize(): void {
    this.form.widgetsState$
      .pipe(cancelOnDestroy(this))
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

  protected onDataLoading(dataId: any): void {
    this._clearSectionsList();
  }

  protected onActivate(firstTimeActivating: boolean): void {
    if (firstTimeActivating) {
      this._initialize();
    }
  }

  protected onDataLoaded(data: KalturaConversionProfileWithAsset): void {
    this._reloadSections(data);
  }

  /**
   * Do some cleanups if needed once the section is removed
   */
  protected onReset() {

  }

  private _clearSectionsList(): void {
    this._sections.next([]);

  }

  private _reloadSections(profile: KalturaConversionProfileWithAsset): void {
    const sections = [];
    const formWidgetsState = this.form.widgetsState;

    if (profile) {
      SectionsList.forEach((section) => {

        const sectionFormWidgetState = formWidgetsState ? formWidgetsState[section.key] : null;
        const isSectionActive = sectionFormWidgetState && sectionFormWidgetState.isActive;

        if (this._settingsTranscodingProfileViewService.isAvailable({ section: section.key, profile })) {
          sections.push({
            label: this._appLocalization.get(section.label),
            active: isSectionActive,
            hasErrors: sectionFormWidgetState ? sectionFormWidgetState.isValid : false,
            key: section.key
          });
        }
      });
    }

    this._sections.next(sections);
  }
}
