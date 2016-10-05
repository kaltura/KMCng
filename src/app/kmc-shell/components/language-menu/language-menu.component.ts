import { Component } from '@angular/core';
import { AppConfig, AppStorage } from '@kaltura-ng2/kaltura-core';

import { TranslateService, LangChangeEvent } from 'ng2-translate/ng2-translate';
import * as R from 'ramda';

@Component({
  selector: 'kmc-language-menu',
  templateUrl: './language-menu.component.html',
  styleUrls: ['./language-menu.component.scss']
})
export class LanguageMenuComponent {

  selectedLanguage: any;
  menuOpened: boolean = false;
  languages: Array<Object> = [];

  constructor(private kmcConfig: AppConfig, private translate: TranslateService, private appStorage: AppStorage, private appConfig: AppConfig) {
    this.languages = kmcConfig.get("core.locales");

    if (typeof this.translate.currentLang !== "undefined"){
      this.selectedLanguage = this.getLanguageById(this.translate.currentLang);
    }
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.selectedLanguage = this.getLanguageById(event.lang);
    });
  }

  toggleMenu() {
    this.menuOpened = !this.menuOpened;
  }

  selectLanguage(langId: string) {
    this.menuOpened = false;
    this.translate.use(langId);
    this.appStorage.setInLocalStorage('kmc_lang', langId);
  }

  private getLanguageById(langId : any) : any {
    return R.find(R.propEq('id', langId))(this.appConfig.get('core.locales'));
  }
}
