import { KalturaBulkUploadObjectType } from 'kaltura-ngx-client';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client';
import { KalturaResponseProfileType } from 'kaltura-ngx-client';
import { KalturaBulkUploadFilter } from 'kaltura-ngx-client';
import { BulkListAction } from 'kaltura-ngx-client';
import { RequestFactory } from '@kaltura-ng/kaltura-common';
import { KalturaBulkUploadListResponse } from 'kaltura-ngx-client';

export class BulkUploadRequestFactory implements RequestFactory<BulkListAction, KalturaBulkUploadListResponse> {

  public uploadedOn: Date;

  constructor() {
  }

  create(): BulkListAction {
    const bulkUploadObjectTypeIn = [
      KalturaBulkUploadObjectType.entry,
      KalturaBulkUploadObjectType.category,
      KalturaBulkUploadObjectType.user,
      KalturaBulkUploadObjectType.categoryUser
    ];

    if (this.uploadedOn === null) {
      return null;
    } else {
      return new BulkListAction({
        bulkUploadFilter: new KalturaBulkUploadFilter({
          bulkUploadObjectTypeIn: bulkUploadObjectTypeIn.join(','),
          uploadedOnGreaterThanOrEqual: this.uploadedOn
        })
      }).setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
              type: KalturaResponseProfileType.includeFields,
              fields: 'id,status,uploadedOn'
          })
      });
    }
  }
}
