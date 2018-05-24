import { Component, Input, OnInit } from '@angular/core';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { BrowserService } from 'app-shared/kmc-shell';
import { AppLocalization } from '@kaltura-ng/kaltura-common';


@Component({
  selector: 'kOpenEmail',
  templateUrl: './open-email.component.html',
  styleUrls: ['./open-email.component.scss']
})
export class OpenEmailComponent implements OnInit {

  @Input() parentPopupWidget: PopupWidgetComponent;
  @Input() emailConfig: any;

  public _copyToClipboardTooltips: { success: string, failure: string, idle: string, notSupported: string } = null;

  constructor(private _browserService: BrowserService, private _appLocalization: AppLocalization) {
      this._copyToClipboardTooltips = {
          success: this._appLocalization.get('applications.content.syndication.table.copyToClipboardTooltip.success'),
          failure: this._appLocalization.get('applications.content.syndication.table.copyToClipboardTooltip.failure'),
          idle: this._appLocalization.get('applications.content.syndication.table.copyToClipboardTooltip.idle'),
          notSupported: this._appLocalization.get('applications.content.syndication.table.copyToClipboardTooltip.notSupported')
      };
  }

  ngOnInit() {

  }

  openEmail():void{
      this._browserService.openEmail(this.emailConfig.email, true);
  }

  close(): void{
      this.parentPopupWidget.close();
  }

}

