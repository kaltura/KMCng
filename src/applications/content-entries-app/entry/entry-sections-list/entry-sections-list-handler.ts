import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AppLocalization } from "@kaltura-ng2/kaltura-common";
import { SectionsList } from './sections-list';
import { EntrySectionTypes } from '../entry-sections-types';
import { KalturaMediaType } from 'kaltura-typescript-client/types/all';
import { KalturaClient } from '@kaltura-ng/kaltura-client';
import '@kaltura-ng2/kaltura-common/rxjs/add/operators';
import { EntrySection } from '../entry-section-handler';
import { EntrySectionsManager } from '../entry-sections-manager';
import { KalturaMediaEntry } from 'kaltura-typescript-client/types/all';

export interface SectionData
{
    label : string,
    hasErrors : boolean,
    active?: boolean,
    sectionType : EntrySectionTypes
}


@Injectable()
export class EntrySectionsListHandler extends EntrySection
{
    private _sections : BehaviorSubject<SectionData[]> = new BehaviorSubject<SectionData[]>(null);
    public sections$ : Observable<SectionData[]> = this._sections.asObservable();
    private _activeSectionType : EntrySectionTypes;
    private _firstLoad = true;

    constructor(private _manager : EntrySectionsManager,
                kalturaServerClient: KalturaClient,
                private _appLocalization: AppLocalization,)
    {
        super(_manager);
    }

    protected _onDataLoading(dataId : any) : void {
        this._clearSections();
    }

    protected _onDataLoaded(data : KalturaMediaEntry) : void {
        this._reloadSections(data);
    }

    protected _initialize() : void {

        super._initialize();

        this._manager.activeSection$
            .cancelOnDestroy(this)
            .subscribe(
                section =>
                {
                    if (section) {
                        this._updateActiveSection(section.sectionType);
                    }
                }
            );

        this._manager.sectionsState$
            .cancelOnDestroy(this)
            .monitor('entry sections list: update sections validation state')
            .subscribe(
                sectionsState => {
                    const sections = this._sections.getValue();

                    if (sections) {
                        sections.forEach(section =>
                        {
                            const sectionStatus = sectionsState[section.sectionType];
                            const hasErrors = (!!sectionStatus && !sectionStatus.isValid);

                            if (section.hasErrors  !== hasErrors) {
                                console.log(`entry sections list: update section '${section.sectionType}' has errors state to '${hasErrors}'`);
                                section.hasErrors  = hasErrors;
                            }
                        });
                    }
                }
            );
    }

    public get sectionType() : EntrySectionTypes
    {
        return null;
    }

    /**
     * Do some cleanups if needed once the section is removed
     */
    protected _reset()
    {

    }

    private _updateActiveSection(sectionType : EntrySectionTypes) : void
    {
        this._activeSectionType = sectionType;

        if (this._sections.getValue())
        {
            this._sections.getValue().forEach((section : SectionData) =>
            {
                section.active = section.sectionType === this._activeSectionType;
            });
        }
    }

    private _clearSections() : void
    {
        this._sections.next([]);

    }

    private _reloadSections(entry : KalturaMediaEntry) : void
    {
        const sections = [];
        const sectionsState = this._manager.sectionsState;

        if (entry) {
            SectionsList.forEach((section: any) => {

                const sectionState =  sectionsState ? sectionsState[section.sectionType] : null;

                if (this._isSectionEnabled(section, entry)) {
                    sections.push(
                        {
                            label: this._appLocalization.get(section.label),
                            active: section.sectionType === this._activeSectionType,
                            hasErrors: sectionState ? sectionState.isValid : false,
                            sectionType: section.sectionType
                        }
                    );
                }
            });
        }

        this._sections.next(sections);
    }

    private _isSectionEnabled(section : SectionData, entry : KalturaMediaEntry) : boolean {
        const mediaType = this.data.mediaType;
        switch (section.sectionType) {
            case EntrySectionTypes.Thumbnails:
                return mediaType !== KalturaMediaType.image;
            case EntrySectionTypes.Flavours:
                return mediaType !== KalturaMediaType.image && !this._isLive(entry);
            case EntrySectionTypes.Captions:
                return mediaType !== KalturaMediaType.image && !this._isLive(entry);
            case EntrySectionTypes.Live:
                return this._isLive(entry);
            case EntrySectionTypes.Clips:
	            return mediaType !== KalturaMediaType.image
            default:
                return true;
        }
    }

    private _isLive( entry : KalturaMediaEntry): boolean {
        const mediaType = entry.mediaType;
        return mediaType === KalturaMediaType.liveStreamFlash || mediaType === KalturaMediaType.liveStreamWindowsMedia || mediaType === KalturaMediaType.liveStreamRealMedia || mediaType === KalturaMediaType.liveStreamQuicktime;
    }

    protected _activate(firstLoad : boolean) {
        // do nothing
    }
}
