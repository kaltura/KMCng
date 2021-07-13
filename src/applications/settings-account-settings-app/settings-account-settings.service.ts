import {Injectable} from '@angular/core';
import {KalturaClient} from 'kaltura-ngx-client';
import { KalturaMultiRequest, KalturaRequest, KalturaRequestBase } from 'kaltura-ngx-client';
import {KalturaUserRoleFilter} from 'kaltura-ngx-client';
import {KalturaUserRoleStatus} from 'kaltura-ngx-client';
import {KalturaUserFilter} from 'kaltura-ngx-client';
import {KalturaNullableBoolean} from 'kaltura-ngx-client';
import {KalturaUserStatus} from 'kaltura-ngx-client';
import {UserRoleListAction} from 'kaltura-ngx-client';
import {UserListAction} from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import {KalturaPartner} from 'kaltura-ngx-client';
import {PartnerGetInfoAction} from 'kaltura-ngx-client';
import {PartnerUpdateAction} from 'kaltura-ngx-client';
import {KalturaUserListResponse} from 'kaltura-ngx-client';
import { map } from 'rxjs/operators';

export interface AccountSettings {
  website: string;
  name: string;
  adminUserId: string;
  phone: string;
  describeYourself: string;
  referenceId: string;
}

@Injectable()
export class SettingsAccountSettingsService {

  constructor(private _kalturaServerClient: KalturaClient) {
  }

  /** update the data for current partner */
  public updatePartnerData(data: AccountSettings): Observable<KalturaPartner> {
    const partner = new KalturaPartner({
      website: data.website,
      name: data.name,
      adminUserId: data.adminUserId,
      phone: data.phone,
      describeYourself: data.describeYourself,
      referenceId: data.referenceId
    });
    return this._kalturaServerClient.request(new PartnerUpdateAction({
      partner
    }));
  }


  /** Get the account owners list for current partner */
  public getPartnerAccountSettings(): Observable<any> {

    const userRoleFilter: KalturaUserRoleFilter = new KalturaUserRoleFilter({
      tagsMultiLikeOr: 'partner_admin',
      statusEqual: KalturaUserRoleStatus.active
    });

    const userFilter: KalturaUserFilter = new KalturaUserFilter({
      isAdminEqual: KalturaNullableBoolean.trueValue,
      loginEnabledEqual: KalturaNullableBoolean.trueValue,
      statusEqual: KalturaUserStatus.active,
      roleIdsEqual: '0'
    })
      .setDependency(['roleIdsEqual', 0, 'objects:0:id']);


    const multiRequest = new KalturaMultiRequest(
      new UserRoleListAction({filter: userRoleFilter}),
      new UserListAction({filter: userFilter}),
      new PartnerGetInfoAction()
    );

    return this._kalturaServerClient.multiRequest(multiRequest)
      .pipe(map(
        data => {
          if (data.hasErrors()) {
            throw new Error('error occurred in action \'getPartnerAccountSettings\'');
          }

          let accountOwners: {name: string, id: string }[] = [];
          let partnerData: KalturaPartner;
          data.forEach(response => {
            if (response.result instanceof KalturaUserListResponse) {
                const usersList = response.result.objects;
                accountOwners = usersList
                  .filter(({ fullName }) => fullName && fullName !== '')
                  .map(user => ({ name: user.fullName, id: user.id }));
                if (!accountOwners.length) {
                    throw new Error('error occurred in action \'getPartnerAccountSettings\'');
                }
            } else if (response.result instanceof KalturaPartner) {
              partnerData = response.result;
            }
          });
          return {accountOwners, partnerData};
        }));
  }
}
