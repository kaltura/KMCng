import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DefaultFiltersList } from './default-filters-list';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { of } from 'rxjs';

export interface RefineListItem {
  value: string;
  label: string;
}

export class RefineList {
  public items: RefineListItem[] = [];

  constructor(public name: string, public label: string) {
  }
}

@Injectable()
export class ReachServicesRefineFiltersService {
  constructor(private _appLocalization: AppLocalization) {

  }

  public getFilters(): Observable<RefineList[]> {
    return of(this._buildDefaultFiltersGroup());
  }

  private _buildDefaultFiltersGroup(): RefineList[] {
    return DefaultFiltersList.map((list) => {
      const refineList = new RefineList(
        list.name,
        this._appLocalization.get(`applications.settings.reach.services.${list.label}`)
      );

      list.items.forEach((item: any) => {
        refineList.items.push({
          value: item.value,
          label: this._appLocalization.get(`applications.settings.reach.services.${item.label}`)
        });
      });

      return refineList;
    });
  }
}
