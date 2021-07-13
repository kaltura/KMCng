import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { KalturaClient, KalturaMultiRequest, UserUpdateAction } from 'kaltura-ngx-client';
import { UserGetAction } from 'kaltura-ngx-client';
import { UserRoleGetAction } from 'kaltura-ngx-client';
import { UserUpdateLoginDataAction, UserUpdateLoginDataActionArgs } from 'kaltura-ngx-client';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { KalturaUser } from 'kaltura-ngx-client';
import { KalturaUserRole } from 'kaltura-ngx-client';
import { AppAuthentication } from 'app-shared/kmc-shell';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class SettingsMyUserSettingsService {

  constructor(private _kalturaServerClient: KalturaClient,
              private _appAuth: AppAuthentication,
              private _appLocalization: AppLocalization) {
  }

  public getUserData(): Observable<{ user: KalturaUser, role: KalturaUserRole }> {
    const request = new KalturaMultiRequest(
      new UserGetAction(),
      new UserRoleGetAction({ userRoleId: 0 })
        .setDependency(['userRoleId', 0, 'roleIds'])
    );

    return this._kalturaServerClient
      .multiRequest(request)
      .pipe(map(([user, role]) => {
        if (user.error || role.error) {
          throw new Error((user.error || role.error).message);
        }

        return {
          user: user.result,
          role: role.result
        };
      }))
      .pipe(catchError(() => {
        return throwError(new Error(this._appLocalization.get('applications.settings.myUserSettings.errors.getUserData')));
      }));
  }

  public updateEmail(user: KalturaUser): Observable<void> {
      return this._kalturaServerClient
          .request(new UserUpdateAction({ userId: user.id, user }))
          .pipe(
              catchError(error =>
                  throwError(new Error(this._appLocalization.get('applications.settings.myUserSettings.errors.updateUser')))
              ),
              map(() => {}),
          );
  }

  public updateLoginData(userData: UserUpdateLoginDataActionArgs): Observable<void> {
    return this._kalturaServerClient
      .request(new UserUpdateLoginDataAction(userData))
      .pipe(catchError(error => {
        let message = error && error.message
          ? error.code === 'PASSWORD_STRUCTURE_INVALID'
            ? this._appLocalization.get('applications.settings.myUserSettings.errors.passwordStructure')
            : this._appLocalization.get('applications.settings.myUserSettings.errors.passwordErr')
          : this._appLocalization.get('applications.settings.myUserSettings.errors.updateUser');
        if (error && error.code && error.code === "INVALID_OTP"){
            message = this._appLocalization.get('app.login.error.invalidOtp');
        }
        if (error && error.code && error.code === "MISSING_OTP"){
            message = this._appLocalization.get('app.login.error.missingOtp');
        }
        return throwError(new Error(message));
      }));
  }

  public updateUserNameManually(user: KalturaUser): void {
    if (user && user.firstName && user.lastName && user.fullName) {
      this._appAuth._updateNameManually(user.firstName, user.lastName, user.fullName);
    }
  }
}
