import { Component, ElementRef, AfterViewInit,OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Menu, MenuItem } from 'primeng/primeng';
import { ISubscription } from 'rxjs/Subscription';

import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { AppAuthentication } from 'app-shared/kmc-shell';
import { BrowserService } from 'app-shared/kmc-shell';
import { KalturaCaptionAssetStatus } from 'kaltura-ngx-client/api/types/KalturaCaptionAssetStatus'
import { PopupWidgetComponent, PopupWidgetStates } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';

import { EntryCaptionsWidget } from './entry-captions-widget.service';

import { getKalturaServerUri, serverConfig } from 'config/server';
import { KMCPermissions } from 'app-shared/kmc-shared/kmc-permissions';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';


@Component({
    selector: 'kEntryCaptions',
    templateUrl: './entry-captions.component.html',
    styleUrls: ['./entry-captions.component.scss'],
    providers: [KalturaLogger.createLogger('EntryCaptions')]
})
export class EntryCaptions implements AfterViewInit, OnInit, OnDestroy {
  public _kmcPermissions = KMCPermissions;

    public _loadingError = null;
	public _actions: MenuItem[] = [];

	@ViewChild('actionsmenu') private actionsMenu: Menu;
	@ViewChild('editPopup') public editPopup: PopupWidgetComponent;


	private _popupStateChangeSubscribe: ISubscription;
    constructor(public _widgetService: EntryCaptionsWidget,
                private _appAuthentication: AppAuthentication,
                private _appLocalization: AppLocalization,
                private _logger: KalturaLogger,
                private _browserService: BrowserService) {
    }

	ngOnInit() {
        this._widgetService.attachForm();

		this._actions = [
			{label: this._appLocalization.get('applications.content.entryDetails.captions.edit'), command: (event) => {this.actionSelected("edit");}},
			{label: this._appLocalization.get('applications.content.entryDetails.captions.download'), command: (event) => {this.actionSelected("download");}},
			{label: this._appLocalization.get('applications.content.entryDetails.captions.preview'), command: (event) => {this.actionSelected("preview");}},
			{label: this._appLocalization.get('applications.content.entryDetails.captions.delete'), styleClass: 'kDanger', command: (event) => {this.actionSelected("delete");}}
		];
	}

	openActionsMenu(event: any, caption: any): void{
		if (this.actionsMenu){
			// save the selected caption for usage in the actions menu
			this._widgetService.currentCaption = caption;
			//disable actions for captions that are not in "ready" state
			this._actions[0].disabled = (caption.status !== KalturaCaptionAssetStatus.ready);
			this._actions[1].disabled = (caption.status !== KalturaCaptionAssetStatus.ready);
			this._actions[3].disabled = (caption.status !== KalturaCaptionAssetStatus.ready);

			this.actionsMenu.toggle(event);
		}
	}

	ngAfterViewInit(){
		if (this.editPopup) {
			this._popupStateChangeSubscribe = this.editPopup.state$
				.subscribe(event => {
					if (event.state === PopupWidgetStates.Close) {
						if (event.context && event.context.newCaptionFile){
							this._widgetService.upload(event.context.newCaptionFile);
						}
						if (event.context && event.context.newCaptionUrl){
							this._widgetService.currentCaption.uploadUrl = event.context.newCaptionUrl;
						}
						if (event.context){
							this._widgetService.setDirty();
						}
						this._widgetService.removeEmptyCaptions(); // cleanup of captions that don't have assets (url or uploaded file)
					}
				});
		}
	}

	public _addCaption(){
        this._logger.info(`handle add caption action by user`);
		this._widgetService._addCaption();
		setTimeout( () => {this.editPopup.open(); }, 0); // use a timeout to allow data binding of the new caption to update before opening the popup widget
	}

	private actionSelected(action: string): void{
		switch (action){
			case "edit":
			    this._logger.info(`handle edit cation action by user`, { caption: this._widgetService.currentCaption });
				this.editPopup.open();
				break;
			case "delete":
			    this._logger.info(`handle delete caption action by user`, { caption: this._widgetService.currentCaption });
				this._widgetService.removeCaption();
				break;
			case "download":
			    this._logger.info(`handle download file action by user`, { caption: this._widgetService.currentCaption });
				this._downloadFile();
				break;
			case "preview":
				this._widgetService.getCaptionPreviewUrl()
					.subscribe(({ url }) =>
					{
                        this._logger.info(`handle preview caption by user`, { url });
                        this._browserService.openLink(url);
					})

				break;
		}
	}

	private _downloadFile(): void {
        this._logger.info(`handle download file request`);
		if (this._browserService.isIE11()) { // IE11 - use download API
		    this._logger.debug(`IE11 detected, open file using openLink`);
			const baseUrl = serverConfig.cdnServers.serverUri;
			const protocol = 'http';
			const partnerId = this._appAuthentication.appUser.partnerId;
			const entryId = this._widgetService.data.id;
			let url = baseUrl + '/p/' + partnerId +'/sp/' + partnerId + '00/playManifest/entryId/' + entryId + '/flavorId/' + this._widgetService.currentCaption.id + '/format/download/protocol/' + protocol;
			this._browserService.openLink(url);
		}else {
            const url = getKalturaServerUri("/api_v3/service/caption_captionasset/action/serve/ks/" + this._appAuthentication.appUser.ks + "/captionAssetId/" + this._widgetService.currentCaption.id);

			this._browserService.download(url, this._widgetService.currentCaption.id + "." + this._widgetService.currentCaption.fileExt, this._widgetService.currentCaption.fileExt);
		}
	}

    ngOnDestroy() {
	    this.actionsMenu.hide();
	    this._popupStateChangeSubscribe.unsubscribe();

        this._widgetService.detachForm();

	}


    _onLoadingAction(actionKey: string) {
        if (actionKey === 'retry') {

        }
    }
}

