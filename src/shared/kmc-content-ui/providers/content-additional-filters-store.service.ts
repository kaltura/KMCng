import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';

import {KalturaServerClient, KalturaMetadataObjectType, KalturaMultiRequest, KalturaResponse} from '@kaltura-ng2/kaltura-api';
import {FlavorParamsListAction} from '@kaltura-ng2/kaltura-api/services/flavor-params';
import {MetadataProfileListAction} from '@kaltura-ng2/kaltura-api/services/metadata-profile';
import {AccessControlListAction} from '@kaltura-ng2/kaltura-api/services/access-control';
import {DistributionProfileListAction} from '@kaltura-ng2/kaltura-api/services/distribution-profile';

import {
    KalturaMetadataProfileFilter,
    KalturaAccessControlFilter,
    KalturaFilterPager,
    KalturaDetachedResponseProfile,
    KalturaResponseProfileType,
    KalturaFlavorParams,
    KalturaAccessControlProfile,
    KalturaDistributionProfile,
    KalturaMetadataProfile
} from '@kaltura-ng2/kaltura-api/types'

import {FilterType} from '../additional-filters/additional-filters-types';
import {AdditionalFiltersBase} from '../additional-filters/additional-filters-base';

import * as R from 'ramda';

export interface AdditionalFilters {
    items: AdditionalFilter[],
    metadataFilters: MetadataProfileFilterGroup[],
    loaded: boolean,
    status: string
}
export class MetadataProfileFilter {
    label?: string;
    data?: string;
    children?: any[];
}
export class MetadataProfileFilterGroup {
    label?: string;
    filters?: MetadataProfileFilter[];
}
export class AdditionalFilter {
    id: string;
    label = "";
    filterName: string;
    children: AdditionalFilter[] = [];

    constructor(filterName: string, id: string, label: string) {
        this.filterName = filterName;
        this.id = id;
        this.label = label;
    }
}
@Injectable()
export class ContentAdditionalFiltersStore {
    // TODO [KMC] - clear cached data on logout

    private _additionalFilters: BehaviorSubject<AdditionalFilters> = new BehaviorSubject({
        items: [],
        metadataFilters: [],
        loaded: false,
        status: ''
    });
    public additionalFilters$: Observable<AdditionalFilters> = this._additionalFilters.asObservable();

    private rootLevel: AdditionalFilter[] = [];
    private metadataFilters: any[] = [];

    constructor(private kalturaServerClient: KalturaServerClient) {
        this.initRootLevel();
    }

    public reloadAdditionalFilters(ignoreCache: boolean = false): Observable<boolean> {

        const additionalFilters = this._additionalFilters.getValue();

        if (ignoreCache || !additionalFilters.loaded || additionalFilters.status) {

            this._additionalFilters.next({items: [], metadataFilters: [], loaded: false, status: ''});

            const metadataProfilesFilter = new KalturaMetadataProfileFilter();
            metadataProfilesFilter.createModeNotEqual = 3;
            metadataProfilesFilter.orderBy = '-createdAt';
            metadataProfilesFilter.metadataObjectTypeEqual = KalturaMetadataObjectType.Entry;

            const accessControlFilter = new KalturaAccessControlFilter();
            accessControlFilter.orderBy = '-createdAt';

            const distributionProfilePager = new KalturaFilterPager();
            distributionProfilePager.pageSize = 500;

            const accessControlPager = new KalturaFilterPager();
            distributionProfilePager.pageSize = 1000;

            const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile();
            responseProfile.setData( data => {
                data.fields = "id,name";
                data.type = KalturaResponseProfileType.IncludeFields;
            });

            return Observable.create(observe => {


                const request = new KalturaMultiRequest(
                    new MetadataProfileListAction({filter: metadataProfilesFilter}),
                    new DistributionProfileListAction({pager: distributionProfilePager}),
                    new FlavorParamsListAction({pager: distributionProfilePager, responseProfile}),
                    new AccessControlListAction({pager: accessControlPager, filter: accessControlFilter, responseProfile}),
                )
                    return this.kalturaServerClient.multiRequest(request)
                    .map((response: any) => {
                        if (response.length){
                          const additionalFiltersData: AdditionalFilter[] = this.buildAdditionalFiltersHyrarchy(response);
                          return additionalFiltersData;
                        }else{
                          return [];
                        }
                    })
                    .subscribe(
                        (filters: AdditionalFilter[]) => {
                            this._additionalFilters.next({
                                items: <AdditionalFilter[]>filters,
                                metadataFilters: <MetadataProfileFilterGroup[]>this.metadataFilters,
                                loaded: true,
                                status: ''
                            });
                            observe.next(true);
                            observe.complete();
                        },
                        () => {
                            // TODO [KMC]: handle error
                            observe.next(false);
                            observe.complete();
                        }
                    )
            });
        } else {
            return Observable.of(true);
        }
    }

    initRootLevel(){
        this.rootLevel = [];
        let newFilter: AdditionalFilter;

        AdditionalFiltersBase.forEach( filter => {
            newFilter = new AdditionalFilter( filter.filterName, '', filter.label);
            filter.children.forEach(filterNode => {
                newFilter.children.push(new AdditionalFilter(filter.filterName, filterNode.value, filterNode.label));
            });
            this.rootLevel.push(newFilter);
        });
    }


    buildAdditionalFiltersHyrarchy(filters: KalturaResponse<any>[]): AdditionalFilter[] {
        let newFilter: AdditionalFilter;
        filters.forEach((response: KalturaResponse<any>) => {
            if (response.error){
                console.error("Error loading additional filters: "+response.error.message);
            }else{
                if (response.resultType && response.result && response.result.objects && response.result.objects.length) {
                    switch (response.resultType) {
                        case "KalturaFlavorParamsListResponse":
                            newFilter = new AdditionalFilter('flavors', '', 'Flavors');
                            response.result.objects.forEach((flavor: KalturaFlavorParams) => {
                                newFilter.children.push(new AdditionalFilter('flavors', flavor.id.toString(), flavor.name));
                            });
                            this.rootLevel.push(newFilter);
                            break;
                        case "KalturaAccessControlListResponse":
                            newFilter = new AdditionalFilter('accessControlProfiles', '', 'Access Control Profiles');
                            response.result.objects.forEach((accessControlProfile: KalturaAccessControlProfile) => {
                                newFilter.children.push(new AdditionalFilter('accessControlProfiles', accessControlProfile.id.toString(), accessControlProfile.name));
                            });
                            this.rootLevel.push(newFilter);
                            break;
                        case "KalturaDistributionProfileListResponse":
                            newFilter = new AdditionalFilter('distributionProfiles', '', 'Destinations');
                            response.result.objects.forEach((distributionProfile: KalturaDistributionProfile) => {
                                newFilter.children.push(new AdditionalFilter('distributionProfiles', distributionProfile.id.toString(), distributionProfile.name));
                            });
                            this.rootLevel.push(newFilter);
                            break;
                        case "KalturaMetadataProfileListResponse":
                            if (response.result.objects && response.result.objects.length)
                            this.createMetadataProfileFilters(response.result.objects);
                            break;
                    }
                }
            }
        })
        return this.rootLevel;
    }

    createMetadataProfileFilters(metadataProfiles: KalturaMetadataProfile[]){
        try {
            // for each metadata profile, parse its XSD and see if it has a searchable list in it
            metadataProfiles.forEach((metadataProfile) => {
                const xsd = metadataProfile.xsd ? metadataProfile.xsd : null; // try to get the xsd schema from the metadata profile
                if (xsd) {
                    const parser = new DOMParser();
                    const schema = parser.parseFromString(xsd, "text/xml");      // create an xml documents from the schema
                    const elements = schema.getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "element");    // get all element nodes

                    // for each xsd element with an ID attribute - search for a simpleType node of type listType - this means we have to add it to the filters if it is searchable
                    for (let i = 0; i < elements.length; i++) {
                        const currentNode = elements[i];
                        if (currentNode.getAttribute("id") !== null) {            // only elements with ID attribue can be used for filters
                            const simpleTypes = currentNode.getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "simpleType");
                            if (simpleTypes.length > 0) {
                                // check if this element is searchable
                                if (currentNode.getElementsByTagName("searchable").length && currentNode.getElementsByTagName("searchable")[0].textContent === "true") {
                                    // check if the simpleType type is "listType"
                                    if (simpleTypes[0].getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "restriction").length && simpleTypes[0].getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "restriction")[0].getAttribute("base") === "listType") {
                                        // get filter properties and add it to the metadata profile filters list
                                        const filterLabel = currentNode.getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "appinfo").length ? currentNode.getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema","appinfo")[0].getElementsByTagName("label")[0].textContent : "";
                                        const valueNodes = simpleTypes[0].getElementsByTagNameNS("http://www.w3.org/2001/XMLSchema", "enumeration");
                                        const values = [];
                                        for (let j = 0; j < valueNodes.length; j++) {
                                            values.push(valueNodes[j].getAttribute("value"));
                                        }
                                        const fieldName = currentNode.getAttribute("name");
                                        this.addMetadataProfileFilter(metadataProfile.name, filterLabel, fieldName, values);
                                    }
                                }
                            }
                        }
                    }
                }
            });
            this.rootLevel
        }catch(e){
            // TODO [kmc] handle error
            console.log("An error occured during the metadata profile filters creation process.");
        }
    }

    addMetadataProfileFilter(metadataProfileName, filterName, fieldName, values){
        // check if current filter group (accordion header) already exists. If not - create a new one
        let filterGroup: MetadataProfileFilterGroup = R.find(R.propEq('label', metadataProfileName))(this.metadataFilters);
        if (typeof filterGroup === "undefined"){
            filterGroup = {label: metadataProfileName, filters: []};
            this.metadataFilters.push(filterGroup);
        }
        // if the filter does not exist in the filters group yet - add it to the group
        if (typeof R.find(R.propEq('label', filterName))(filterGroup.filters) === "undefined") {
            let newFilter: AdditionalFilter = new AdditionalFilter(filterName, "", filterName);
            for (let i = 0; i < values.length; i++){
                newFilter.children.push(new AdditionalFilter(filterName, fieldName, values[i]));
            }
            filterGroup.filters.push(newFilter);
        }
    }

}

