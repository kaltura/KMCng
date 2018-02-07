import {Component} from '@angular/core';
import {BrowserService} from 'app-shared/kmc-shell';
import {AppAuthentication, AppUser, PartnerPackageTypes, AppNavigator} from 'app-shared/kmc-shell';
import {Md5} from 'ts-md5/dist/md5';
import { serverConfig } from 'config/server';
import { analyticsAppConfig } from '../../analytics-app-config';

@Component({
  selector: 'kKMCUserSettings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent {
  timeoutID: number = null;
  public _userContext: AppUser;
  public _languages = [];
  public _selectedLanguage = 'en';

  constructor(private userAuthentication: AppAuthentication, private appNavigator: AppNavigator, private browserService: BrowserService) {
    this._userContext = userAuthentication.appUser;

    analyticsAppConfig.core.locales.forEach(locale => {
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
  }

  logout() {
    this.userAuthentication.logout();
  }

  openUserManual() {
    this.browserService.openLink(serverConfig.externalLinks.kaltura.userManual, {}, '_blank');
  }

  openSupport() {
    // check if this is a paying partner. If so - open support form. If not - redirect to general support. Use MD5 to pass as a parameter.
    const payingCustomer: boolean = this._userContext.partnerInfo.partnerPackage === PartnerPackageTypes.PartnerPackagePaid;
    const params = {
      'type': Md5.hashStr(payingCustomer.toString()),
      'pid': this._userContext.partnerId
    };

    // TODO [kmc] Open support in a modal window over KMC and not in _blank
    this.browserService.openLink(serverConfig.externalLinks.kaltura.support, params, '_blank');
  }

  onLangSelected(event) {
    this.browserService.setInLocalStorage('kmc_lang', event.value);
    this.userAuthentication.reload();
  }

}
