import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { AppAuthentication, AppUser, AppNavigator } from 'app-shared/kmc-shell';
import { BrowserService } from 'app-shared/kmc-shell';
import { serverConfig } from 'config/server';

import * as R from 'ramda';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { AppEventsService } from 'app-shared/kmc-shared';
import { KmcLoggerConfigurator } from 'app-shared/kmc-shell/kmc-logs/kmc-logger-configurator';

import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';
import { KMCAppMenuItem, KmcMainViewsService } from 'app-shared/kmc-shared/kmc-views';

@Component({
    selector: 'kKMCAppMenu',
    templateUrl: './app-menu.component.html',
    styleUrls: ['./app-menu.component.scss'],
    providers: [
        KalturaLogger.createLogger('AppMenuComponent')
    ]

})
export class AppMenuComponent implements OnInit, OnDestroy{

    @ViewChild('helpmenu') private _helpmenu: PopupWidgetComponent;

    public _userContext: AppUser;
    public _showChangelog = false;
    public _helpMenuOpened = false;
    public _powerUser = false;

    menuConfig: KMCAppMenuItem[];
    leftMenuConfig: KMCAppMenuItem[];
    rightMenuConfig: KMCAppMenuItem[];
    selectedMenuItem: KMCAppMenuItem;
    showSubMenu = true;

    constructor(public _kmcLogs: KmcLoggerConfigurator,
                private userAuthentication: AppAuthentication,
                private _kmcMainViews: KmcMainViewsService,
                private _logger: KalturaLogger,
                private router: Router,
                private _route: ActivatedRoute,
                private _appEvents: AppEventsService,
                private _browserService: BrowserService) {

        router.events
            .cancelOnDestroy(this)
            .subscribe((event) => {
                if (event instanceof NavigationEnd) {
                    this.setSelectedRoute(event.urlAfterRedirects);
                }
            });
        this._userContext = userAuthentication.appUser;
        this.menuConfig = this._kmcMainViews.createMenu();
        this.leftMenuConfig = this.menuConfig.filter((item: KMCAppMenuItem) => {
            return item.position === 'left';
        });
        this.rightMenuConfig = this.menuConfig.filter((item: KMCAppMenuItem) => {
            return item.position === 'right';
        });
        if (router.navigated) {
            this.setSelectedRoute(router.routerState.snapshot.url);
        }

        this._powerUser = this._browserService.getQueryParam('mode') === 'poweruser';
    }

    ngOnInit() {
    }

    setSelectedRoute(path) {
        if (this.menuConfig) {
            this.selectedMenuItem = this.menuConfig.find(item => item.isActiveView(path));
            this.showSubMenu = this.selectedMenuItem && this.selectedMenuItem.children && this.selectedMenuItem.children.length > 0;
        } else {
            this.selectedMenuItem = null;
            this.showSubMenu = false;
        }
    }

    openHelpLink(key) {
        let link = '';
        switch (key){
            case 'manual':
                link = serverConfig.externalLinks.kaltura.userManual;
                break;
            case 'kmcOverview':
                link = serverConfig.externalLinks.kaltura.kmcOverview;
                break;
            case 'mediaManagement':
                link = serverConfig.externalLinks.kaltura.mediaManagement;
                break;
        }
        if (link.length > 0) {
            this._browserService.openLink(link, {}, '_blank');
        }
        this._helpmenu.close();
    }

    openSupport() {
        this._browserService.openEmail(serverConfig.externalLinks.kaltura.support);
        this._helpmenu.close();
    }

    navigate(path):void{
        this.router.navigate([path]);
    }

    ngOnDestroy() {
    }
}
