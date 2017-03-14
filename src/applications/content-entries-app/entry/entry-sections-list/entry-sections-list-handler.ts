import { Injectable } from '@angular/core';
import {
    FormSectionHandler, ActivateArgs, OnDataLoadingArgs,
    OnDataLoadedArgs
} from '../../entry-store/form-section-handler';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { EntryLoaded, SectionEntered } from '../../entry-store/entry-sections-events';
import { AppLocalization } from "@kaltura-ng2/kaltura-common";
import { SectionsList } from './sections-list';
import { EntrySectionTypes } from '../../entry-store/entry-sections-types';
import { KalturaServerClient } from '@kaltura-ng2/kaltura-api';
import '@kaltura-ng2/kaltura-common/rxjs/add/operators';
import { FormSectionsManager } from '../../entry-store/form-sections-manager';

export interface SectionData
{
    label : string,
    hasErrors : boolean,
    active?: boolean,
    sectionType : EntrySectionTypes
}


@Injectable()
export class EntrySectionsListHandler extends FormSectionHandler
{
    private _sections : BehaviorSubject<SectionData[]> = new BehaviorSubject<SectionData[]>(null);
    public sections$ : Observable<SectionData[]> = this._sections.asObservable();
    private _activeSectionType : EntrySectionTypes;
    private _firstLoad = true;

    constructor(manager : FormSectionsManager,
                kalturaServerClient: KalturaServerClient,
                private _appLocalization: AppLocalization,)
    {
        super(manager,kalturaServerClient);


        manager.activeSection$
            .cancelOnDestroy(this)
            .subscribe(
            section =>
            {
                if (section) {
                    this._updateActiveSection(section.sectionType);
                }
            }
        );
    }

    protected _onDataLoading(args : OnDataLoadingArgs) : void {
        this._clearSections();
    }

    protected _onDataLoaded(args : OnDataLoadedArgs) : void {
        this._reloadSections(args.entry.id);
    }

    protected _initialize() : void {

        this._listenToSections();
    }

    private _listenToSections()
    {
        // if (this.manager.sections && this.manager.sections.length) {
        //
        //     Observable.merge(
        //         ...this.manager.sections.map(item => item.sectionStatus$)
        //     ).cancelOnDestroy(this)
        //         .subscribe(
        //             (sectionStatus) =>
        //             {
        //                 const sections = this._sections.getValue();
        //
        //                 if (sections) {
        //                     const section = sections.find(section => section.sectionType === sectionStatus.section);
        //
        //                     if (section) {
        //                         section.hasErrors = !sectionStatus.isValid;
        //                     }
        //                 }
        //             }
        //         );
        // }
    }

    public get sectionType() : EntrySectionTypes
    {
        return null;
    }

    /**
     * Do some cleanups if needed once the section is removed
     */
    protected _onReset()
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

    private _reloadSections(entryId) : void
    {
        const sections = [];

        if (entryId) {
            SectionsList.forEach((section: any) => {
                sections.push(
                    {
                        label: this._appLocalization.get(section.label),
                        active: section.sectionType === this._activeSectionType,
                        hasErrors: false,
                        sectionType: section.sectionType
                    }
                );
            });
        }

        this._sections.next(sections);
    }

    protected _activate(args : ActivateArgs) {
        // do nothing
    }
}