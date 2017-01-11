import { Component, OnInit, OnDestroy, EventEmitter, Output, IterableDiffer, IterableDiffers} from '@angular/core';
import { Subscription} from 'rxjs';
import {PrimeTreeNode, TreeDataHandler} from '@kaltura-ng2/kaltura-primeng-ui';
import { ContentAdditionalFiltersStore, Filters } from '../../../shared/kmc-content-ui/providers/content-additional-filters-store.service';
import {ContentEntriesStore} from "../../../shared/kmc-content-ui/providers/content-entries-store.service";
import {FilterItem} from "../../../shared/kmc-content-ui/content-entries-filter/filter-item";
import {MediaTypesFilter} from "../../../shared/kmc-content-ui/content-entries-filter/filters/media-types-filter";

import * as R from 'ramda';
import {FlavorsFilter} from "../../../shared/kmc-content-ui/content-entries-filter/filters/flavors-filter";

export interface RefineFiltersChangedArgs
{
    createdAtGreaterThanOrEqual? : Number;
    createdAtLessThanOrEqual? : Number;
    mediaTypeIn? : string;
    statusIn? : string;
    durationTypeMatchOr? :string;
    isRoot? : number;
    endDateLessThanOrEqual? : Number;
    startDateLessThanOrEqualOrNull? : Number;
    endDateGreaterThanOrEqualOrNull? : Number;
    startDateGreaterThanOrEqual? : Number;
    moderationStatusIn? : string;
    replacementStatusIn? : string;
    flavorParamsIdsMatchOr? : string;
    accessControlIdIn? : string;
    distributionProfiles? : string[]; // since this should fill the advanced search object with the metadata profiles - it will be parsed in the content-entries-store
    metadataProfiles? : any[];
}

function toServerDate(value? : Date) : number
{
    return value ? value.getTime() / 1000 : null;
}

@Component({
    selector: 'kAdditionalFilter',
    templateUrl: './additional-filters.component.html',
    styleUrls: ['./additional-filters.component.scss']
})
export class AdditionalFiltersComponent implements OnInit, OnDestroy{

    additionalFiltersSubscribe : Subscription;
    selectedFilters: any[] = [];

    filter: RefineFiltersChangedArgs;
    loading = false;

    createdFrom: Date;
    createdTo: Date;
    scheduledFrom: Date;
    scheduledTo: Date;

    @Output()
    refineFiltersChanged = new EventEmitter<RefineFiltersChangedArgs>();

    private defaultFiltersNodes : PrimeTreeNode[] = [];
    private customFiltersNode : PrimeTreeNode[] = [];
    private filters : any;

    private treeSelectionsDiffer : IterableDiffer = null;

    constructor(public contentAdditionalFiltersStore: ContentAdditionalFiltersStore, private treeDataHandler : TreeDataHandler,
                private contentEntriesStore : ContentEntriesStore, private differs: IterableDiffers) {
    }


    ngOnInit() {
        this.treeSelectionsDiffer = this.differs.find([]).create(null);

        this.additionalFiltersSubscribe = this.contentAdditionalFiltersStore.additionalFilters$.subscribe(
            (filters: Filters) => {

                this.defaultFiltersNodes = [];
                this.filters = filters;

                // create root nodes
                filters.filtersGroups.forEach(group =>
                {
                    if (group.groupName)
                    {

                    }else
                    {
                        // filter is part of the default group (additional information)
                        group.filtersTypes.forEach(filter =>
                        {
                            const filterItems = filters.filtersByType[filter.type];

                            if (filterItems && filterItems.length > 0) {
                                this.defaultFiltersNodes.push(
                                new PrimeTreeNode(null, filter.caption,
                                    this.treeDataHandler.create(
                                        {
                                            data : filterItems,
                                            idProperty : 'id',
                                            nameProperty : 'name',
                                            payload : filter.type

                                        }
                                    )
                                    , filter.type)
                                );
                            }
                        });
                    }

                });

            },
            (error) => {
                // TODO [KMC] - handle error
            });

        // this.initFilter();
        // this.reloadAdditionalFilters();
    }



    //
    // reloadAdditionalFilters(){
    //     this.loading = true;
    //     this.contentAdditionalFiltersStore.reloadAdditionalFilters(false).subscribe(
    //         () => {
    //             this.loading = false;
    //         },
    //         (error) => {
    //             // TODO [KMC] - handle error
    //             this.loading = false;
    //         });
    // }
    //
    // clearDates(){
    //     this.createdFrom = null;
    //     this.createdTo = null;
    //     this.updateFilter();
    // }
    //
    // clearAll(){
    //     this.selectedFilters = [];
    //     // clear all partial selections
    //     this.additionalFilters.forEach((filter: AdditionalFilter) => {
    //         if (filter['partialSelected']){
    //             filter['partialSelected'] = false;
    //         }
    //     });
    //     this.updateFilter();
    // }

    // init filter
    initFilter(){
        this.filter = {
            statusIn: "-1,-2,0,1,2,7,4",
            mediaTypeIn: "1,2,5,6,201",
            metadataProfiles: []
        };
    }


    updateFilter(event)
    {

        let newFilters : FilterItem[] = [];
        let removedFilters : FilterItem[] = [];

        const selectionChanges = this.treeSelectionsDiffer.diff(this.selectedFilters);

        if (selectionChanges)
        {
            selectionChanges.forEachAddedItem((record) => {
                const node : PrimeTreeNode = record.item;
                const filter = this.createFilter(node);

                if (filter)
                {
                    newFilters.push(filter);
                }
            });

            selectionChanges.forEachRemovedItem((record) => {
                const node : PrimeTreeNode = record.item;

                const filter = this.removeFilter(node);

                if (filter)
                {
                    newFilters.push(filter);
                }

                removedFilters.push(filter);
            });
        }

        if (newFilters.length > 0) {
            this.contentEntriesStore.addFilters(...newFilters);
        }

        if (removedFilters.length > 0) {
            this.contentEntriesStore.removeFilters(...removedFilters);
        }
    }

    createFilter(node : PrimeTreeNode) : FilterItem
    {
        let result : FilterItem = null;

        // ignore undefined/null filter data (the virtual roots has undefined/null data)
        if (node instanceof PrimeTreeNode && typeof node.data !== 'undefined' && node.data !== null)
        {
            switch (node.payload)
            {
                case "mediaTypes":
                    result = new MediaTypesFilter(<string>node.data, node.label);
                    break;
                case "flavors":
                    result = new FlavorsFilter(<string>node.data, node.label);

                default:

                    break;
            }
        }

        return result;
    }

    removeFilter(node : PrimeTreeNode)
    {
        let result : FilterItem = null;

        // ignore undefined/null filter data (the virtual roots has undefined/null data)
        if (node instanceof PrimeTreeNode && typeof node.data !== 'undefined' && node.data !== null)
        {
            switch (node.payload)
            {
                case "mediaTypes":
                    result = R.find((filter : MediaTypesFilter) =>
                    {
                        // we are doing a weak comparison on purpose to overcome number/string comparison issues
                        return filter.mediaType  == node.data;
                    }, this.contentEntriesStore.getActiveFilters(MediaTypesFilter));
                    break;
                case "flavors":
                    result = R.find((filter : FlavorsFilter) =>
                    {
                        // we are doing a weak comparison on purpose to overcome number/string comparison issues
                        return filter.flavor  == node.data;
                    }, this.contentEntriesStore.getActiveFilters(FlavorsFilter));
                    break;
                default:


                    break;
            }
        }

        return result;

    }

    // update the filter
    // updateFilter(){
    //     this.initFilter();
    //     let filters: AdditionalFilter[];
    //
    //     // set creation dates filter
    //     if (this.createdFrom || this.createdTo) {
    //         this.filter.createdAtGreaterThanOrEqual = toServerDate(this.createdFrom);
    //         this.filter.createdAtLessThanOrEqual = toServerDate(this.createdTo);
    //     }
    //
    //     this.setFlatFilter(FilterType.Types.IngestionStatus, 'statusIn');                  // set ingestion status filter
    //     this.setFlatFilter(FilterType.Types.MediaType, 'mediaTypeIn');                     // set media type filter
    //     this.setFlatFilter(FilterType.Types.Durations, 'durationTypeMatchOr');             // set duration filter
    //     this.setFlatFilter(FilterType.Types.ModerationStatuses, 'moderationStatusIn');     // set moderation status filter
    //     this.setFlatFilter(FilterType.Types.ReplacementStatuses, 'replacementStatusIn');   // set replacement status filter
    //     this.setFlatFilter(FilterType.Types.Flavors, 'flavorParamsIdsMatchOr');            // set flavors filter
    //     this.setFlatFilter(FilterType.Types.AccessControlProfiles, 'accessControlIdIn');   // set access control profiles filter
    //
    //     // set original and clipped entries filter
    //     filters = R.filter((filter: AdditionalFilter) => filter.filterName === FilterType.Types.OriginalAndClipped, this.selectedFilters);
    //     if (filters.length > 1) {
    //         this.filter.isRoot = -1;
    //     }
    //     if (filters.length === 1) {
    //         this.filter.isRoot = parseInt(filters[0].id);
    //     }
    //
    //     // set time scheduling filter
    //     filters = R.filter((filter: AdditionalFilter) => filter.filterName === FilterType.Types.TimeScheduling, this.selectedFilters);
    //     if (filters.length){
    //         if (R.findIndex(R.propEq('id', 'past'))(filters) > -1){
    //             this.filter.endDateLessThanOrEqual = toServerDate(new Date());
    //         }
    //         if (R.findIndex(R.propEq('id', 'live'))(filters) > -1){
    //             this.filter.startDateLessThanOrEqualOrNull = toServerDate(new Date());
    //             this.filter.endDateGreaterThanOrEqualOrNull = toServerDate(new Date());
    //         }
    //         if (R.findIndex(R.propEq('id', 'future'))(filters) > -1){
    //             this.filter.startDateGreaterThanOrEqual = toServerDate(new Date());
    //         }
    //         if (R.findIndex(R.propEq('id', 'scheduled'))(filters) > -1){
    //             this.filter.startDateGreaterThanOrEqual = toServerDate(this.scheduledFrom);
    //             this.filter.endDateLessThanOrEqual = toServerDate(this.scheduledTo);
    //         }
    //     }
    //
    //     // set distribution profiles filter
    //     filters = R.filter((filter: AdditionalFilter) => filter.filterName === FilterType.Types.DistributionProfiles, this.selectedFilters);
    //     if (filters.length){
    //         this.filter.distributionProfiles = [];
    //         filters.forEach( (distributionProfile) => {
    //             if (distributionProfile.id.length){
    //                 this.filter.distributionProfiles.push(distributionProfile.id);
    //             }
    //         });
    //     }
    //
    //     // update metadata filters
    //     this.selectedFilters.forEach( filter => {
    //         if (filter instanceof MetadataFilter && filter.id !== ""){
    //             this.filter.metadataProfiles.push({'metadataProfileId': filter.id, 'field': filter.filterName, 'value': filter.label});
    //         }
    //     });
    //
    //     console.info(this.filter);
    //     this.refineFiltersChanged.emit(this.filter);
    // }
    //
    // setFlatFilter(filterName: string, filterPoperty: string){
    //     const filters: AdditionalFilter[] = R.filter((filter: AdditionalFilter) => filter.filterName === filterName, this.selectedFilters);
    //     if (filters.length){
    //         this.filter[filterPoperty] = "";
    //         filters.forEach((filter: AdditionalFilter) => {
    //             if (filter.id !== '') {
    //                 this.filter[filterPoperty] += filter.id + ',';
    //             }
    //         });
    //         this.filter[filterPoperty] = this.filter[filterPoperty].substr(0, this.filter[filterPoperty].length-1); // remove last comma from string
    //     }
    // }

    isScheduledEnabled(){
        return false;
        // const filters: AdditionalFilter[] = R.filter((filter: AdditionalFilter) => filter.filterName === FilterType.Types.TimeScheduling, this.selectedFilters);
        // return R.findIndex(R.propEq('id', 'scheduled'))(filters) > -1;
    }

    blockScheduleToggle(event){
        event.stopPropagation();
    }

    ngOnDestroy(){
        this.additionalFiltersSubscribe.unsubscribe();
    }
}
