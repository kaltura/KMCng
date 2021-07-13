import {Injectable} from '@angular/core';
import {KalturaClient, KalturaMultiRequest} from 'kaltura-ngx-client';
import {UserListAction} from 'kaltura-ngx-client';
import {KalturaUserFilter} from 'kaltura-ngx-client';
import {KalturaFilterPager} from 'kaltura-ngx-client';
import {KalturaCategoryUserPermissionLevel} from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import {KalturaUpdateMethodType} from 'kaltura-ngx-client';
import {CategoryUserAddAction} from 'kaltura-ngx-client';
import {KalturaCategoryUser} from 'kaltura-ngx-client';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {CategoryUserCopyFromCategoryAction} from 'kaltura-ngx-client';
import { delay, map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class AddUsersService {

  constructor(private _kalturaServerClient: KalturaClient,
              private _appLocalization: AppLocalization) {
  }


  public addUsers({usersIds, categoryId, permissionLevel, updateMethod}: { usersIds: string[], categoryId: number, permissionLevel: KalturaCategoryUserPermissionLevel, updateMethod: KalturaUpdateMethodType}): Observable<void> {
    if (!usersIds || !usersIds.length) {
      return throwError(
        new Error(this._appLocalization
          .get('applications.content.categoryDetails.entitlements.usersPermissions.addUsers.errors.missingUsers')));
    }

    const multiRequest = new KalturaMultiRequest();
    usersIds.forEach(userId => {
      const categoryUser = new KalturaCategoryUser({
        categoryId,
        userId,
        permissionLevel,
        updateMethod
      });
      multiRequest.requests.push(new CategoryUserAddAction({categoryUser}));
    });

    return this._kalturaServerClient.multiRequest(multiRequest)
      .pipe(map(response => {
          if (response.hasErrors()) {
            const errorMessage = (response.find(r => (r.error && r.error.code !== 'CATEGORY_USER_ALREADY_EXISTS'))) ?
                'applications.content.categoryDetails.entitlements.usersPermissions.addUsers.errors.addUsersFailed':
                'applications.content.categoryDetails.entitlements.usersPermissions.addUsers.errors.duplicateUsers';
            throw new Error(this._appLocalization.get(errorMessage));
          }
          return undefined;
        }
      ))
      .pipe(catchError(err => throwError(err)));
  }



  public copyUsersFromParent({categoryId}: {categoryId: number}): Observable<void> {
    return this._kalturaServerClient.request(
      new CategoryUserCopyFromCategoryAction({categoryId})
    ).pipe(delay(6000)); // we delay the response for the server to be able to index the new users
  }


  public getUsersSuggestions(query: string) {
    return this._kalturaServerClient.request(
      new UserListAction(
        {
          filter: new KalturaUserFilter({
            idOrScreenNameStartsWith: query
          }),
          pager: new KalturaFilterPager({
            pageIndex: 0,
            pageSize: 30
          })
        }
      )
    );
  }
}
