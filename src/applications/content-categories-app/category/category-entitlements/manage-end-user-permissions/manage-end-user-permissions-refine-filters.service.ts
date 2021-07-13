import {Injectable} from '@angular/core';
import {DefaultFiltersList} from './default-filters-list';
import { Observable } from 'rxjs';
import { of } from 'rxjs';

export interface RefineListItem {
    value: string,
    label: string
}

export class RefineList {
    public items: RefineListItem[] = [];

    constructor(public name: string, public label: string) {
    }
}

@Injectable()
export class ManageEndUserPermissionsRefineFiltersService {

  constructor() {
  }

    public getFilters(): Observable<RefineList[]> {
        return of(this._buildDefaultFiltersGroup());
    }

    private _buildDefaultFiltersGroup(): RefineList[] {
        return DefaultFiltersList.map((list) => {
            const refineList = new RefineList(
                list.name,
                list.label
            );

            list.items.forEach((item: any) => {
                refineList.items.push({value: item.value, label: item.label});
            });

            return refineList;
        });
    }
}
