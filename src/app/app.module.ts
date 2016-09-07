import { NgModule, NgModuleFactoryLoader, enableProdMode } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { NG2_WEBSTORAGE } from 'ng2-webstorage';

import { KMCngCoreModule, AppStorage } from '@kaltura/kmcng-core';
import { KalturaApiModule } from '@kaltura/kaltura-api';

import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { AuthCanActivate } from './shared/@kmc/auth/auth-can-activate.service';
import { TimePipe } from './shared/@kmc/pipes/time.pipe';
import { KMCBrowserService } from './shared/@kmc/core/kmc-browser.service';
import { KMCShellAppModule } from './kmc-shell/kmc-shell.module';
import { ConfigCanActivate } from "./kmc-shell/shared/config-can-activate.service";


// depending on the env mode, enable prod mode or add debugging modules
if (process.env.ENV === 'build') {
  enableProdMode();
}

console.log(KMCngCoreModule);
console.log(KMCShellAppModule);

@NgModule({
  imports: <any>[ BrowserModule, HttpModule, routing, KMCngCoreModule, KalturaApiModule, KMCShellAppModule, RouterModule.forRoot([])],       // module dependencies
  declarations: <any>[ AppComponent ],   // components and directives
  bootstrap: <any>[ AppComponent ],     // root component
  providers: <any>[
    { provide : AppStorage,  useExisting : KMCBrowserService },
    ConfigCanActivate,
    KMCBrowserService,
    TimePipe,
    AuthCanActivate,
    NG2_WEBSTORAGE
  ]
})
export class AppModule { }
