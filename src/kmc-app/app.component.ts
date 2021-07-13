import {Component, OnInit, ViewChild} from '@angular/core';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { OperationTagManagerService} from '@kaltura-ng/kaltura-common';
import { NavigationEnd, Router } from '@angular/router';
import { KmcLoggerConfigurator } from 'app-shared/kmc-shell/kmc-logs/kmc-logger-configurator';
import { asyncScheduler } from 'rxjs';
import { observeOn } from 'rxjs/operators';
import { OpenEmailEvent } from 'app-shared/kmc-shared/events';
import { AppEventsService } from 'app-shared/kmc-shared';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { EmailConfig } from './components/open-email/open-email.component';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { BoostrappingStatus, AppBootstrap } from 'app-shared/kmc-shell';
import { ConfirmationService } from 'primeng/api';
/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers : [ConfirmationService]
})
export class AppComponent implements OnInit {

  @ViewChild('confirm', { static: true }) private _confirmDialog: ConfirmDialog;
  @ViewChild('alert', { static: true }) private _alertDialog: ConfirmDialog;
  @ViewChild('openEmailPopup', { static: true }) private _emailDialog: PopupWidgetComponent;

  public _isBusy: boolean = false;
  public _confirmDialogAlignLeft = false;
  public _openEmailConfig: EmailConfig = {email: "", title: "", message:""};
  public _confirmationLabels = {
      yes: "Yes",
      no: "No",
      ok: "OK"
  };

  constructor(private _confirmationService: ConfirmationService,
              private _browserService : BrowserService,
              private router: Router,
              private _loggerConfigurator: KmcLoggerConfigurator,
              private _oprationsTagManager: OperationTagManagerService,
              private _appEvents: AppEventsService,
              private _appLocalization: AppLocalization,
              private appBootstrap: AppBootstrap
              ) {

  }

  ngOnInit() {

      const statusChangeSubscription = this.appBootstrap.bootstrapStatus$.subscribe(
          (status : BoostrappingStatus) => {
              if (status === BoostrappingStatus.Bootstrapped) {
                  this._confirmationLabels = {
                      yes: this._appLocalization.get('app.common.yes'),
                      no: this._appLocalization.get('app.common.no'),
                      ok: this._appLocalization.get('app.common.ok')
                  };
                  statusChangeSubscription.unsubscribe();
              }
          }
      );

    this._browserService.registerOnShowConfirmation((confirmationMessage) => {
        const htmlMessageContent = confirmationMessage.message.replace(/\r|\n/g, '<br/>');
        const formattedMessage = Object.assign({}, confirmationMessage, {message: htmlMessageContent});

        if (confirmationMessage.alignMessage === 'byContent') {
            this._confirmDialogAlignLeft = confirmationMessage.message && /\r|\n/.test(confirmationMessage.message);
        } else {
            this._confirmDialogAlignLeft = confirmationMessage.alignMessage === 'left';
        }

        if (!formattedMessage.acceptLabel) {
            formattedMessage.acceptLabel = this._appLocalization.get('app.common.yes');
        }
        if (!formattedMessage.rejectLabel) {
            formattedMessage.rejectLabel = this._appLocalization.get('app.common.no');
        }
      this._confirmationService.confirm(formattedMessage);
      // fix for PrimeNG no being able to calculate the correct content height

      // UPDATE: they claim they've fixed it already by
      // https://github.com/primefaces/primeng/commit/e510d430120d0cdc399b06a0332eb13258771d32#diff-f490f0e0b3c83cf3465419219de415b6
      // Need QA verification

      // setTimeout(() => {
      //     const dialog: ConfirmDialog = (confirmationMessage.key && confirmationMessage.key === 'confirm') ? this._confirmDialog : this._alertDialog;
      //     dialog.center();
      // },0);
    });

    // scroll window to top upon navigation change
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
          window.scrollTo(0, 0);
        }
      });

    // handle app status: busy and error messages. Allow closing error window using the 'OK' button
    this._oprationsTagManager.tagStatus$
        .pipe(observeOn(asyncScheduler))
        .subscribe((tags: {[key: string]: number}) => {
            this._isBusy = tags['block-shell'] > 0;
        });

      // handle open Email event
      this._appEvents.event(OpenEmailEvent)
          .subscribe(({email, title, message}) => {
              this._openEmailConfig = {email, title, message}
              this._emailDialog.open();
          });

      this._loggerConfigurator.init();
  }
}
