import {Component, Input} from '@angular/core';
import {BrowserService} from 'app-shared/kmc-shell';
import {AppAuthentication, AppUser} from 'app-shared/kmc-shell';
import { kmcAppConfig } from '../../kmc-app-config';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui';
import { Router } from '@angular/router';

@Component({
  selector: 'kKMCUserSettings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent {
  @Input() parentPopup: PopupWidgetComponent;
  public _languages = [];
  public _dateFormats = [
      { value: 'month-day-year', label: 'MM/DD/YYYY' },
      { value: 'day-month-year', label: 'DD/MM/YYYY' },
  ];
  public _selectedLanguage = 'en';
  public _selectedDateFormat = this.browserService.getFromLocalStorage('kmc_date_format') || 'month-day-year';
  public userInitials: string;
  public partnerInfo: string[];

  constructor(public _userAuthentication: AppAuthentication, private browserService: BrowserService, private _router: Router) {
      kmcAppConfig.locales.forEach(locale => {
      this._languages.push({label: locale.label, value: locale.id});
    });

    const currentLang = this.browserService.getFromLocalStorage('kmc_lang');
    if (currentLang && currentLang.length) {
      const lang = this._languages.find((lang) => {
        return lang.value === currentLang
      });
      if (lang) {
        this._selectedLanguage = lang.value;
      }
    }

    if (this._userAuthentication.appUser?.fullName) {
        this.userInitials = this._userAuthentication.appUser.fullName.toUpperCase().split(' ').slice(0, 2).map(s => s[0]).join('');
    }
    if (this._userAuthentication.appUser?.partnerInfo?.name) {
        this.partnerInfo = this._userAuthentication.appUser.partnerInfo.name.split('-').slice(0, 2);
    }
  }

  logout() {
    this._userAuthentication.logout();
  }

  onLangSelected(event) {
    this.browserService.setInLocalStorage('kmc_lang', event.value);
    this._userAuthentication.reload();
  }

  onDateFormatSelected(event: { value: string }): void {
      this.browserService.setInLocalStorage('kmc_date_format', event.value);
      this._userAuthentication.reload();
  }

    egg(){
        this._router.navigateByUrl(kmcAppConfig.routing.errorRoute, { replaceUrl: true });
    }

}
