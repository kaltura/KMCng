import { Component, ElementRef, OnDestroy, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AppAuthentication } from 'shared/kmc-shell/index';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { serverConfig } from 'config/server';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { BrowserService } from 'app-shared/kmc-shell';

@Component({
    selector: 'kAnalyticsFrame',
    template: '<iframe #analyticsFrame frameborder="0px" [src]="_url | safe"></iframe>',
    styles: [
        ':host { display: block; width: 100%; height: 100%; }',
        'iframe { width: 100%; height: 100%; transition: height 0.3s }'
    ],
    providers: [KalturaLogger.createLogger('AnalyticsFrameComponent')]
})
export class AnalyticsFrameComponent implements OnInit, OnDestroy {

    @ViewChild('analyticsFrame') analyticsFrame: ElementRef;
    public _windowEventListener = null;
    public _url = null;
    private initialized = false;
    private lastNav: string = '';

    constructor(private appAuthentication: AppAuthentication,
                private logger: KalturaLogger,
                private router: Router,
                private _browserService: BrowserService,
                private renderer: Renderer2
    ) {
        router.events
            .pipe(cancelOnDestroy(this))
            .subscribe((event) => {
                if (event instanceof NavigationEnd) {
                    if (this.initialized) {
                        this.sendMessageToAnalyticsApp({'messageType': 'navigate', data: { 'url': event.urlAfterRedirects }});
                    } else {
                        this.lastNav = event.urlAfterRedirects;
                    }
                }
            });
    }

    private sendMessageToAnalyticsApp(message: any): void{
        if (this.analyticsFrame && this.analyticsFrame.nativeElement.contentWindow && this.analyticsFrame.nativeElement.contentWindow.postMessage){
            this.analyticsFrame.nativeElement.contentWindow.postMessage(message, "*");
        }
    }

    private _updateUrl(): void {
        this._url = serverConfig.externalApps.analytics.uri;
    }

    ngOnInit() {
        // set analytics config
        const config = {
            kalturaServer: {
                uri : "lbd.kaltura.com" // serverConfig.kalturaServer.uri
            },
            cdnServers: serverConfig.cdnServers,
            liveAnalytics: serverConfig.externalApps.liveAnalytics,
            ks: this.appAuthentication.appUser.ks,
            pid: this.appAuthentication.appUser.partnerId,
            locale: "en"
        }

        try {
            this._updateUrl();
        } catch (ex) {
            this.logger.warn(`Could not load live real-time dashboard, please check that liveAnalytics configurations are loaded correctly\n error: ${ex}`);
            this._url = null;
            window['analyticsConfig'] = null;
        }

        this._windowEventListener = (e) => {
            let postMessageData;
            try {
                postMessageData = e.data;
            } catch (ex) {
                return;
            }

            if (postMessageData.messageType === 'analytics-init') {
                this.sendMessageToAnalyticsApp({'messageType': 'init', 'data': config });
            };
            if (postMessageData.messageType === 'analytics-init-complete') {
                this.initialized = true;
                this.sendMessageToAnalyticsApp({'messageType': 'navigate', 'data': { 'url': this.lastNav }});
                this.lastNav = '';
            };
            if (postMessageData.messageType === 'logout') {
                this.logout();
            };
            if (postMessageData.messageType === 'updateLayout') {
                this.updateLayout();
            };
        };
        this._addPostMessagesListener();
    }

    ngOnDestroy() {
        this._url = null;
        this._removePostMessagesListener();
    }

    private logout(): void {
        this.appAuthentication.logout();
    }

    private updateLayout(): void {
        if (this.analyticsFrame && this.analyticsFrame.nativeElement.contentWindow) {
            setTimeout(()=>{
                // use timeout to allow the report to render before checking the height
                let newHeight = this.analyticsFrame.nativeElement.contentWindow.document.getElementById('analyticsApp').getBoundingClientRect().height;
                if (this._browserService.isSafari()) {
                    // Safari can't seem to get the correct height here. Using doc height instead but not working perfectly. Need to revise if this logic stays.
                    const body = this.analyticsFrame.nativeElement.contentWindow.document.body;
                    const html = this.analyticsFrame.nativeElement.contentWindow.document.documentElement;
                    newHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                }
                this.renderer.setStyle(this.analyticsFrame.nativeElement, 'height', newHeight + 'px');
            },0);
        }
    }

    private _addPostMessagesListener() {
        this._removePostMessagesListener();
        window.addEventListener('message', this._windowEventListener);
    }

    private _removePostMessagesListener(): void {
        window.removeEventListener('message', this._windowEventListener);
    }

}
