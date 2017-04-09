import { Injectable, KeyValueDiffers, KeyValueDiffer,  IterableDiffers, IterableDiffer, KeyValueChangeRecord, CollectionChangeRecord } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { KalturaServerClient, KalturaMultiRequest } from '@kaltura-ng2/kaltura-api';
import { CaptionAssetListAction, CaptionAssetDeleteAction, CaptionAssetSetAsDefaultAction, CaptionAssetUpdateAction, CaptionAssetSetContentAction, CaptionAssetAddAction, KalturaContentResource, KalturaUrlResource, KalturaUploadedFileTokenResource,
	KalturaCaptionAsset, KalturaFilterPager, KalturaAssetFilter, KalturaCaptionType, KalturaCaptionAssetStatus, KalturaLanguage, KalturaMediaEntry } from '@kaltura-ng2/kaltura-api/types';
import { AppLocalization, KalturaUtils } from '@kaltura-ng2/kaltura-common';

import { EntrySection } from '../../entry-store/entry-section-handler';
import { EntrySectionTypes } from '../../entry-store/entry-sections-types';
import { EntrySectionsManager } from '../../entry-store/entry-sections-manager';
import { KalturaOVPFile } from '@kaltura-ng2/kaltura-common/upload-management/kaltura-ovp';
import { UploadManagement } from '@kaltura-ng2/kaltura-common/upload-management';

export interface CaptionRow {
	uploadStatus: boolean,
	uploadToken: string,
	uploadUrl: string,
	id: string,
	isDefault: number,
	format: KalturaCaptionType,
	language: KalturaLanguage,
	label: string
}
@Injectable()
export class EntryCaptionsHandler extends EntrySection
{
	captionsListDiffer: IterableDiffer;
	captionDiffer : { [key : string] : KeyValueDiffer } = {};

	private _captions : BehaviorSubject<{ items : CaptionRow[], loading : boolean, error? : any}> = new BehaviorSubject<{ items : CaptionRow[], loading : boolean, error? : any}>(
		{ items : null, loading : false}
	);

	public _captions$ = this._captions.asObservable().monitor('caption files');
	public currentCaption: CaptionRow;

	private _entryId: string = '';

    constructor(manager : EntrySectionsManager, private _objectDiffers:  KeyValueDiffers, private _listDiffers : IterableDiffers,
                private _kalturaServerClient: KalturaServerClient, private _appLocalization:AppLocalization, private _uploadManagement : UploadManagement)
    {
        super(manager);
    }

    public get sectionType() : EntrySectionTypes
    {
        return EntrySectionTypes.Captions;
    }

    /**
     * Do some cleanups if needed once the section is removed
     */
    protected _reset()
    {
	    this._entryId = '';
	    this._captions.next({ loading : false, items : [], error : null});
    }

    protected _activate(firstLoad : boolean) {
	    this._entryId = this.data.id;
	    this._fetchCaptions();
    }

    private _fetchCaptions(): void{
	    this._captions.next({items : [], loading : true});


	    this._kalturaServerClient.request(new CaptionAssetListAction({
			    filter: new KalturaAssetFilter()
				    .setData(filter => {
					    filter.entryIdEqual = this._entryId;
				    }),
			    pager: new KalturaFilterPager().setData(
				    pager => {
					    pager.pageIndex = 0;
					    pager.pageSize = 100;
				    }
			    )
		    }))
		    .cancelOnDestroy(this,this.sectionReset$)
		    .monitor('get captions')
		    .subscribe(
			    response =>
			    {
				    this._captions.next({items : response.objects as any[], loading : false});
				    this.captionsListDiffer = this._listDiffers.find([]).create(null);
				    this.captionsListDiffer.diff(this._captions.getValue().items);

				    this.captionDiffer = {};
				    this._captions.getValue().items.forEach((caption) => {
					    this.captionDiffer[caption.id] = this._objectDiffers.find([]).create(null);
					    this.captionDiffer[caption.id].diff(caption);
				    });
			    },
			    error =>
			    {
				    this._captions.next({items : [], loading : false, error : error});
			    }
		    );
    }

    public _setAsDefault(caption: KalturaCaptionAsset): void{
	    const captionId = caption.id;
	    let captions = Array.from(this._captions.getValue().items); // create a copy of the captions array withour a reference to the original array
	    captions.forEach((caption) => {
		   caption.isDefault = caption.id === captionId ? 1 : 0;
	    });
	    this._captions.next({items : captions, loading : false, error : null});
    }

    public _getCaptionType(captionFormat: KalturaCaptionType): string{
	    let type = this._appLocalization.get('app.common.n_a');
	    switch (captionFormat.toString()){
		    case KalturaCaptionType.Srt.toString():
		    	type = "SRT";
			    break;
		    case KalturaCaptionType.Dfxp.toString():
		    	type = "DFXP";
			    break;
		    case KalturaCaptionType.Webvtt.toString():
		    	type = "WEBVTT";
			    break;
	    }
	    return type;
    }

    public _getCaptionStatus(caption: any): string{
	    let status = "";
	    if (caption.status) {
		    status = this._appLocalization.get('applications.content.entryDetails.captions.processing');
		    switch (caption.status.toString()) {
			    case KalturaCaptionAssetStatus.Error.toString():
				    status = this._appLocalization.get('applications.content.entryDetails.captions.error');
				    break;
			    case KalturaCaptionAssetStatus.Ready.toString():
				    status = this._appLocalization.get('applications.content.entryDetails.captions.saved');
				    break;
		    }
	    }else{
		    if ((caption.uploadToken && caption.uploadToken.length) || (caption.uploadUrl && caption.uploadUrl.length)){
			    status = this._appLocalization.get('applications.content.entryDetails.captions.ready');
		    }
	    }
	    return status;
    }

    public _addCaption(): any{

		let newCaption: CaptionRow = {
			uploadStatus: false,
			uploadToken: "",
			uploadUrl: "",
			id: null,
			format: KalturaCaptionType.Srt,
	        language: KalturaLanguage.En,
	        label: "English",
	        isDefault: 0
		};

	    let captions = Array.from(this._captions.getValue().items); // create a copy of the captions array without a reference to the original array
	    captions.push(newCaption);
	    this._captions.next({items : captions, loading : false, error : null});
	    this.currentCaption = this._captions.getValue().items[captions.length -1];
	    return this.currentCaption;
	}

	public upload(captionFile: File):void{
		this.currentCaption.uploadStatus = true;
		this._uploadManagement.newUpload(new KalturaOVPFile(captionFile))
			.subscribe((response) => {
					// update file with actual upload token
					this.currentCaption.uploadToken = response.uploadToken;
					this.currentCaption.uploadStatus = false;
				},
				(error) => {
					// TODO [kmcng] implement logic decided with Product
					// remove file from list
				});
	}

	public removeCaption(caption: CaptionRow): void{
		// update the list by filtering the assets array.

		this._captions.next({items : this._captions.getValue().items.filter((item: CaptionRow) => {return item !== caption}), loading : false});

		// stop tracking changes on this asset
		// if file id is empty it was added by the user so no need to track its changes.
		if (caption.id && this.captionDiffer[caption.id]){
			delete this.captionDiffer[caption.id];
		}
	}

    public _getRowStyle(rowData, rowIndex): string{
	    return rowData.uploadStatus ? "uoloading" : '';
    }

	protected _onDataSaving(data: KalturaMediaEntry, request: KalturaMultiRequest)
	{
		if ( this._captions.getValue().items ) {

			// check for added and removed captions
			if (this.captionsListDiffer) {
				let changes = this.captionsListDiffer.diff(this._captions.getValue().items);
				if (changes) {
					changes.forEachAddedItem((record: CollectionChangeRecord) => {
						// added captions
						let captionAsset = new KalturaCaptionAsset({language: record.item.language, format: record.item.format, label: record.item.label});
						const addCaptionRequest: CaptionAssetAddAction = new CaptionAssetAddAction({entryId: this.data.id, captionAsset: captionAsset});
						request.requests.push(addCaptionRequest);

						let setContentRequest: CaptionAssetSetContentAction;
						if ((record.item as CaptionRow).uploadUrl){ // add new caption from URL
							let resource = new KalturaUrlResource();
							resource.url = (record.item as CaptionRow).uploadUrl;
							setContentRequest = new CaptionAssetSetContentAction({id: '0', contentResource: resource})
								.setDependency(['id', (request.requests.length), 'id']); console.warn("Warning: should be request.requests.length-1 after KAPI fix!");
						}
						if ((record.item as CaptionRow).uploadToken){ // add new caption from upload token
							let resource = new KalturaUploadedFileTokenResource();
							resource.token = (record.item as CaptionRow).uploadToken;
							setContentRequest = new CaptionAssetSetContentAction({id: '0', contentResource: resource})
								.setDependency(['id', (request.requests.length), 'id']); console.warn("Warning: should be request.requests.length-1 after KAPI fix!");
						}
						if (setContentRequest){
							request.requests.push(setContentRequest);
						}
					});
					changes.forEachRemovedItem((record: CollectionChangeRecord) => {
						// remove deleted captions
						const deleteCaptionRequest: CaptionAssetDeleteAction = new CaptionAssetDeleteAction({captionAssetId: (record.item as CaptionRow).id});
						request.requests.push(deleteCaptionRequest);
					});
				}
			}

			// update changed captions and setting default caption
			this._captions.getValue().items.forEach((caption: any) => {
				var captionDiffer = this.captionDiffer[caption.id];
				if (captionDiffer) {
					var objChanges = captionDiffer.diff(caption);
					if (objChanges) {
						let updatedCaptionIDs = [];
						objChanges.forEachChangedItem((record: KeyValueChangeRecord) => {
							// update default caption if changed
							if (record.key === "isDefault" && record.currentValue === 1) {
								const setAsDefaultRequest: CaptionAssetSetAsDefaultAction = new CaptionAssetSetAsDefaultAction({captionAssetId: caption.id});
								request.requests.push(setAsDefaultRequest);
							} else {
								// update other fields
								if (updatedCaptionIDs.indexOf(caption.id) === -1) { // make sure we update each caption only once as we update all changed fields at once
									updatedCaptionIDs.push(caption.id);
									const updateCaptionRequest: CaptionAssetUpdateAction = new CaptionAssetUpdateAction({
										id: caption.id,
										captionAsset: caption
									});
									request.requests.push(updateCaptionRequest);
								}
							}
						});
					}
				}
			});
		}
	}


}
