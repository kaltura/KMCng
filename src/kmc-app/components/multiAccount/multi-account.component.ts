import {Component, Output, OnInit, EventEmitter} from '@angular/core';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { BrowserService} from 'app-shared/kmc-shell';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'kMultiAccountMenu',
  templateUrl: './multi-account.component.html',
  styleUrls: ['./multi-account.component.scss']
})
export class MultiAccountComponent implements OnInit {

  @Output() menuChange = new EventEmitter<string>();
  public _menuItems: MenuItem[] = [];
  public _defaultMenuSelection: string;

  constructor(private _appLocalization: AppLocalization,
              private _browserService: BrowserService) {
  }

  ngOnInit() {
      this._menuItems = [
          {label: this._appLocalization.get('app.titles.allAccounts'),command: (event) => {
                  this._defaultMenuSelection = this._appLocalization.get('app.titles.allAccounts');
                  this.menuChange.emit('allAccounts');
              }},
          {label: this._appLocalization.get('app.titles.parentOnly'),command: (event) => {
                  this._defaultMenuSelection = this._appLocalization.get('app.titles.parentOnly');
                  this.menuChange.emit('parentOnly');
              }}
      ];

      this._defaultMenuSelection = this._menuItems[0].label;
      this.menuChange.emit('allAccounts');
  }

}

