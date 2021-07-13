import { Injectable } from '@angular/core';
import { KalturaClient } from 'kaltura-ngx-client';
import { BulkUploadAddAction } from 'kaltura-ngx-client';
import { KalturaBulkUploadType } from 'kaltura-ngx-client';
import { KalturaBulkUploadCsvJobData } from 'kaltura-ngx-client';
import { CategoryAddFromBulkUploadAction } from 'kaltura-ngx-client';
import { KalturaBulkUploadCategoryData } from 'kaltura-ngx-client';
import { KalturaBulkUploadUserData } from 'kaltura-ngx-client';
import { KalturaBulkUploadCategoryUserData } from 'kaltura-ngx-client';
import { UserAddFromBulkUploadAction } from 'kaltura-ngx-client';
import { CategoryUserAddFromBulkUploadAction } from 'kaltura-ngx-client';
import { Observable, from } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { KalturaBulkUpload } from 'kaltura-ngx-client';

export enum BulkUploadTypes {
  entries,
  categories,
  endUsers,
  endUsersEntitlement
}

@Injectable()
export class BulkUploadService {
  constructor(private _kalturaServerClient: KalturaClient) {
  }

  private _getKalturaBulkUploadType(file: File): KalturaBulkUploadType {
    const extension = /(?:\.([^.]+))?$/.exec(file.name)[1];
    return 'csv' === extension ? KalturaBulkUploadType.csv : KalturaBulkUploadType.xml;
  }

  private _getKalturaActionByType(fileData: File, type: BulkUploadTypes): BulkUploadAddAction
    | CategoryAddFromBulkUploadAction
    | UserAddFromBulkUploadAction
    | CategoryUserAddFromBulkUploadAction {

    const bulkUploadData = new KalturaBulkUploadCsvJobData();
    bulkUploadData.fileName = fileData.name;

    switch (type) {
      case BulkUploadTypes.entries:
        return new BulkUploadAddAction({
          conversionProfileId: -1,
          csvFileData: fileData,
          bulkUploadType: this._getKalturaBulkUploadType(fileData)
        });
      case BulkUploadTypes.categories:
        return new CategoryAddFromBulkUploadAction({
          fileData,
          bulkUploadData,
          bulkUploadCategoryData: new KalturaBulkUploadCategoryData()
        });
      case BulkUploadTypes.endUsers:
        return new UserAddFromBulkUploadAction({
          fileData,
          bulkUploadData,
          bulkUploadUserData: new KalturaBulkUploadUserData()
        });
      case BulkUploadTypes.endUsersEntitlement:
        return new CategoryUserAddFromBulkUploadAction({
          fileData,
          bulkUploadData,
          bulkUploadCategoryUserData: new KalturaBulkUploadCategoryUserData()
        });
      default:
        return null;
    }
  }

  private _getAction(files: File[], type: BulkUploadTypes): (BulkUploadAddAction
    | CategoryAddFromBulkUploadAction
    | UserAddFromBulkUploadAction
    | CategoryUserAddFromBulkUploadAction)[] {
    return files
      .map(file => this._getKalturaActionByType(file, type))
      .filter(Boolean);
  }

  public upload(files: FileList, type: BulkUploadTypes): Observable<KalturaBulkUpload> {
    const actions = this._getAction(Array.from(files), type);

    return from(actions)
      .pipe(flatMap(action => this._kalturaServerClient.request(action)));
  }
}
