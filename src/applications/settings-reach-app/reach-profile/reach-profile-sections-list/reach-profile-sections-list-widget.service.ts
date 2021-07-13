import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { SectionsList } from './sections-list';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import {ReachProfileWidget} from "../reach-profile-widget";
import {
    SettingsReachProfileViewSections,
    SettingsReachProfileViewService
} from "app-shared/kmc-shared/kmc-views/details-views/settings-reach-profile-view.service";
import {KalturaReachProfile} from "kaltura-ngx-client";

export interface SectionWidgetItem {
  label: string;
  isValid: boolean;
  attached: boolean;
  key: SettingsReachProfileViewSections;
}

@Injectable()
export class ReachProfileSectionsListWidget extends ReachProfileWidget implements OnDestroy {
  private _sections = new BehaviorSubject<SectionWidgetItem[]>([]);
  public sections$: Observable<SectionWidgetItem[]> = this._sections.asObservable();

  constructor(private _appLocalization: AppLocalization,
              private _settingsReachProfileViewService: SettingsReachProfileViewService,
              logger: KalturaLogger) {
    super('reachSectionsList', logger);
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

  protected onDataLoaded(data: KalturaReachProfile): void {
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

  private _reloadSections(profile: KalturaReachProfile): void {
    const sections = [];
    const formWidgetsState = this.form.widgetsState;

    if (profile) {
      SectionsList.forEach((section) => {

        const sectionFormWidgetState = formWidgetsState ? formWidgetsState[section.key] : null;
        const isSectionActive = sectionFormWidgetState && sectionFormWidgetState.isActive;

        if (this._settingsReachProfileViewService.isAvailable({ section: section.key, profile })) {
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
