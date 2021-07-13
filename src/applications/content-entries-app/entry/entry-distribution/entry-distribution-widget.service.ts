import { Injectable, OnDestroy } from '@angular/core';
import { KalturaAPIException, KalturaClient, KalturaMultiRequest, KalturaObjectBaseFactory } from 'kaltura-ngx-client';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { EntryWidget } from '../entry-widget';
import { Observable } from 'rxjs';
import { DistributionProfileListAction } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { EntryDistributionListAction } from 'kaltura-ngx-client';
import { KalturaEntryDistributionFilter } from 'kaltura-ngx-client';
import { FlavorAssetGetFlavorAssetsWithParamsAction } from 'kaltura-ngx-client';
import { ThumbAssetGetByEntryIdAction } from 'kaltura-ngx-client';
import { KalturaDistributionProfileListResponse } from 'kaltura-ngx-client';
import { KalturaDistributionProfileStatus } from 'kaltura-ngx-client';
import { KalturaEntryDistributionListResponse } from 'kaltura-ngx-client';
import { KalturaEntryDistributionStatus } from 'kaltura-ngx-client';
import { KalturaFlavorAssetWithParams } from 'kaltura-ngx-client';
import { KalturaLiveParams } from 'kaltura-ngx-client';
import { Flavor } from '../entry-flavours/flavor';
import { KalturaFlavorAssetStatus } from 'kaltura-ngx-client';
import { KalturaWidevineFlavorAsset } from 'kaltura-ngx-client';
import { KalturaThumbAsset } from 'kaltura-ngx-client';
import { KalturaEntryDistribution } from 'kaltura-ngx-client';
import { KalturaDistributionProfile } from 'kaltura-ngx-client';
import { BehaviorSubject } from 'rxjs';
import { EntryDistributionSubmitDeleteAction } from 'kaltura-ngx-client';
import { EntryDistributionDeleteAction } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { KalturaRequest } from 'kaltura-ngx-client';
import { KalturaDistributionProfileActionStatus } from 'kaltura-ngx-client';
import { FlavorParamsGetAction } from 'kaltura-ngx-client';
import { EntryDistributionAddAction } from 'kaltura-ngx-client';
import { EntryDistributionSubmitAddAction } from 'kaltura-ngx-client';
import { EntryDistributionUpdateAction } from 'kaltura-ngx-client';
import { EntryDistributionSubmitUpdateAction } from 'kaltura-ngx-client';
import { EntryDistributionRetrySubmitAction } from 'kaltura-ngx-client';
import { KalturaDistributionProviderType } from 'kaltura-ngx-client';
import { ContentEntryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-entry-view.service';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface ExtendedKalturaEntryDistribution extends KalturaEntryDistribution {
  name: string;
  autoDistribution: boolean;
}

export interface DistributionWidgetData {
  distributedProfiles: ExtendedKalturaEntryDistribution[],
  undistributedProfiles: KalturaDistributionProfile[],
  partnerDistributionProfiles: KalturaDistributionProfile[],
  flavors: Flavor[];
  thumbnails: KalturaThumbAsset[];
}

@Injectable()
export class EntryDistributionWidget extends EntryWidget implements OnDestroy {
  private _partnerDistributionProfiles = new BehaviorSubject<{ items: KalturaDistributionProfile[] }>({ items: [] });
  private _distributedProfiles = new BehaviorSubject<{ items: KalturaEntryDistribution[] }>({ items: [] });
  private _undistributedProfiles = new BehaviorSubject<{ items: KalturaDistributionProfile[] }>({ items: [] });
  private _flavors = new BehaviorSubject<{ items: Flavor[] }>({ items: [] });
  private _thumbnails = new BehaviorSubject<{ items: KalturaThumbAsset[] }>({ items: [] });

  public popupMessage: AreaBlockerMessage;
  public flavors$ = this._flavors.asObservable();
  public thumbnails$ = this._thumbnails.asObservable();
  public distributionProfiles$ = {
    distributed: this._distributedProfiles.asObservable(),
    undistributed: this._undistributedProfiles.asObservable()
  };

  constructor(private _appLocalization: AppLocalization,
              private _kalturaClient: KalturaClient,
              private _browserService: BrowserService,
              logger: KalturaLogger) {
    super(ContentEntryViewSections.Distribution, logger);
  }

  ngOnDestroy() {

  }

  /**
   * Do some cleanups if needed once the section is removed
   */
  protected onReset() {
    this._flavors.next({ items: [] });
    this._thumbnails.next({ items: [] });
    this._distributedProfiles.next({ items: [] });
    this._partnerDistributionProfiles.next({ items: [] });
    this._undistributedProfiles.next({ items: [] });
  }

  protected onActivate(firstTimeActivating: boolean): Observable<{ failed: boolean, error?: Error }> {
    super._showLoader();

    return this._loadDistributionData()
      .pipe(tap((response: DistributionWidgetData) => {
        this._flavors.next({ items: response.flavors });
        this._thumbnails.next({ items: response.thumbnails });
        this._distributedProfiles.next({ items: response.distributedProfiles });
        this._undistributedProfiles.next({ items: response.undistributedProfiles });
        this._partnerDistributionProfiles.next({ items: response.partnerDistributionProfiles });

        super._hideLoader();
      }))
      .pipe(map(() => ({ failed: false })))
      .pipe(catchError(error => {
          super._hideLoader();
          super._showActivationError();
          return of({ failed: true, error });
        }
      ));
  }

  protected onDataSaving(data: KalturaMediaEntry, request: KalturaMultiRequest): void {

  }

  private _mapPartnerDistributionResponse(response: KalturaDistributionProfileListResponse): KalturaDistributionProfile[] {
    if (!response || !Array.isArray(response.objects)) {
      return [];
    }
    return response.objects.filter(profile => profile.status === KalturaDistributionProfileStatus.enabled);
  }

  private _mapEntryDistributionResponse(response: KalturaEntryDistributionListResponse): KalturaEntryDistribution[] {
    if (!response || !Array.isArray(response.objects)) {
      return [];
    }
    return response.objects.filter(profile => profile.status !== KalturaEntryDistributionStatus.deleted);
  }

  private _mapEntryFlavorsResponse(response: KalturaFlavorAssetWithParams[]): Flavor[] {
    let flavors = [];
    if (response && response.length) {
      const flavorsWithAssets = [];
      const flavorsWithoutAssets = [];
      response.forEach((flavor: KalturaFlavorAssetWithParams) => {
        if (flavor.flavorAsset && flavor.flavorAsset.isOriginal) {
          flavors.push(this._createFlavor(flavor, response)); // this is the source. put it first in the array
        } else if (flavor.flavorAsset && (!flavor.flavorAsset.status ||
            (flavor.flavorAsset.status && flavor.flavorAsset.status.toString() !== KalturaFlavorAssetStatus.temp.toString()))) {
          flavorsWithAssets.push(this._createFlavor(flavor, response)); // flavors with assets that is not in temp status
        } else if (!flavor.flavorAsset && flavor.flavorParams && !(flavor.flavorParams instanceof KalturaLiveParams)) {
          flavorsWithoutAssets.push(this._createFlavor(flavor, response)); // flavors without assets
        }
      });
      // source first, then flavors with assets, then flavors without assets
      flavors = flavors.concat(flavorsWithAssets).concat(flavorsWithoutAssets);
    }

    return flavors;
  }

  private _createFlavor(flavor: KalturaFlavorAssetWithParams, allFlavors: KalturaFlavorAssetWithParams[]): Flavor {
    const newFlavor = <Flavor>flavor;
    newFlavor.name = flavor.flavorParams ? flavor.flavorParams.name : '';
    newFlavor.id = flavor.flavorAsset ? flavor.flavorAsset.id : '';
    newFlavor.paramsId = flavor.flavorParams ? flavor.flavorParams.id : null;
    newFlavor.isSource = flavor.flavorAsset ? flavor.flavorAsset.isOriginal : false;
    newFlavor.isWidevine = flavor.flavorAsset ? flavor.flavorAsset instanceof KalturaWidevineFlavorAsset : false;
    newFlavor.isWeb = flavor.flavorAsset ? flavor.flavorAsset.isWeb : false;
    newFlavor.format = flavor.flavorAsset ? flavor.flavorAsset.fileExt : '';
    newFlavor.codec = flavor.flavorAsset ? flavor.flavorAsset.videoCodecId : '';
    newFlavor.bitrate = (flavor.flavorAsset && flavor.flavorAsset.bitrate && flavor.flavorAsset.bitrate > 0)
      ? flavor.flavorAsset.bitrate.toString()
      : '';
    newFlavor.size = flavor.flavorAsset ? (flavor.flavorAsset.status.toString() === KalturaFlavorAssetStatus.ready.toString()
      ? flavor.flavorAsset.size.toString() : '0')
      : '';
    newFlavor.status = flavor.flavorAsset ? flavor.flavorAsset.status.toString() : '';
    newFlavor.statusLabel = '';
    newFlavor.statusTooltip = '';
    newFlavor.tags = flavor.flavorAsset ? flavor.flavorAsset.tags : '-';
    newFlavor.drm = {};

    // set dimensions
    const width: number = flavor.flavorAsset ? flavor.flavorAsset.width : flavor.flavorParams.width;
    const height: number = flavor.flavorAsset ? flavor.flavorAsset.height : flavor.flavorParams.height;
    const w: string = width === 0 ? '[auto]' : width.toString();
    const h: string = height === 0 ? '[auto]' : height.toString();
    newFlavor.dimensions = w + ' x ' + h;

    // set status
    if (flavor.flavorAsset) {
      newFlavor.statusLabel = this._appLocalization.get(
        'applications.content.entryDetails.flavours.status.' + KalturaFlavorAssetStatus[flavor.flavorAsset.status]
      );
      if (flavor.flavorAsset.status.toString() === KalturaFlavorAssetStatus.notApplicable.toString()) {
        newFlavor.statusTooltip = this._appLocalization.get('applications.content.entryDetails.flavours.status.naTooltip');
      }
    }

    // add DRM details
    if (newFlavor.isWidevine) {
      // get source flavors for DRM
      const sourceIDs = (flavor.flavorAsset as KalturaWidevineFlavorAsset).actualSourceAssetParamsIds
        ? (flavor.flavorAsset as KalturaWidevineFlavorAsset).actualSourceAssetParamsIds.split(',')
        : [];
      const sources = [];
      sourceIDs.forEach(sourceId => {
        allFlavors.forEach(flavorItem => {
          if (flavorItem.flavorParams.id.toString() === sourceId) {
            sources.push(flavorItem.flavorParams.name);
          }
        });
      });
      // set start and end date
      let startDate = (flavor.flavorAsset as KalturaWidevineFlavorAsset).widevineDistributionStartDate;
      if (startDate === -2147483648 || startDate === 18001 || startDate === 2000001600) {
        startDate = null;
      }
      let endDate = (flavor.flavorAsset as KalturaWidevineFlavorAsset).widevineDistributionEndDate;
      if (endDate === -2147483648 || endDate === 18001 || endDate === 2000001600) {
        endDate = null;
      }
      newFlavor.drm = {
        name: flavor.flavorParams.name,
        id: (flavor.flavorAsset as KalturaWidevineFlavorAsset).widevineAssetId,
        flavorSources: sources,
        startTime: startDate,
        endTime: endDate
      };
    }
    return newFlavor;
  }

  private _mapThumbnailsResponse(response: KalturaThumbAsset[]): KalturaThumbAsset[] {
    if (response && response.length) {
      return response;
    }
    return [];
  }

  private _loadDistributionData(): Observable<DistributionWidgetData> {
    const partnerDistributionListAction = new DistributionProfileListAction({
      pager: new KalturaFilterPager({ pageSize: 500 })
    });

    const entryDistributionListAction = new EntryDistributionListAction({
      filter: new KalturaEntryDistributionFilter({ entryIdEqual: this.data.id })
    });

    const entryFlavorsListAction = new FlavorAssetGetFlavorAssetsWithParamsAction({ entryId: this.data.id });

    const entryThumbnailsListAction = new ThumbAssetGetByEntryIdAction({ entryId: this.data.id });

    return this._kalturaClient
      .multiRequest(new KalturaMultiRequest(
        partnerDistributionListAction,
        entryDistributionListAction,
        entryFlavorsListAction,
        entryThumbnailsListAction
      ))
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .pipe(map(response => {
        if (response.hasErrors()) {
          response.forEach(item => {
            if (item.error) {
              throw Error(item.error.message);
            }
          });
        }

        const [partnerDistribution, entryDistribution, entryFlavors, entryThumbnails] = response;
        const flavors = this._mapEntryFlavorsResponse(entryFlavors.result);
        const thumbnails = this._mapThumbnailsResponse(entryThumbnails.result);
        const partnerDistributionProfiles = this._mapPartnerDistributionResponse(partnerDistribution.result);
        const undistributedProfiles = [...partnerDistributionProfiles];
        const entryProfiles = this._mapEntryDistributionResponse(entryDistribution.result);
        const distributedProfiles = [];

        entryProfiles.forEach((profile) => {
          const relevantPartnerProfile = undistributedProfiles.find(({ id }) => id === profile.distributionProfileId);
          if (relevantPartnerProfile) {
            const autoDistribution = relevantPartnerProfile.submitEnabled === KalturaDistributionProfileActionStatus.automatic ||
              profile.status === KalturaEntryDistributionStatus.queued;
            const distributedProfile = <ExtendedKalturaEntryDistribution>Object.assign(
              KalturaObjectBaseFactory.createObject(profile),
              profile,
              {
                autoDistribution,
                name: relevantPartnerProfile.name
              }
            );
            distributedProfiles.push(distributedProfile);
            undistributedProfiles.splice(undistributedProfiles.indexOf(relevantPartnerProfile), 1);
          }
        });

        return {
          flavors,
          thumbnails,
          distributedProfiles,
          undistributedProfiles,
          partnerDistributionProfiles
        };
      }));
  }

  private _performDeleteRequest(action: KalturaRequest<KalturaEntryDistribution | void>, closePopupCallback?: () => void): void {
    this._kalturaClient.request(action)
      .pipe(tag('block-shell'))
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .subscribe(
        () => {
          if (typeof closePopupCallback === 'function') {
            closePopupCallback();
          }
          this.refresh();
          this._browserService.scrollToTop();
        },
        error => {
          this._showBlockerMessage(new AreaBlockerMessage({
            message: error.message || this._appLocalization.get('applications.content.entryDetails.distribution.errors.cannotDelete'),
            buttons: [
              {
                label: this._appLocalization.get('app.common.ok'),
                action: () => {
                  if (typeof closePopupCallback === 'function') {
                    closePopupCallback();
                  }
                  this.refresh();
                  this._browserService.scrollToTop();
                }
              }
            ]
          }), false);
        }
      );
  }

  public setDirty(): void {
    super.updateState({ isDirty: true });
  }

  public getProviderName(type: KalturaDistributionProviderType): string {
    switch (true) {
      case type === KalturaDistributionProviderType.attUverse:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.attUverse');

      case type === KalturaDistributionProviderType.avn:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.avn');

      case type === KalturaDistributionProviderType.comcastMrss:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.comcastMrss');

      case type === KalturaDistributionProviderType.crossKaltura:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.crossKaltura');

      case type === KalturaDistributionProviderType.dailymotion:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.dailymotion');

      case type === KalturaDistributionProviderType.doubleclick:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.doubleclick');

      case type === KalturaDistributionProviderType.facebook:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.facebook');

      case type === KalturaDistributionProviderType.freewheel:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.freewheel');

      case type === KalturaDistributionProviderType.freewheelGeneric:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.freewheelGeneric');

      case type === KalturaDistributionProviderType.ftp:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.ftp');

      case type === KalturaDistributionProviderType.ftpScheduled:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.ftpScheduled');

      case type === KalturaDistributionProviderType.generic:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.generic');

      case type === KalturaDistributionProviderType.hulu:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.hulu');

      case type === KalturaDistributionProviderType.idetic:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.idetic');

      case type === KalturaDistributionProviderType.metroPcs:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.metroPcs');

      case type === KalturaDistributionProviderType.msn:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.msn');

      case type === KalturaDistributionProviderType.ndn:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.ndn');

      case type === KalturaDistributionProviderType.podcast:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.podcast');

      case type === KalturaDistributionProviderType.pushToNews:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.pushToNews');

      case type === KalturaDistributionProviderType.quickplay:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.quickplay');

      case type === KalturaDistributionProviderType.synacorHbo:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.synacorHbo');

      case type === KalturaDistributionProviderType.syndication:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.syndication');

      case type === KalturaDistributionProviderType.timeWarner:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.timeWarner');

      case type === KalturaDistributionProviderType.tvcom:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.tvcom');

      case type === KalturaDistributionProviderType.tvinci:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.tvinci');

      case type === KalturaDistributionProviderType.unicorn:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.unicorn');

      case type === KalturaDistributionProviderType.uverse:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.uverse');

      case type === KalturaDistributionProviderType.uverseClickToOrder:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.uverseClickToOrder');

      case type === KalturaDistributionProviderType.verizonVcast:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.verizonVcast');

      case type === KalturaDistributionProviderType.yahoo:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.yahoo');

      case type === KalturaDistributionProviderType.youtube:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.youtube');

      case type === KalturaDistributionProviderType.youtubeApi:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.youtubeApi');

      default:
        return this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.unknown');

    }
  }

  public deleteDistributionProfile(profile: ExtendedKalturaEntryDistribution, closePopupCallback?: () => void): void {
    const entrySubmitted = [
      KalturaEntryDistributionStatus.ready,
      KalturaEntryDistributionStatus.errorUpdating
    ].indexOf(profile.status) !== -1;
    const entryNotSubmitted = [
      KalturaEntryDistributionStatus.queued,
      KalturaEntryDistributionStatus.pending,
      KalturaEntryDistributionStatus.errorSubmitting
    ].indexOf(profile.status) !== -1;
    let action;

    if (entrySubmitted) {
      action = new EntryDistributionSubmitDeleteAction({ id: profile.id });
    } else if (entryNotSubmitted) {
      action = new EntryDistributionDeleteAction({ id: profile.id });
    }

    if (!action) {
      this._browserService.alert({
        message: this._appLocalization.get('applications.content.entryDetails.distribution.errors.cannotDelete'),
      });
      return;
    }

    const partnerProfile = this.getPartnerProfileById(profile.distributionProfileId);
    const connectorName = partnerProfile
      ? this.getProviderName(partnerProfile.providerType)
      : this._appLocalization.get('applications.content.entryDetails.distribution.providerTypes.unknown');

    this._browserService.confirm({
        header: this._appLocalization.get('applications.content.entryDetails.distribution.deleteConfirmTitle'),
        message: this._appLocalization.get('applications.content.entryDetails.distribution.deleteConfirm', [connectorName]),
        acceptLabel: this._appLocalization.get('applications.content.entryDetails.distribution.delete'),
        rejectLabel: this._appLocalization.get('applications.content.entryDetails.distribution.cancel'),
        accept: () => {
            this._performDeleteRequest(action, closePopupCallback);
        }
    });
  }

  public loadMissingFlavors(flavors: Partial<Flavor>[]): Observable<{ id: string, name: string }[]> {
    const actions = flavors.map(({ id }) => new FlavorParamsGetAction({ id: Number(id) }));
    return this._kalturaClient.multiRequest(new KalturaMultiRequest(...actions))
      .pipe(map(responses => {
        return responses.map(response => {
          const result = response.result;
          if (response.error || !result) {
            throw Error(response.error
              ? response.error.message
              : this._appLocalization.get('applications.content.entryDetails.distribution.errors.serverError')
            );
          }

          return { id: String(result.id), name: result.name };
        });
      }));
  }

  public distributeProfile(payload: { entryId: string, profileId: number, submitWhenReady: boolean }, closePopupCallback: () => void): void {
    const newEntryDistribution = new KalturaEntryDistribution({
      entryId: payload.entryId,
      distributionProfileId: payload.profileId
    });

    const actions: KalturaRequest<KalturaEntryDistribution>[] = [
      new EntryDistributionAddAction({ entryDistribution: newEntryDistribution })
    ];

    if (payload.submitWhenReady) {
      actions.push(
        new EntryDistributionSubmitAddAction({ id: 0, submitWhenReady: payload.submitWhenReady })
          .setDependency(['id', 0, 'id'])
      );
    }

    this._kalturaClient.multiRequest(new KalturaMultiRequest(...actions))
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .pipe(tag('block-shell'))
      .pipe(map(responses => {
        responses.forEach(response => {
          if (response.error instanceof KalturaAPIException) {
            throw Error(response.error.message);
          }
        });
      }))
      .subscribe(
        () => {
          this.refresh();
          this.popupMessage = null;
          closePopupCallback();
        },
        error => {
          this.popupMessage = new AreaBlockerMessage({
            message: error.message || this._appLocalization.get('applications.content.entryDetails.distribution.errors.cannotDistribute'),
            buttons: [{
              label: this._appLocalization.get('app.common.ok'),
              action: () => {
                this.refresh();
                this.popupMessage = null;
                closePopupCallback();
              }
            }]
          });
        });

  }

  public updateProfile(profile: ExtendedKalturaEntryDistribution, closePopupCallback: () => void): void {

    this._kalturaClient.request(new EntryDistributionUpdateAction({
      id: profile.id,
      entryDistribution: profile
    }))
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .pipe(tag('block-shell'))
      .subscribe(
        () => {
          this.refresh();
          closePopupCallback();
        },
        error => {
          this.popupMessage = new AreaBlockerMessage({
            message: error.message || this._appLocalization.get('applications.content.entryDetails.distribution.errors.updateFailed'),
            buttons: [
              {
                label: this._appLocalization.get('app.common.ok'),
                action: () => {
                  this.refresh();
                  this.popupMessage = null;
                  closePopupCallback();
                }
              }
            ]
          });
        });
  }

  public submitProfileUpdate(profileId: number): void {
    this._kalturaClient.request(new EntryDistributionSubmitUpdateAction({ id: profileId }))
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .pipe(tag('block-shell'))
      .subscribe(
        () => {
          this.refresh();
          this.popupMessage = null;
          this._removeBlockerMessage();
        },
        error => {
          this.popupMessage = new AreaBlockerMessage({
            message: error.message || this._appLocalization.get('applications.content.entryDetails.distribution.errors.updateFailed'),
            buttons: [{
              label: this._appLocalization.get('app.common.ok'),
              action: () => {
                this.popupMessage = null;
                this._removeBlockerMessage();
                this.refresh();
              }
            }]
          });
          this._showBlockerMessage(this.popupMessage, false);
        });
  }

  public submitDistribution(profileId: number): void {
    this._kalturaClient.request(new EntryDistributionSubmitAddAction({ id: profileId }))
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .pipe(tag('block-shell'))
      .subscribe(
        () => {
          this.refresh();
          this.popupMessage = null;
          this._removeBlockerMessage();
        },
        error => {
          this.popupMessage = new AreaBlockerMessage({
            message: error.message || this._appLocalization.get('applications.content.entryDetails.distribution.errors.updateFailed'),
            buttons: [{
              label: this._appLocalization.get('app.common.ok'),
              action: () => {
                this.popupMessage = null;
                this._removeBlockerMessage();
                this.refresh();
              }
            }]
          });
          this._showBlockerMessage(this.popupMessage, false);
        });
  }

  public retryDistribution(profileId: number): void {
    this._kalturaClient.request(new EntryDistributionRetrySubmitAction({ id: profileId }))
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .pipe(tag('block-shell'))
      .subscribe(
        () => {
          this.refresh();
          this.popupMessage = null;
          this._removeBlockerMessage();
        },
        error => {
          this.popupMessage = new AreaBlockerMessage({
            message: error.message || this._appLocalization.get('applications.content.entryDetails.distribution.errors.retryFailed'),
            buttons: [{
              label: this._appLocalization.get('app.common.ok'),
              action: () => {
                this.popupMessage = null;
                this._removeBlockerMessage();
                this.refresh();
              }
            }]
          });
          this._showBlockerMessage(this.popupMessage, false);
        });
  }

  public getPartnerProfileById(profileId): KalturaDistributionProfile {
    const partnerProfiles = this._partnerDistributionProfiles.getValue().items;

    if (partnerProfiles) {
      return partnerProfiles.find(({ id }) => id === profileId) || null;
    }

    return null;
  }

  public refresh(): void {
    super._showLoader();

    this._flavors.next({ items: [] });
    this._thumbnails.next({ items: [] });
    this._distributedProfiles.next({ items: [] });
    this._undistributedProfiles.next({ items: [] });

    this._loadDistributionData()
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .subscribe(
        (response) => {
          this._flavors.next({ items: response.flavors });
          this._thumbnails.next({ items: response.thumbnails });
          this._distributedProfiles.next({ items: response.distributedProfiles });
          this._undistributedProfiles.next({ items: response.undistributedProfiles });

          super._hideLoader();
        },
        error => {
          super._hideLoader();
          super._showBlockerMessage(new AreaBlockerMessage({
            message: error.message || this._appLocalization.get('applications.content.entryDetails.distribution.errors.errorLoading'),
            buttons: [{
              label: this._appLocalization.get('app.common.ok'),
              action: () => this.refresh()
            }]
          }), true);
        });
  }
}
