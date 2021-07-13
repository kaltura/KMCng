import {Component, Input, OnInit} from '@angular/core';
import {FormGroup, FormBuilder} from '@angular/forms';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {AppAuthentication, BrowserService} from 'app-shared/kmc-shell';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui';
import {KalturaClient} from 'kaltura-ngx-client';
import {PartnerListPartnersForUserAction} from 'kaltura-ngx-client';
import {KalturaPartnerFilter} from 'kaltura-ngx-client';
import {KalturaPartnerStatus} from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import { KalturaFilterPager } from 'kaltura-ngx-client';

@Component({
  selector: 'kChangeAccount',
  templateUrl: './change-account.component.html',
  styleUrls: ['./change-account.component.scss']
})
export class ChangeAccountComponent implements OnInit {

  @Input() parentPopupWidget: PopupWidgetComponent;

  public partners: { 'id': number, 'name': string }[];
  public changeAccountForm: FormGroup;
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = false;
  public _currentPartnerId: number;

  constructor(private _fb: FormBuilder,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService,
              private _appAuthentication: AppAuthentication,
              private _kalturaServerClient: KalturaClient,
              private _userAuthentication: AppAuthentication) {
  }

  ngOnInit() {
    this._currentPartnerId = this._userAuthentication.appUser.partnerId;
    this._createForm();
    this.loadAvailablePartners();
  }

  private loadAvailablePartners() {
    this._isBusy = true;
    this.getAvailablePartners()
      .subscribe(partners => {
          this.partners = partners;
          setTimeout(() => { // bypass radiobutton issue in angular 8 version
              this.changeAccountForm.setValue(
                  { account: this._userAuthentication.appUser.partnerId },
                  { emitEvent: false, onlySelf: true }
              );
          });
          this._isBusy = false;
          this._blockerMessage = null;
        },
        error => {
          this._blockerMessage = new AreaBlockerMessage(
            {
              message: this._appLocalization.get('app.changeAccount.errors.loadPartners'),
              buttons: [
                {
                  label: this._appLocalization.get('app.common.retry'),
                  action: () => {
                    this.loadAvailablePartners();
                  }
                }
              ]
            }
          );
        });
  }

  public _saveAndClose(): void {
    const account = this.changeAccountForm.get('account').value; // pass selected account
    // this.parentPopupWidget.close(account);
    this._isBusy = true;
    this._userAuthentication.switchPartnerId(account)
      .subscribe(() => {
          this._isBusy = false;
          this._blockerMessage = null;
        },
        error => {
          this._blockerMessage = new AreaBlockerMessage({
            title: this._appLocalization.get('app.common.attention'),
            message: error.code === 'NEW_LOGIN_REQUIRED' ? this._appLocalization.get('app.changeAccount.errors.authenticationRequired') : error.message,
            buttons: error.code === 'NEW_LOGIN_REQUIRED' ? [
                    {
                        label: this._appLocalization.get('app.userSettings.logout'),
                        action: () => {
                            this._browserService.setInLocalStorage('loginPartnerId', account);
                            this._appAuthentication.logout();
                        }
                    },
                    {
                        label: this._appLocalization.get('app.common.cancel'),
                        action: () => {
                            this._isBusy = false;
                            this._blockerMessage = null;
                        }
                    }
                ] :
                [{
                  label: this._appLocalization.get('app.common.ok'),
                  action: () => {
                    this._isBusy = false;
                    this._blockerMessage = null;
                  }
                }]
          });
        });
  }


  private _createForm(): void {
    this.changeAccountForm = this._fb.group({
      account: '',
    });
  }

  private getAvailablePartners(): Observable<{ 'id': number, 'name': string }[]> {
    const pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 500});
    const filter = new KalturaPartnerFilter({
      statusEqual: KalturaPartnerStatus.active
    });

    return this._kalturaServerClient.request(new PartnerListPartnersForUserAction({
      partnerFilter: filter,
        pager: pager
    }))
      .pipe(map(data => {
        return data.objects.map(partner => ({'id': partner.id, 'name': partner.name}))
      }));
  }
}

