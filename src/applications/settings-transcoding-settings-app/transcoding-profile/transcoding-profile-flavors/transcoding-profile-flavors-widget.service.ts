import { Injectable, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy } from '@angular/core';
import { KalturaClient, KalturaMultiRequest } from 'kaltura-ngx-client';
import { Observable } from 'rxjs/Observable';
import { TranscodingProfileWidget } from '../transcoding-profile-widget';
import {
  ExtendedKalturaConversionProfileAssetParams,
  KalturaConversionProfileWithAsset
} from '../../transcoding-profiles/transcoding-profiles-store/base-transcoding-profiles-store.service';
import { TranscodingProfileWidgetKeys } from '../transcoding-profile-widget-keys';
import { FlavoursStore } from 'app-shared/kmc-shared';
import { KalturaConversionProfileType } from 'kaltura-ngx-client/api/types/KalturaConversionProfileType';
import { KalturaLiveParams } from 'kaltura-ngx-client/api/types/KalturaLiveParams';
import { KalturaFlavorParams } from 'kaltura-ngx-client/api/types/KalturaFlavorParams';
import { AppLocalization } from '@kaltura-ng/kaltura-common/localization/app-localization.service';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { ConversionProfileAssetParamsUpdateAction } from 'kaltura-ngx-client/api/types/ConversionProfileAssetParamsUpdateAction';

@Injectable()
export class TranscodingProfileFlavorsWidget extends TranscodingProfileWidget implements OnDestroy {
  private _flavorParamsIds: string[] = [];
  private _flavorParasIdsListDiffer: IterableDiffer<string>;
  public flavors: KalturaFlavorParams[] = [];
  public selectedFlavors: KalturaFlavorParams[] = [];

  constructor(private _kalturaClient: KalturaClient,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService,
              private _listDiffers: IterableDiffers,
              private _flavorsStore: FlavoursStore) {
    super(TranscodingProfileWidgetKeys.Flavors);
  }

  ngOnDestroy() {
  }

  protected onValidate(wasActivated: boolean): Observable<{ isValid: boolean }> {
    return Observable.of({ isValid: true });
  }

  protected onDataSaving(data: KalturaConversionProfileWithAsset, request: KalturaMultiRequest): void {
    if (this.wasActivated) {
      if (this._flavorParasIdsListDiffer) {
        const selectedFlavors = this.selectedFlavors.map(({ id }) => String(id));
        const changes = this._flavorParasIdsListDiffer.diff(selectedFlavors);
        if (changes) {
          changes.forEachAddedItem((record: IterableChangeRecord<string>) => {
              const relevantIndex = this._flavorParamsIds.indexOf(record.item);
              const itemExists = relevantIndex !== -1;
              if (!itemExists) {
                this._flavorParamsIds.push(record.item);
              }
          });

          changes.forEachRemovedItem((record: IterableChangeRecord<string>) => {
            const relevantIndex = this._flavorParamsIds.indexOf(record.item);
            const itemExists = relevantIndex !== -1;
            if (itemExists) {
              this._flavorParamsIds.splice(relevantIndex, 1);
            }
          });
        }

        data.flavorParamsIds = this._flavorParamsIds.join(',');

        const updateAssetParams = this._flavorParamsIds.length > 0;

        if (updateAssetParams) {
          this._flavorParamsIds
            .map(assetParamsId => (this.data.assets || []).find(asset => asset.assetParamsId === Number(assetParamsId)))
            .filter(assetParams => assetParams && assetParams.updated)
            .forEach(relevantAssetParams => {
              request.requests.push(
                new ConversionProfileAssetParamsUpdateAction({
                  conversionProfileId: 0,
                  assetParamsId: relevantAssetParams.assetParamsId,
                  conversionProfileAssetParams: relevantAssetParams
                }).setDependency(['conversionProfileId', 0, 'id']),
              );
            });
        }
      }
    }
  }

  /**
   * Do some cleanups if needed once the section is removed
   */
  protected onReset(): void {
    this.flavors = [];
    this.selectedFlavors = [];
    this._flavorParamsIds = [];
    this._flavorParasIdsListDiffer = null;
  }

  protected onActivate(): Observable<{ failed: boolean, error?: Error }> {
    super._showLoader();

    if (this.isNewData) {
      this._setDirty();
    }

    return this._flavorsStore.get()
      .cancelOnDestroy(this, this.widgetReset$)
      .map((response: { items: KalturaFlavorParams[] }) => {
        const items = response.items;
        const profileType: KalturaConversionProfileType = this.data.type;
        let flavors = [];
        if (profileType === KalturaConversionProfileType.liveStream) {
          flavors = items.filter(item => item instanceof KalturaLiveParams);
        } else if (profileType === KalturaConversionProfileType.media) {
          flavors = items.filter(item => !(item instanceof KalturaLiveParams));
        } else {
          flavors = [];
        }

        this.flavors = flavors.map(flavor => {
          const codec = !flavor.videoCodec || !flavor.videoCodec || flavor.videoCodec === 'copy'
            ? this._appLocalization.get('applications.settings.transcoding.flavors.na')
            : flavor.videoCodec;
          const bitrate = (flavor.tags && flavor.tags.indexOf('ingest')) !== -1 || !flavor.audioBitrate || !flavor.videoBitrate
            ? this._appLocalization.get('applications.settings.transcoding.flavors.na')
            : flavor.audioBitrate + flavor.videoBitrate;
          const width = !flavor.width
            ? this._appLocalization.get('applications.settings.transcoding.flavors.auto')
            : flavor.width;
          const height = !flavor.height
            ? this._appLocalization.get('applications.settings.transcoding.flavors.auto')
            : flavor.height;
          const dimensions = `${width}x${height}`;
          return Object.assign(flavor, { codec, bitrate, dimensions });
        });

        const flavorParamsIds = (this.data.flavorParamsIds || '').trim().split(',');
        this.selectedFlavors = this.flavors.filter(flavor => {
          return flavorParamsIds && flavorParamsIds.length && flavorParamsIds.indexOf(String(flavor.id)) !== -1;
        });

        this._flavorParamsIds = flavorParamsIds;
        this._flavorParasIdsListDiffer = this._listDiffers.find([]).create();
        this._flavorParasIdsListDiffer.diff(this._flavorParamsIds);

        super._hideLoader();
        return { failed: false };
      })
      .catch(error => {
        super._hideLoader();
        super._showActivationError(error.message);
        return Observable.of({ failed: true, error });
      });
  }

  private _setDirty(): void {
    this.updateState({ isDirty: true });
  }

  public updateFlavorAssetParams(assetParams: ExtendedKalturaConversionProfileAssetParams): void {
    if (!Array.isArray(this.data.assets)) {
      this.data.assets = [];
    }

    const relevantAssetParamsIndex = this.data.assets.findIndex(({ assetParamsId }) => assetParamsId === assetParams.assetParamsId);
    const assetParamsExists = relevantAssetParamsIndex !== -1;

    if (assetParamsExists) {
      this.data.assets.splice(relevantAssetParamsIndex, 1, assetParams);
    } else {
      this.data.assets.push(assetParams);
    }

    this._setDirty();
  }

  public updateSelectionState(): void {
    this._setDirty();
  }
}
