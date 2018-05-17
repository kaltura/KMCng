import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { kmcAppConfig } from '../../kmc-app-config';

import { AppAuthentication,  AutomaticLoginErrorReasons,BrowserService, LoginError, LoginResponse } from 'app-shared/kmc-shell';
import { Observable } from 'rxjs/Observable';
import { serverConfig } from 'config/server';
import { AppLocalization } from '@kaltura-ng/kaltura-common/localization/app-localization.service';

export enum LoginScreens {
  Login,
  ForgotPassword,
  PasswordExpired,
  InvalidLoginHash
}

@Component({
  selector: 'kKMCLogin',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  public _username: string;
  public _errorMessage: string;
  public _errorCode: string;
  public _inProgress = false;
  public _showLogin = false;
  public _showIEMessage = false;
  public _loginScreens = LoginScreens;
  public _currentScreen = LoginScreens.Login;
  public _passwordReset = false;
  public _signUpLinkExists = !!serverConfig.externalLinks.kaltura && !!serverConfig.externalLinks.kaltura.signUp;

  // Caution: this is extremely dirty hack, don't do something similar to that
  @HostListener('window:resize')
  onResize() {
    const areaBlocker = <any>document.querySelector('k-area-blocker');
    const content = this._el.nativeElement.querySelector('.kLoginCenter');
    if (content) {
      const windowHeight = window.innerHeight;
      const height = windowHeight <= content.offsetHeight ? 'auto' : '100%';

      this._renderer.setStyle(areaBlocker, 'height', height);
    }
  }

  constructor(private _appAuthentication: AppAuthentication,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService,
              private _el: ElementRef,
              private _renderer: Renderer2) {
  }

  ngAfterViewInit() {
    this.onResize();
  }

  private _makeLoginRequest(username: string, password: string): Observable<LoginResponse> {
    return this._appAuthentication.login(username, password).cancelOnDestroy(this);
  }

  private _handleLoginResponse(success: boolean, error: LoginError, username: string): void {
    this._errorCode = '';
    this._errorMessage = '';

    if (success) {
      this._browserService.navigateToDefault();
      return;
    }

    this._errorCode = error.code;

    if (error.passwordExpired) {
        this._username = username;
        return this._setScreen(LoginScreens.PasswordExpired);
    } else if (error.closedForBeta) {
        this._errorMessage = this._appLocalization.get(error.message);
    } else if (!error.custom) {
        this._errorMessage = this._appLocalization.get(error.message);
    } else {
        this._errorMessage = error.message;
    }
    this._inProgress = false;
  }

    ngOnInit() {
        if (this._appAuthentication.isLogged()) {
            this._browserService.navigateToDefault();
        } else if (typeof document['documentMode'] !== 'undefined' && document['documentMode'] < 11) {
            this._showIEMessage = true;
        } else {
            this._showLogin = true;
            this._username = this._browserService.getFromLocalStorage('login.username');
            this._errorMessage = this._appAuthentication.automaticLoginErrorReason === AutomaticLoginErrorReasons.closedForBeta ? this._appLocalization.get('app.login.error.userForbiddenForBeta')
                : null;
        }
    }

  ngOnDestroy() {
    // for cancelOnDestroy
  }

  public _login({ username, password }: { username: string, password: string }): void {
    this._errorMessage = '';
    this._inProgress = true;

    this._makeLoginRequest(username, password).subscribe(
      ({ success, error }) => {
        this._handleLoginResponse(success, error, username);
      },
      (err) => {
        this._errorCode = err.code;
        this._errorMessage = err.message;
        this._inProgress = false;
      }
    );
  }

  public _rememberMe(username: string): void {
    if (username) {
      this._browserService.setInLocalStorage('login.username', username);
    } else {
      this._browserService.removeFromLocalStorage('login.username');
    }
  }

  public _setScreen(screen: LoginScreens): void {
    this.onResize();

    this._currentScreen = screen;

    this._inProgress = false;
    this._errorCode = '';
    this._errorMessage = '';

    if (screen !== LoginScreens.ForgotPassword) {
      this._passwordReset = false;
    }
  }

  public _forgotPassword(email: string): void {
    this._inProgress = true;

    this._appAuthentication.resetPassword(email)
      .cancelOnDestroy(this)
      .subscribe(
        () => {
          this._passwordReset = true;
          this._inProgress = false;
        },
        err => {
          this._errorMessage = err;
          this._inProgress = false;
        }
      );
  }

  public _resetPassword({ password, newPassword }: { password: string, newPassword: string }): void {
    const payload = {
      password,
      newPassword,
      email: this._username,
      newEmail: ''
    };

    this._inProgress = true;

    this._appAuthentication.updatePassword(payload)
      .switchMap(({ email, password: userPassword }) => this._makeLoginRequest(email, userPassword))
      .subscribe(
        ({ success, error }) => {
          this._inProgress = false;
          this._handleLoginResponse(success, error, this._username);
        },
        (error: LoginError) => {
          this._inProgress = false;
          this._errorCode = error.code;
          if (!error.custom) {
              this._errorMessage = this._appLocalization.get(error.message);
          } else {
            this._errorMessage = error.message;
          }
        }
      );
  }

  public _signUp(): void {
    this._browserService.openLink(serverConfig.externalLinks.kaltura.signUp, {}, '_self');
  }
}
