import { Component, ViewChild, AfterViewInit,OnInit, OnDestroy, HostListener } from '@angular/core';
import { ISubscription } from 'rxjs/Subscription';
import { AppLocalization, UploadManagement } from '@kaltura-ng/kaltura-common';
import { FileDialogComponent } from '@kaltura-ng/kaltura-ui';
import { KalturaFlavorAssetStatus } from 'kaltura-ngx-client/api/types/KalturaFlavorAssetStatus';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { KalturaMediaType } from 'kaltura-ngx-client/api/types/KalturaMediaType';
import { PopupWidgetComponent, PopupWidgetStates } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { Menu, MenuItem } from 'primeng/primeng';
import { EntryFlavoursWidget } from './entry-flavours-widget.service';
import { Flavor } from './flavor';

import { BrowserService } from 'app-shared/kmc-shell';
import { NewEntryFlavourFile } from 'app-shared/kmc-shell/new-entry-flavour-file';
import { globalConfig } from 'config/global';

@Component({
    selector: 'kEntryFlavours',
    templateUrl: './entry-flavours.component.html',
    styleUrls: ['./entry-flavours.component.scss']
})
export class EntryFlavours implements AfterViewInit, OnInit, OnDestroy {

	@HostListener("window:resize", [])
	onWindowResize() {
		this._documentWidth = document.body.clientWidth;
	}

	@ViewChild('drmPopup') drmPopup: PopupWidgetComponent;
	@ViewChild('previewPopup') previewPopup: PopupWidgetComponent;
	@ViewChild('importPopup') importPopup: PopupWidgetComponent;
	@ViewChild('actionsmenu') private actionsMenu: Menu;
	@ViewChild('fileDialog') private fileDialog: FileDialogComponent;
	public _actions: MenuItem[] = [];

	public _selectedFlavor: Flavor;
	public _uploadFilter: string = "";
    public _loadingError = null;

	public _documentWidth: number = 2000;

	private _importPopupStateChangeSubscribe: ISubscription;

	constructor(public _widgetService: EntryFlavoursWidget,
              private _uploadManagement: UploadManagement,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService) {
    }

    ngOnInit() {
	    this._documentWidth = document.body.clientWidth;
        this._widgetService.attachForm();
    }

	openActionsMenu(event: any, flavor: Flavor): void{
		if (this.actionsMenu){
			this._actions = [];
			this._uploadFilter = this._setUploadFilter(this._widgetService.data);
			if (this._widgetService.sourceAvailabale && (flavor.id === '' || (flavor.id !== '' && flavor.status === KalturaFlavorAssetStatus.deleted))){
				this._actions.push({label: this._appLocalization.get('applications.content.entryDetails.flavours.actions.convert'), command: (event) => {this.actionSelected("convert");}});
			}
			if ((flavor.isSource && this.isSourceReady(flavor)) || ( !flavor.isSource && flavor.id !== '' &&
					(flavor.status === KalturaFlavorAssetStatus.exporting || flavor.status === KalturaFlavorAssetStatus.ready ))){
				this._actions.push({label: this._appLocalization.get('applications.content.entryDetails.flavours.actions.delete'), command: (event) => {this.actionSelected("delete");}});
				this._actions.push({label: this._appLocalization.get('applications.content.entryDetails.flavours.actions.download'), command: (event) => {this.actionSelected("download");}});
			}
			if ((flavor.isSource && (this.isSourceReady(flavor) || flavor.status === KalturaFlavorAssetStatus.deleted))||
					flavor.id === "" || (flavor.id !== "" && (flavor.status === KalturaFlavorAssetStatus.deleted ||
					flavor.status === KalturaFlavorAssetStatus.error || flavor.status === KalturaFlavorAssetStatus.notApplicable ||
					flavor.status === KalturaFlavorAssetStatus.exporting || flavor.status === KalturaFlavorAssetStatus.ready))
			){
				this._actions.push({label: this._appLocalization.get('applications.content.entryDetails.flavours.actions.upload'), command: (event) => {this.actionSelected("upload");}});
				this._actions.push({label: this._appLocalization.get('applications.content.entryDetails.flavours.actions.import'), command: (event) => {this.actionSelected("import");}});
			}
			if ((flavor.isSource && this.isSourceReady(flavor) && flavor.isWeb) ||
					(flavor.id !== "" && flavor.isWeb && (flavor.status === KalturaFlavorAssetStatus.exporting || flavor.status === KalturaFlavorAssetStatus.ready))){
				this._actions.push({label: this._appLocalization.get('applications.content.entryDetails.flavours.actions.preview'), command: (event) => {this.actionSelected("preview");}});
			}
			if (this._widgetService.sourceAvailabale && !flavor.isSource && (flavor.status === KalturaFlavorAssetStatus.error || flavor.status === KalturaFlavorAssetStatus.exporting ||
				flavor.status === KalturaFlavorAssetStatus.ready || flavor.status === KalturaFlavorAssetStatus.notApplicable)){
				this._actions.push({label: this._appLocalization.get('applications.content.entryDetails.flavours.actions.reconvert'), command: (event) => {this.actionSelected("reconvert");}});
			}
			if (flavor.isWidevine && flavor.status === KalturaFlavorAssetStatus.ready){
				this._actions.push({label: this._appLocalization.get('applications.content.entryDetails.flavours.actions.drm'), command: (event) => {this.actionSelected("drm");}});
			}
			if (this._actions.length) {
				this._selectedFlavor = flavor;
				this.actionsMenu.toggle(event);
			}
		}
	}

	private isSourceReady(flavor: Flavor): boolean{
		return (flavor.isSource && flavor.status !== KalturaFlavorAssetStatus.converting && flavor.status !== KalturaFlavorAssetStatus.waitForConvert &&
			flavor.status !== KalturaFlavorAssetStatus.queued && flavor.status !== KalturaFlavorAssetStatus.importing &&
			flavor.status !== KalturaFlavorAssetStatus.validating);
	}

	private actionSelected(action: string): void{
		switch (action){
			case "delete":
				this._widgetService.deleteFlavor(this._selectedFlavor);
				break;
			case "download":
				this._widgetService.downloadFlavor(this._selectedFlavor);
				break;
			case "upload":
				this.fileDialog.open();
				break;
			case "import":
				this.importPopup.open();
				break;
			case "convert":
				this._widgetService.convertFlavor(this._selectedFlavor);
				break;
			case "reconvert":
				this._widgetService.reconvertFlavor(this._selectedFlavor);
				break;
			case "preview":
				this.previewPopup.open();
				break;
			case "drm":
				this.drmPopup.open();
				break;
		}
	}

	private _setUploadFilter(entry: KalturaMediaEntry): string{
		let filter = "";
		if (entry.mediaType === KalturaMediaType.video){
			filter = ".flv,.asf,.qt,.mov,.mpg,.avi,.wmv,.mp4,.3gp,.f4v,.m4v";
		}
		if (entry.mediaType === KalturaMediaType.audio){
			filter = ".flv,.asf,.qt,.mov,.mpg,.avi,.wmv,.mp3,.wav";
		}
		return filter;
	}

  private _validateFileSize(file: File): boolean {
    const maxFileSize = globalConfig.kalturaServer.maxUploadFileSize;
    const fileSize = file.size / 1024 / 1024; // convert to Mb

    return this._uploadManagement.supportChunkUpload(new NewEntryFlavourFile(null)) || fileSize < maxFileSize;
  }

  public _onFileSelected(selectedFiles: FileList) {
    if (selectedFiles && selectedFiles.length) {
      const fileData: File = selectedFiles[0];

      if (this._validateFileSize(fileData)) {
        this._widgetService.uploadFlavor(this._selectedFlavor, fileData);
      } else {
        this._browserService.alert({
          header: this._appLocalization.get('app.common.attention'),
          message: this._appLocalization.get('applications.upload.validation.fileSizeExceeded')
        });
      }
    }
  }

    ngOnDestroy() {
	    this.actionsMenu.hide();
	    this._importPopupStateChangeSubscribe.unsubscribe();

		this._widgetService.detachForm();

	}


    ngAfterViewInit() {
	    if (this.importPopup) {
		    this._importPopupStateChangeSubscribe = this.importPopup.state$
			    .subscribe(event => {
				    if (event.state === PopupWidgetStates.Close) {
					    if (event.context && event.context.flavorUrl){
						    this._widgetService.importFlavor(this._selectedFlavor, event.context.flavorUrl);
					    }
				    }
			    });
	    }
    }
}

