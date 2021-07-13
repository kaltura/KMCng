import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AppAuthentication, AutomaticLoginErrorReasons, BrowserService, LoginError, LoginResponse } from 'app-shared/kmc-shell';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { serverConfig } from 'config/server';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { RestorePasswordViewService } from 'app-shared/kmc-shared/kmc-views/details-views/restore-password-view.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { AuthenticatorViewService } from "app-shared/kmc-shared/kmc-views/details-views";
import { KalturaAuthentication } from "kaltura-ngx-client";

export enum LoginScreens {
  Login,
  ForgotPassword,
  PasswordExpired,
  InvalidLoginHash,
  RestorePassword,
  RestorePasswordInvalidHash,
  Authenticator,
  Sso
}

@Component({
  selector: 'kKMCLogin',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  public _username: string;
  public _errorMessage: string = '';
  public _errorCode: string;
  public _inProgress = false;
  public _showLogin = false;
  public _showIEMessage = false;
  public _loginScreens = LoginScreens;
  public _currentScreen = LoginScreens.Login;
  public _passwordReset = false;
  public _signUpLinkExists = !!serverConfig.externalLinks.kaltura && !!serverConfig.externalLinks.kaltura.signUp;
  public _restorePasswordHash: string;
  public _passwordRestored = false;
  public _showAuthenticator = false;
  public _authenticationHash = '';
  public _qrCodeBase64 = null;

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
              private _renderer: Renderer2,
              private _route: ActivatedRoute,
              private _router: Router,
              private _restorePasswordView: RestorePasswordViewService,
              private _authenticatorView: AuthenticatorViewService) {
      this._prepare();
  }

  ngAfterViewInit() {
    this.onResize();
  }

    private _prepare(): void {
        const restorePasswordArgs = this._restorePasswordView.popOpenArgs();
        const authenticatorArgs = this._authenticatorView.popOpenArgs();
        const queryParams = this._route.snapshot.queryParams;
        if (restorePasswordArgs && restorePasswordArgs.hash) {
            this._validateRestorePasswordHash(restorePasswordArgs.hash);
        } else if (authenticatorArgs && authenticatorArgs.hash) {
            this._authenticationHash = authenticatorArgs.hash;
            this._currentScreen = LoginScreens.Authenticator;
        } else if (queryParams.method && queryParams.method === 'sso') {
            window.history.replaceState(null, null, window.location.pathname);
            this._currentScreen = LoginScreens.Sso;
        }
    }

    private _validateRestorePasswordHash(hash: string): void {
        this._appAuthentication.validateResetPasswordHash(hash)
            .pipe(tag('block-shell'))
            .pipe(cancelOnDestroy(this))
            .subscribe(
                (errorCode) => {
                    if (!errorCode) {
                        this._currentScreen = LoginScreens.RestorePassword;
                        this._restorePasswordHash = hash;
                    } else if (errorCode === 'RESET_URI_NOT_DEFINED') {
                        this._browserService.navigateToError();
                    } else {
                        this._currentScreen = LoginScreens.RestorePasswordInvalidHash;
                        this._errorCode = errorCode;
                    }
                },
                error => {
                    this._restorePasswordHash = hash;
                    this._browserService.confirm({
                        header: this._appLocalization.get('app.common.error'),
                        message: this._appLocalization.get('app.login.restorePassword.error.failedValidateHash', [error.message]),
                        accept: () => this._validateRestorePasswordHash(hash),
                        reject: () => this._setScreen(LoginScreens.Login)
                    });
                }
            );
    }

  private _makeLoginRequest(username: string, password: string, otp?: string): Observable<LoginResponse> {
    return this._appAuthentication.login(username, password, otp).pipe(cancelOnDestroy(this));
  }

  private _handleLoginResponse(success: boolean, error: LoginError, username: string): void {
    this._errorCode = '';
    this._errorMessage = '';

    if (success) {
        const defaultUrl = this._appAuthentication.defaultUrl;
        if (defaultUrl) {
            this._browserService.navigate(defaultUrl);
        } else {
            this._browserService.navigateToDefault();
        }

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

  public _login({ username, password, otp }: { username: string, password: string, otp: string }): void {
    this._errorMessage = '';
    this._inProgress = true;

    this._makeLoginRequest(username, password, otp).subscribe(
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
      .pipe(cancelOnDestroy(this))
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

  public _resetPassword({ password, newPassword, otp }: { password: string, newPassword: string, otp: string }): void {
    const payload = {
      password,
      newPassword,
      email: this._username,
      newEmail: '',
      otp
    };

    this._inProgress = true;

    this._appAuthentication.updatePassword(payload)
      .pipe(switchMap(({ email, password: userPassword }) => this._makeLoginRequest(email, userPassword)))
      .subscribe(
        ({ success, error }) => {
          this._inProgress = false;
          if (error && error.code === "MISSING_OTP") {
              this._showAuthenticator = true;
              this._browserService.alert({
                  header: this._appLocalization.get('app.common.attention'),
                  message: this._appLocalization.get('app.login.error.updatePasswordMissingOtp'),
                  accept: () => this._setScreen(LoginScreens.Login)
              });
          } else {
              this._handleLoginResponse(success, error, this._username);
          }
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

  public _restorePassword(payload: {newPassword: string, hashKey: string}): void {
    this._inProgress = true;
    this._errorMessage = '';
    this._appAuthentication.setInitalPassword(payload)
      .subscribe(
          (response: KalturaAuthentication) => {
          this._inProgress = false;
          this._passwordRestored = true;
          if (response.qrCode) {
              this._qrCodeBase64 = response.qrCode;
          }
        },
        err => {
          this._errorMessage = err.message;
          this._errorCode = err.code;
          this._inProgress = false;
        }
      );
  }

  public _returnToLogin(): void {
      if (this._qrCodeBase64 && this._qrCodeBase64.length) {
          this._currentScreen = this._loginScreens.Authenticator;
      } else {
          this._currentScreen = this._loginScreens.Login;
      }
  }

  public _onAuthContinue(): void {
      this._showAuthenticator = true;
      this._currentScreen = this._loginScreens.Login;
  }

  public _ssoLogin(email: string): void{
      this._inProgress = true;
      this._errorMessage = '';
      this._appAuthentication._ssoLogin(email).subscribe(
          redirectUrl => {
              this._browserService.openLink(redirectUrl.toString(), {}, '_self');
          },
          error => {
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
}
