import { Injectable } from '@angular/core'
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AppAuthentication } from "./app-authentication.service";
import { BoostrappingStatus, AppBootstrap } from './app-bootstrap.service';
import { BrowserService } from '../providers/browser.service';
import { of } from 'rxjs';

@Injectable()
export class AuthCanActivate implements CanActivate {
    constructor(private appAuthentication : AppAuthentication, private appBootstrap: AppBootstrap, private _browserService: BrowserService) {}
    canActivate(route: ActivatedRouteSnapshot,  state: RouterStateSnapshot):Observable<boolean> {

        if (this.appAuthentication.isLogged())
        {
            return of(true);
        }

        return Observable.create((observer : any) =>
        {
           const statusChangeSubscription = this.appBootstrap.bootstrapStatus$.subscribe(
                (status : BoostrappingStatus) => {
                    if (status === BoostrappingStatus.Bootstrapped) {
                        this.appAuthentication.loginAutomatically(state.url)
                            .subscribe(result => {
                                observer.next(result);
                                observer.complete();

                                if (statusChangeSubscription) {
                                    statusChangeSubscription.unsubscribe();
                                }

                                if (!result) {
                                    this._browserService.navigateToLogin();
                                }
                            });
                    } else {
                        if (status === BoostrappingStatus.Error) {
                            observer.next(false);
                            observer.complete();
                            if (statusChangeSubscription) statusChangeSubscription.unsubscribe();
                            this._browserService.navigateToError();
                        }
                    }
                },
                () => {
                    // error with configuration
                    observer.next(false);
                    observer.complete();
                    if (statusChangeSubscription) statusChangeSubscription.unsubscribe();
                    this._browserService.navigateToError();
                }
            );
        });
    }
}
