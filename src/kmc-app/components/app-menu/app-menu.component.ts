import {Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {AppAuthentication, BrowserService} from 'app-shared/kmc-shell';
import {buildBaseUri, serverConfig} from 'config/server';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui';
import {KmcLoggerConfigurator} from 'app-shared/kmc-shell/kmc-logs/kmc-logger-configurator';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {AnalyticsNewMainViewService, KMCAppMenuItem, KmcMainViewsService} from 'app-shared/kmc-shared/kmc-views';
import {ContextualHelpLink, ContextualHelpService} from 'app-shared/kmc-shared/contextual-help/contextual-help.service';
import {globalConfig} from 'config/global';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {AppEventsService} from 'app-shared/kmc-shared';
import {ResetMenuEvent, UpdateMenuEvent} from 'app-shared/kmc-shared/events';

@Component({
    selector: 'kKMCAppMenu',
    templateUrl: './app-menu.component.html',
    styleUrls: ['./app-menu.component.scss'],
    providers: [
        KalturaLogger.createLogger('AppMenuComponent')
    ]

})
export class AppMenuComponent implements OnInit, OnDestroy {

    @ViewChild('helpmenu', {static: true}) private _helpmenu: PopupWidgetComponent;
    @ViewChild('supportPopup', {static: true}) private _supportPopup: PopupWidgetComponent;
    @ViewChild('leftMenu', {static: true}) private leftMenu: ElementRef;
    private _appCachedVersionToken = 'kmc-cached-app-version';

    public _showChangelog = false;
    public _helpMenuOpened = false;
    public _powerUser = false;
    public _userManualLinkExists = !!serverConfig.externalLinks.kaltura && !!serverConfig.externalLinks.kaltura.userManual;
    public _kmcOverviewLinkExists = !!serverConfig.externalLinks.kaltura && !!serverConfig.externalLinks.kaltura.kmcOverview;
    public _mediaManagementLinkExists = !!serverConfig.externalLinks.kaltura && !!serverConfig.externalLinks.kaltura.mediaManagement;
    public _supportLinkExists = !!serverConfig.externalLinks.kaltura && !!serverConfig.externalLinks.kaltura.customerCare && !!serverConfig.externalLinks.kaltura.customerPortal;
    public _supportLegacyExists = false;
    public _contextualHelp: ContextualHelpLink[] = [];
    public menuID = 'kmc'; // used when switching menus to Analytics menu or future application menus
    public _isMultiAccount = false;

    menuConfig: KMCAppMenuItem[];
    leftMenuConfig: KMCAppMenuItem[];
    rightMenuConfig: KMCAppMenuItem[];
    selectedMenuItem: KMCAppMenuItem;
    showSubMenu = true;

    public _customerCareLink = this._supportLinkExists ? serverConfig.externalLinks.kaltura.customerCare : '';
    public _customerPortalLink = this._supportLinkExists ? serverConfig.externalLinks.kaltura.customerPortal : '';
    public userInitials: string;

    constructor(public _kmcLogs: KmcLoggerConfigurator,
                private _contextualHelpService: ContextualHelpService,
                public _userAuthentication: AppAuthentication,
                private _kmcMainViews: KmcMainViewsService,
                private router: Router,
                private renderer: Renderer2,
                private _appEvents: AppEventsService,
                private _browserService: BrowserService,
                private _analyticsNewMainViewService: AnalyticsNewMainViewService) {

        _contextualHelpService.contextualHelpData$
            .pipe(cancelOnDestroy(this))
            .subscribe(data => {
                this._contextualHelp = data;
            });

        router.events
            .pipe(cancelOnDestroy(this))
            .subscribe((event) => {
                if (event instanceof NavigationEnd) {
                    this.setSelectedRoute(event.urlAfterRedirects);
                }
            });
        this.menuConfig = this._kmcMainViews.getMenu();
        this._isMultiAccount = this._analyticsNewMainViewService.isMultiAccount();
        this.leftMenuConfig = this.menuConfig.filter((item: KMCAppMenuItem) => {
            return item.position === 'left';
        });
        this.rightMenuConfig = this.menuConfig.filter((item: KMCAppMenuItem) => {
            return item.position === 'right';
        });
        if (router.navigated) {
            this.setSelectedRoute(router.routerState.snapshot.url);
        }

        this._powerUser = this._browserService.getInitialQueryParam('mode') === 'poweruser';
        if (this._userAuthentication.appUser?.fullName) {
            this.userInitials = this._userAuthentication.appUser.fullName.toUpperCase().split(' ').slice(0, 2).map(s => s[0]).join('');
        }
    }

    ngOnInit() {
        const cachedVersion = this._browserService.getFromLocalStorage(this._appCachedVersionToken);
        this._showChangelog = cachedVersion !== globalConfig.client.appVersion;
        this._appEvents.event(UpdateMenuEvent)
            .pipe(cancelOnDestroy(this))
            .subscribe((event) => {
                if (event.position === 'left') {
                    this.replaceMenu(event.menuID, event.menu);
                }
            });

        this._appEvents.event(ResetMenuEvent)
            .pipe(cancelOnDestroy(this))
            .subscribe((event) => {
                const menu = this.menuConfig.filter((item: KMCAppMenuItem) => {
                    return item.position === 'left';
                });
                this.replaceMenu('kmc', menu);
            });

    }

    private replaceMenu(menuID: string, menu: KMCAppMenuItem[]): void {
        this.renderer.setStyle(this.leftMenu.nativeElement, 'opacity', 0);
        this.renderer.setStyle(this.leftMenu.nativeElement, 'marginLeft', '100px');
        setTimeout(() => {
            this.leftMenuConfig = menu;
            this.renderer.setStyle(this.leftMenu.nativeElement, 'opacity', 1);
            this.renderer.setStyle(this.leftMenu.nativeElement, 'marginLeft', '0px');
            this.setSelectedRoute(this.router.routerState.snapshot.url);
            this.menuID = menuID;
        }, 300);
    }

    setSelectedRoute(path) {
        if (this.menuConfig) {
            this.selectedMenuItem = this.leftMenuConfig.find(item => item.isActiveView(path));
            if (!this.selectedMenuItem) {
                this.selectedMenuItem = this.rightMenuConfig.find(item => item.isActiveView(path));
            }
            this.showSubMenu = this.selectedMenuItem && this.selectedMenuItem.children && this.selectedMenuItem.children.length > 0;
        } else {
            this.selectedMenuItem = null;
            this.showSubMenu = false;
        }
    }

    openHelpLink(key) {
        let link = '';
        switch (key) {
            case 'manual':
                link = serverConfig.externalLinks.kaltura.userManual;
                break;
            case 'kmcOverview':
                link = serverConfig.externalLinks.kaltura.kmcOverview;
                break;
            case 'mediaManagement':
                link = serverConfig.externalLinks.kaltura.mediaManagement;
                break;
            case 'legacy':
                link = buildBaseUri('/index.php/kmc');
                break;
        }
        if (link.length > 0) {
            this._browserService.openLink(link, {}, '_blank');
        }
        this._helpmenu.close();
    }

    openSupport() {
        this._supportPopup.open();
        this._helpmenu.close();
    }

    navigateToDefault() {
        this.router.navigateByUrl('/content/entries');
    }


    ngOnDestroy() {
    }

    public _changelogPopupOpened(): void {
        this._showChangelog = false;
        this._browserService.setInLocalStorage(this._appCachedVersionToken, globalConfig.client.appVersion);
    }
}
