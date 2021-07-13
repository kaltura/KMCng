import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { KalturaClient } from 'kaltura-ngx-client';
import { AppLocalization } from '@kaltura-ng/mc-shared';

import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { KalturaCategoryEntry } from 'kaltura-ngx-client';
import { BulkActionBaseService } from './bulk-action-base.service';
import { CategoryEntryListAction } from 'kaltura-ngx-client';

import { KalturaCategoryEntryFilter } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { CategoryEntryDeleteAction } from 'kaltura-ngx-client';
import { CategoriesSearchService, CategoryData } from 'app-shared/content-shared/categories/categories-search.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { throwError } from 'rxjs';
import { of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Injectable()
export class BulkRemoveCategoriesService extends BulkActionBaseService<number[]> implements OnDestroy {

    constructor(public _kalturaServerClient: KalturaClient,
                private _categoriesSearch: CategoriesSearchService,
                private _appLocalization: AppLocalization) {
        super(_kalturaServerClient);
    }

    private _getCategoryEntryMapping(entries: string[]): Observable<KalturaCategoryEntry[]> {

        if (entries.length === 0) {
            return throwError(new Error('no entries were selected'));
        }
        // load all category entries
        const filter: KalturaCategoryEntryFilter = new KalturaCategoryEntryFilter(
            {
                entryIdIn: entries.join(',')
            }
        );

        const pager: KalturaFilterPager = new KalturaFilterPager();
        pager.pageIndex = 1;
        pager.pageSize = 1000;

        return this._kalturaServerClient.request(new CategoryEntryListAction({
            filter: filter,
            pager: pager
        }))
            .pipe(map(item => item.objects));
    }

    public getCategoriesOfEntries(entries: string[]): Observable<CategoryData[]> {
        return this._getCategoryEntryMapping(entries)
            .pipe(cancelOnDestroy(this))
            .pipe(switchMap(items => {
                // got all entry categories - load category details for each entry category
                if (items && items.length) {
                    const categoriesIds = Object.keys(items.reduce((acc, category) => {
                        acc[category.categoryId] = true; // remove duplications using hash map
                        return acc;
                    }, {})).map(Number);

                    return this._categoriesSearch.getCategories(categoriesIds)
                        .pipe(cancelOnDestroy(this))
                        .pipe(map(categoryListResponse => categoryListResponse.items))
                } else {
                    return of([]);
                }
            }))
    }

    public execute(entries: KalturaMediaEntry[], categoriesId: number[]): Observable<{}> {
        return Observable.create(observer => {

            const entriesId = entries ? entries.map(entry => entry.id) : [];

            if (entriesId.length && categoriesId && categoriesId.length) {
                this._getCategoryEntryMapping(entriesId)
                    .pipe(cancelOnDestroy(this))
                    .subscribe(
                        categoriesOfEntries => {

                            if (categoriesOfEntries.length) {
                                const requests: CategoryEntryDeleteAction[] = [];

                                // send only categories that are set to each entry
                                entriesId.forEach(entryId => {
                                    categoriesId.forEach(categoryId => {
                                        if (this.categoryEntryExists(entryId, categoryId, categoriesOfEntries)) {
                                            requests.push(new CategoryEntryDeleteAction({
                                                entryId: entryId,
                                                categoryId: categoryId
                                            }));
                                        }
                                    });
                                });

                                this.transmit(requests, true).subscribe(
                                    result => {
                                        observer.next({})
                                        observer.complete();
                                    },
                                    error => {
                                        observer.error(error);
                                    }
                                );
                            } else {
                                observer.error(new Error('no categories found to be removed'));
                            }
                        },
                        error => {
                            observer.error(error);
                        }
                    );

            } else {
                observer.error(new Error('no categories or entries were selected'));
            }
        });
    }

    private categoryEntryExists(entryId: string, categoryId: number, entryCategories: KalturaCategoryEntry[]): boolean {
        let found = false;
        for (let i = 0; i < entryCategories.length; i++) {
            if (entryCategories[i].categoryId === categoryId && entryCategories[i].entryId === entryId) {
                found = true;
                break;
            }
        }
        return found;
    }

    ngOnDestroy() {
    }
}
