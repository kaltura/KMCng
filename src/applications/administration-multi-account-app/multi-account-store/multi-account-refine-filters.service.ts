import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DefaultFiltersList } from './default-filters-list';
import { AppLocalization } from '@kaltura-ng/mc-shared';
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
export class MultiAccountRefineFiltersService {
  constructor(private _appLocalization: AppLocalization) {
  }

  public getFilters(): Observable<RefineList[]> {
    return of(this._buildDefaultFiltersGroup());
  }

  private _buildDefaultFiltersGroup(): RefineList[] {
    return DefaultFiltersList.map((list) => {
      const refineList = new RefineList(
        list.name,
        this._appLocalization.get(`applications.administration.accounts.statusLabels.${list.label}`)
      );

      refineList.items = list.items.map((item: any) => ({
        value: item.value,
        label: this._appLocalization.get(`applications.administration.accounts.statusLabels.${item.label}`)
      }));

      return refineList;
    });
  }
}
