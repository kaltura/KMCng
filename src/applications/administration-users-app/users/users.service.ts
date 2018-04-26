import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AppAuthentication, BrowserService } from 'app-shared/kmc-shell';
import { Observable } from 'rxjs/Observable';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { FormGroup } from '@angular/forms';
import { IsUserExistsStatuses } from './user-exists-statuses';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import { KalturaUser } from 'kaltura-ngx-client/api/types/KalturaUser';
import { KalturaUserRole } from 'kaltura-ngx-client/api/types/KalturaUserRole';
import { KalturaClient, KalturaMultiRequest } from 'kaltura-ngx-client';
import { UserRoleListAction } from 'kaltura-ngx-client/api/types/UserRoleListAction';
import { KalturaUserRoleFilter } from 'kaltura-ngx-client/api/types/KalturaUserRoleFilter';
import { KalturaUserRoleStatus } from 'kaltura-ngx-client/api/types/KalturaUserRoleStatus';
import { KalturaUserRoleOrderBy } from 'kaltura-ngx-client/api/types/KalturaUserRoleOrderBy';
import { UserListAction } from 'kaltura-ngx-client/api/types/UserListAction';
import { KalturaUserFilter } from 'kaltura-ngx-client/api/types/KalturaUserFilter';
import { KalturaNullableBoolean } from 'kaltura-ngx-client/api/types/KalturaNullableBoolean';
import { KalturaUserStatus } from 'kaltura-ngx-client/api/types/KalturaUserStatus';
import { KalturaUserOrderBy } from 'kaltura-ngx-client/api/types/KalturaUserOrderBy';
import { KalturaFilterPager } from 'kaltura-ngx-client/api/types/KalturaFilterPager';
import { PartnerGetInfoAction } from 'kaltura-ngx-client/api/types/PartnerGetInfoAction';
import { UserUpdateAction } from 'kaltura-ngx-client/api/types/UserUpdateAction';
import { UserDeleteAction } from 'kaltura-ngx-client/api/types/UserDeleteAction';
import { UserGetByLoginIdAction } from 'kaltura-ngx-client/api/types/UserGetByLoginIdAction';
import { UserGetAction } from 'kaltura-ngx-client/api/types/UserGetAction';
import { UserEnableLoginAction } from 'kaltura-ngx-client/api/types/UserEnableLoginAction';
import { UserAddAction } from 'kaltura-ngx-client/api/types/UserAddAction';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

export interface QueryData {
  pageIndex: number,
  pageSize: number
}

interface UsersData {
  users: { items: KalturaUser[], totalCount: number },
  roles: { items: KalturaUserRole[], totalCount: number },
  partnerInfo: { adminLoginUsersQuota: number, adminUserId: string }
}

@Injectable()
export class UsersStore implements OnDestroy {
  private _users = {
    data: new BehaviorSubject<UsersData>({
      users: { items: [], totalCount: 0 },
      roles: { items: [], totalCount: 0 },
      partnerInfo: { adminLoginUsersQuota: 0, adminUserId: null }
    }),
    state: new BehaviorSubject<{ loading?: boolean, error?: string }>({})
  };
  private _querySource = new BehaviorSubject<QueryData>({
    pageIndex: 1,
    pageSize: 25
  });

  private get _usersDataValue(): UsersData {
    return this._users.data.value;
  }

  public query$ = this._querySource.monitor('queryData update');
  public readonly users = { data$: this._users.data.asObservable(), state$: this._users.state.asObservable() };

  constructor(private _kalturaServerClient: KalturaClient,
              private _browserService: BrowserService,
              private _appLocalization: AppLocalization,
              private _logger: KalturaLogger,
              private _appAuthentication: AppAuthentication) {
      this._logger = _logger.subLogger('UsersStore');
    const defaultPageSize = this._browserService.getFromLocalStorage('users.list.pageSize');
    if (defaultPageSize !== null) {
      this._updateQueryData({
        pageSize: defaultPageSize
      });
    }
    this._loadData();
  }

  ngOnDestroy() {
    this._users.data.complete();
    this._users.state.complete();
    this._querySource.complete();
  }

  private _updateQueryData(partialData: Partial<QueryData>): void {
    const newQueryData = Object.assign({}, this._querySource.getValue(), partialData);
    this._querySource.next(newQueryData);

    if (partialData.pageSize) {
      this._browserService.setInLocalStorage('users.list.pageSize', partialData.pageSize);
    }
  }

  private _loadData(): void {
      this._logger.info(`handle load data request`);
    this._users.state.next({ loading: true, error: null });
    this._kalturaServerClient
      .multiRequest([
        new UserRoleListAction({
          filter: new KalturaUserRoleFilter({
            statusEqual: KalturaUserRoleStatus.active,
            orderBy: KalturaUserRoleOrderBy.idAsc.toString(),
            tagsMultiLikeOr: 'kmc'
          })
        }),
        new UserListAction({
          filter: new KalturaUserFilter({
            isAdminEqual: KalturaNullableBoolean.trueValue,
            loginEnabledEqual: KalturaNullableBoolean.trueValue,
            statusIn: KalturaUserStatus.active + ',' + KalturaUserStatus.blocked,
            orderBy: KalturaUserOrderBy.createdAtAsc.toString()
          }),
          pager: new KalturaFilterPager(this._querySource.value)
        }),
        new PartnerGetInfoAction()
      ])
      .cancelOnDestroy(this)
        .monitor('UsersStore: load users data')
      .subscribe(
        response => {
          if (!response.hasErrors()) {
            const [roles, users, partnerInfo] = response;
            this._users.data.next({
              users: {
                items: users.result.objects,
                totalCount: users.result.totalCount
              },
              roles: {
                items: roles.result.objects,
                totalCount: roles.result.totalCount
              },
              partnerInfo: {
                adminLoginUsersQuota: partnerInfo.result.adminLoginUsersQuota,
                adminUserId: partnerInfo.result.adminUserId
              }
            });
            this._users.state.next({ loading: false, error: null });
          } else {
              this._logger.warn(`handle failed loading of data`, () => {
                  return {
                      errorMessage: response
                          .map(res => res.error)
                          .filter(Boolean)
                          .reduce((acc, val) => `${acc}\n${val.message}`, '')
                  };
              });
            this._users.state.next({ loading: false, error: this._appLocalization.get('applications.administration.users.failedLoading') });
          }
        },
        (error) => {
            this._logger.warn(`handle failed loading of data`, { errorMessage: error.message });
          this._users.state.next({ loading: false, error: this._appLocalization.get('applications.administration.users.failedLoading') });
        }
      );
  }

  public toggleUserStatus(user: KalturaUser): Observable<void> {
    const isCurrentUser = this._appAuthentication.appUser.id === user.id;
    const isAdminUser = this._usersDataValue && this._usersDataValue.partnerInfo.adminUserId === user.id;

    if (isCurrentUser || isAdminUser) {
      return Observable.throw(new Error(this._appLocalization.get('applications.administration.users.cantPerform')));
    }

    const relevantUser = this._usersDataValue.users.items.find(item => user.id === item.id);
    const newStatus = Number(relevantUser && !relevantUser.status);

    return this._kalturaServerClient
      .request(
        new UserUpdateAction({
          userId: user.id,
          user: new KalturaUser({ status: newStatus })
        })
      )
        .monitor('UsersStore: toggle user status')
        .map(() => {
        return;
      });
  }

  public deleteUser(user: KalturaUser): Observable<void> {
    const isCurrentUser = this._appAuthentication.appUser.id === user.id;
    const isAdminUser = this._usersDataValue && this._usersDataValue.partnerInfo.adminUserId === user.id;

    if (isCurrentUser || isAdminUser) {
      return Observable.throw(new Error(this._appLocalization.get('applications.administration.users.cantPerform')));
    }

    return this._kalturaServerClient
      .request(new UserDeleteAction({ userId: user.id }))
        .monitor('UsersStore: delete user')
      .map(() => {
        return;
      });
  }

  public isUserAlreadyExists(email: string): Observable<IsUserExistsStatuses | null> {
    return this._kalturaServerClient
      .request(new UserGetByLoginIdAction({ loginId: email }))
        .monitor('UsersStore: is user already exists')
      .map(() => {
        return IsUserExistsStatuses.kmcUser;
      })
      .catch(error => {
        const status = error.code === 'LOGIN_DATA_NOT_FOUND'
          ? IsUserExistsStatuses.otherSystemUser :
          (error.code === 'USER_NOT_FOUND' ? IsUserExistsStatuses.unknownUser : null);
        return Observable.of(status);
      });
  }

  public isUserAssociated(userId: string): Observable<KalturaUser> {
    return this._kalturaServerClient
        .request(new UserGetAction({ userId }))
        .monitor('UsersStore: is user associated');
  }

  public addUser(userForm: FormGroup): Observable<void> {
    const { roleIds, id, email, firstName, lastName } = userForm.value;

    if (!email || !firstName || !lastName) {
      return Observable.throw(new Error(this._appLocalization.get('applications.administration.users.addUserError')));
    }

    const user = new KalturaUser({
      email,
      firstName,
      lastName,
      roleIds: roleIds || this._usersDataValue.roles.items[0].id,
      id: id || email,
      isAdmin: true,
      loginEnabled: true
    });

    const request = new KalturaMultiRequest(
      new UserAddAction({ user }),
      new UserEnableLoginAction({
        userId: user.id,
        loginId: user.email
      }).setDependency(['password', 0, 'password'])
    );

    return this._kalturaServerClient
      .multiRequest(request)
        .monitor('UsersStore: add user')
      .map((responses) => {
        if (responses.hasErrors()) {
          const errorMessage = responses.map(response => {
            if (response.error) {
              return response.error.message + '\n';
            }
          }).join('');
          throw Error(errorMessage);
        }
      });
  }

  public updateUser(userForm: FormGroup, userId: string): Observable<void> {
    const { roleIds, id, email } = userForm.getRawValue();

    if (!id && !email || !userId) {
      return Observable.throw(new Error(this._appLocalization.get('applications.administration.users.invalidUserId')));
    }

    const user = new KalturaUser({
      roleIds: roleIds ? roleIds : this._usersDataValue.roles.items[0].id,
      id: id || email
    });
    return this._kalturaServerClient
      .request(new UserUpdateAction({ userId, user }))
        .monitor('UsersStore: update user')
      .map(() => {
        return;
      });
  }

  public updateUserPermissions(user: KalturaUser, userForm: FormGroup): Observable<void> {
    const { roleIds } = userForm.value;
    const updatedUser = new KalturaUser({
      roleIds: roleIds ? roleIds : this._usersDataValue.roles.items[0].id,
      isAdmin: true
    });
    const request = new KalturaMultiRequest(
      new UserUpdateAction({ userId: user.id, user: updatedUser }),
      new UserEnableLoginAction({
        userId: user.id,
        loginId: user.email
      }).setDependency(['password', 0, 'password'])
    );
    return this._kalturaServerClient
      .multiRequest(request)
        .monitor('UsersStore: update user permissions')
      .map((responses) => {
        if (responses.hasErrors()) {
          const errorMessage = responses.map(response => {
            if (response.error) {
              return response.error.message + '\n';
            }
          }).join('');
          throw Error(errorMessage);
        }
      });
  }

  public reload(force: boolean): void;
  public reload(query: Partial<QueryData>): void;
  public reload(query: boolean | Partial<QueryData>): void {
      this._logger.info(`handle reload action by user`);
    const forceReload = (typeof query === 'object' || (typeof query === 'boolean' && query));
    if (forceReload || this._usersDataValue.users.totalCount === 0) {
      if (typeof query === 'object') {
        this._updateQueryData(query);
      }
      this._loadData();
    }
  }
}

