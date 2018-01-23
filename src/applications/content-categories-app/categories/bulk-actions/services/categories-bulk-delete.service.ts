import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {KalturaClient} from 'kaltura-ngx-client';
import {CategoriesBulkActionBaseService} from "./categories-bulk-action-base.service";
import {KalturaCategory} from "kaltura-ngx-client/api/types/KalturaCategory";
import {CategoryDeleteAction} from "kaltura-ngx-client/api/types/CategoryDeleteAction";
import { CategoriesGraphUpdatedEvent } from 'app-shared/kmc-shared/app-events/categories-graph-updated/categories-graph-updated';
import { AppEventsService } from 'app-shared/kmc-shared';

@Injectable()
export class CategoriesBulkDeleteService extends CategoriesBulkActionBaseService<{}> {

  constructor(_kalturaServerClient: KalturaClient, private _appEvents: AppEventsService) {
    super(_kalturaServerClient);
  }

  public execute(selectedCategories: KalturaCategory[]) : Observable<{}>{
    return Observable.create(observer =>{

      const requests: CategoryDeleteAction[] = [];

      selectedCategories.forEach(category => {
        requests.push(new CategoryDeleteAction({
          id: category.id
        }));
      });

      this.transmit(requests, true).subscribe(
        result => {

            this._appEvents.publish(new CategoriesGraphUpdatedEvent());
          observer.next({});
          observer.complete();
        },
        error => {
          observer.error(error);
        }
      );
    });
  }
}
