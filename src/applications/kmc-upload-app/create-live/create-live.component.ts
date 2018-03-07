import {AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CreateLiveService} from './create-live.service';
import {AppLocalization} from '@kaltura-ng/kaltura-common';
import {KalturaRecordStatus} from 'kaltura-ngx-client/api/types/KalturaRecordStatus';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {BrowserService} from 'app-shared/kmc-shell';
import {Router} from '@angular/router';
import {PopupWidgetComponent, PopupWidgetStates} from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import {KalturaLive} from './kaltura-live-stream/kaltura-live-stream.interface';
import {ManualLive} from './manual-live/manual-live.interface';
import {UniversalLive} from './universal-live/universal-live.interface';
import { KalturaLiveStreamEntry } from 'kaltura-ngx-client/api/types/KalturaLiveStreamEntry';
import { KalturaSourceType } from 'kaltura-ngx-client/api/types/KalturaSourceType';
import { AppEventsService } from 'app-shared/kmc-shared';
import { UpdateEntriesListEvent } from 'app-shared/kmc-shared/events/update-entries-list-event';

export enum StreamTypes {
  kaltura,
  universal,
  manual
}

@Component({
  selector: 'kCreateLive',
  templateUrl: './create-live.component.html',
  styleUrls: ['./create-live.component.scss'],
  providers: [CreateLiveService]
})
export class CreateLiveComponent implements OnInit, OnDestroy, AfterViewInit {
  public _selectedStreamType: StreamTypes = StreamTypes.kaltura;
  public kalturaLiveStreamData: KalturaLive = {
    name: '',
    description: '',
    transcodingProfile: null,
    liveDVR: false,
    enableRecording: false,
    enableRecordingSelectedOption: KalturaRecordStatus.appended,
    previewMode: false
  };
  public manualLiveData: ManualLive = {
    name: '',
    description: '',
    flashHDSURL: '',
    hlsStreamUrl: '',
    useAkamaiHdProtocol: false
  };
  public universalLiveData: UniversalLive = {
    name: '',
    description: '',
    primaryEncoderIp: '',
    secondaryEncoderIp: '',
    broadcastPassword: '',
    liveDvr: false
  };
  public _availableStreamTypes: Array<{ value: StreamTypes, label: string }>;
  public _streamTypes = StreamTypes;
  public _blockerMessage: AreaBlockerMessage;
  private _showConfirmationOnClose = true;

  @ViewChild('kalturaLiveStreamComponent') kalturaLiveStreamComponent;
  @ViewChild('manualLiveComponent') manualLiveComponent;
  @ViewChild('universalLiveComponent') universalLiveComponent;
  @Input() parentPopupWidget: PopupWidgetComponent;

  constructor(private createLiveService: CreateLiveService,
              private _appLocalization: AppLocalization,
              private _appEvents: AppEventsService,
              private _browserService: BrowserService,
              private _router: Router) {
  }

  ngOnInit() {
    this._availableStreamTypes = [
      {
        value: StreamTypes.kaltura,
        label: this._appLocalization.get('applications.upload.prepareLive.streamTypes.kaltura')
      },
      {
        value: StreamTypes.universal,
        label: this._appLocalization.get('applications.upload.prepareLive.streamTypes.universal')
      },
      {
        value: StreamTypes.manual,
        label: this._appLocalization.get('applications.upload.prepareLive.streamTypes.manual')
      }
    ];
  }

  ngAfterViewInit() {
    if (this.parentPopupWidget) {
      this.parentPopupWidget.state$
        .cancelOnDestroy(this)
        .subscribe(event => {
          if (event.state === PopupWidgetStates.Open) {
            this._showConfirmationOnClose = true;
          }
          if (event.state === PopupWidgetStates.BeforeClose) {
            if (event.context && event.context.allowClose) {
              if (this._isCurrentSelectedFormDirty() && this._showConfirmationOnClose) {
                event.context.allowClose = false;
                this._browserService.confirm(
                  {
                    header: this._appLocalization.get('applications.content.addNewPlaylist.cancelEdit'),
                    message: this._appLocalization.get('applications.content.addNewPlaylist.discard'),
                    accept: () => {
                      this._showConfirmationOnClose = false;
                      this.parentPopupWidget.close();
                    }
                  }
                );
              }
            }
          }
        });
    }
  }

  ngOnDestroy() {
  }

  submitCurrentSelectedForm() {
    switch (this._selectedStreamType) {
      case StreamTypes.kaltura: {
        this._submitKalturaLiveStreamData();
        break;
      }
      case StreamTypes.universal: {
        this._submitUniversalLiveStreamData();
        break;
      }
      case StreamTypes.manual: {
        this._submitManualLiveStreamData();
        break;
      }
      default: {
        // add error message for trying to submit unsupported form type
        this._blockerMessage = new AreaBlockerMessage({
          title: 'Cannot create stream',
          message: 'Unsupported stream type, please select different stream type from the \'Stream type\' select menu',
          buttons: [{
            label: this._appLocalization.get('app.common.confirm'),
            action: () => {
              this._blockerMessage = null;
            }
          }]
        });
        break;
      }
    }
  }

  private _isCurrentSelectedFormDirty(): boolean {
    switch (this._selectedStreamType) {
      case StreamTypes.kaltura: {
        return this.kalturaLiveStreamComponent.isFormDirty();
      }
      case StreamTypes.universal: {
        return this.universalLiveComponent.isFormDirty();
      }
      case StreamTypes.manual: {
        return this.manualLiveComponent.isFormDirty();
      }
      default: {
        return false;
      }
    }
  }


  private _confirmEntryNavigation(liveStream: KalturaLiveStreamEntry): void {
    const header = this._appLocalization.get('applications.upload.prepareLive.confirmEntryNavigation.title');

    switch (liveStream.sourceType) {
      case KalturaSourceType.liveStream:
        this._browserService.confirm({
          header,
          message: this._appLocalization.get('applications.upload.prepareLive.confirmEntryNavigation.kalturaMessage'),
          accept: () => {
            this._router.navigate(
              ['/content/entries/entry', liveStream.id],
              { queryParams: { reloadEntriesListOnNavigateOut: true } }
            );
            this._showConfirmationOnClose = false;
            this.parentPopupWidget.close();
          },
          reject: () => {
            this._showConfirmationOnClose = false;
            this._appEvents.publish(new UpdateEntriesListEvent());
            this.parentPopupWidget.close();
          }
        });
        break;

      case KalturaSourceType.akamaiUniversalLive:
        this._browserService.alert({
          header,
          message: this._appLocalization.get('applications.upload.prepareLive.confirmEntryNavigation.universalMessage'),
          accept: () => {
            this._showConfirmationOnClose = false;
            this._appEvents.publish(new UpdateEntriesListEvent());
            this.parentPopupWidget.close();
          }
        });
        break;

      case KalturaSourceType.manualLiveStream:
        this._browserService.alert({
          header,
          message: this._appLocalization.get(
            'applications.upload.prepareLive.confirmEntryNavigation.manualMessage',
            [liveStream.id]
          ),
          accept: () => {
            this._showConfirmationOnClose = false;
            this._appEvents.publish(new UpdateEntriesListEvent());
            this.parentPopupWidget.close();
          }
        });
        break;

      default:
        this._browserService.alert({
          header,
          message: this._appLocalization.get('applications.upload.prepareLive.confirmEntryNavigation.generalMessage'),
          accept: () => {
            this._showConfirmationOnClose = false;
            this.parentPopupWidget.close();
          }
        });
        break;
    }
  }


  private _submitKalturaLiveStreamData() {
    if (this.kalturaLiveStreamComponent.validate()) {
      this.createLiveService.createKalturaLiveStream(this.kalturaLiveStreamData)
        .cancelOnDestroy(this)
        .tag('block-shell')
        .subscribe(response => {
          this._confirmEntryNavigation(response);
        }, error => {
          this._blockerMessage = new AreaBlockerMessage({
            title: 'Error',
            message: error.message,
            buttons: [{
              label: this._appLocalization.get('app.common.close'),
              action: () => {
                this._blockerMessage = null;
              }
            }]
          });
        });
    }
  }

  private _submitUniversalLiveStreamData() {
    if (this.universalLiveComponent.validate()) {
      this.createLiveService.createUniversalLiveStream(this.universalLiveData)
        .cancelOnDestroy(this)
        .tag('block-shell')
        .subscribe(response => {
          this._confirmEntryNavigation(response);
        }, error => {
          this._blockerMessage = new AreaBlockerMessage({
            title: 'Error',
            message: error.message,
            buttons: [{
              label: this._appLocalization.get('app.common.close'),
              action: () => {
                this._blockerMessage = null;
              }
            }]
          });
        });
    }
  }

  private _submitManualLiveStreamData() {
    if (this.manualLiveComponent.validate()) {
      this.createLiveService.createManualLiveStream(this.manualLiveData)
        .cancelOnDestroy(this)
        .tag('block-shell')
        .subscribe(response => {
          this._confirmEntryNavigation(response);
        }, error => {
          this._blockerMessage = new AreaBlockerMessage({
            title: 'Error',
            message: error.message,
            buttons: [{
              label: this._appLocalization.get('app.common.close'),
              action: () => {
                this._blockerMessage = null;
              }
            }]
          });
        });
    }
  }
}
