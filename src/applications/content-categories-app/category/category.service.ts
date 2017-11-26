import {CategoriesService} from './../categories/categories.service';
import {Host, Injectable, OnDestroy} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {AppLocalization} from '@kaltura-ng/kaltura-common';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {ISubscription} from 'rxjs/Subscription';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/subscribeOn';
import 'rxjs/add/operator/switchMap';

import {KalturaClient} from '@kaltura-ng/kaltura-client';
import {KalturaCategory} from 'kaltura-typescript-client/types/KalturaCategory';
import {KalturaMultiRequest, KalturaTypesFactory} from 'kaltura-typescript-client';
import {CategoryGetAction} from 'kaltura-typescript-client/types/CategoryGetAction';
import {CategoryUpdateAction} from 'kaltura-typescript-client/types/CategoryUpdateAction';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import {CategoryWidgetsManager} from './category-widgets-manager';
import {OnDataSavingReasons} from '@kaltura-ng/kaltura-ui';
import {BrowserService} from 'app-shared/kmc-shell/providers/browser.service';

export enum ActionTypes {
  CategoryLoading,
  CategoryLoaded,
  CategoryLoadingFailed,
  CategorySaving,
  CategoryPrepareSavingFailed,
  CategorySavingFailed,
  CategoryDataIsInvalid,
  ActiveSectionBusy
}

declare interface StatusArgs {
  action: ActionTypes;
  error?: Error;
}

@Injectable()
export class CategoryService implements OnDestroy {

  private _loadCategorySubscription: ISubscription;
  private _sectionToRouteMapping: { [key: number]: string } = {};
  private _state = new BehaviorSubject<StatusArgs>({action: ActionTypes.CategoryLoading, error: null});
  public state$ = this._state.asObservable();
  private _categoryIsDirty: boolean;

  public get categoryIsDirty(): boolean {
    return this._categoryIsDirty;
  }

  private _reloadCategoriesOnLeave = false;
  private _category: BehaviorSubject<KalturaCategory> = new BehaviorSubject<KalturaCategory>(null);
  public category$ = this._category.asObservable();
  private _categoryId: number;

  public get categoryId(): number {
    return this._categoryId;
  }

  public get category(): KalturaCategory {
    return this._category.getValue();
  }

  constructor(private _kalturaServerClient: KalturaClient,
              private _router: Router,
              private _browserService: BrowserService,
              private _categoriesStore: CategoriesService,
              @Host() private _widgetsManager: CategoryWidgetsManager,
              private _categoryRoute: ActivatedRoute,
              private _appLocalization: AppLocalization) {

    this._widgetsManager.categoryStore = this;

    this._mapSections();

    this._onSectionsStateChanges();
    this._onRouterEvents();
  }

  private _onSectionsStateChanges() {
    this._widgetsManager.widgetsState$
      .cancelOnDestroy(this)
      .debounce(() => Observable.timer(500))
      .subscribe(
        sectionsState => {
          const newDirtyState = Object.keys(sectionsState)
            .reduce((result, sectionName) =>
              result || sectionsState[sectionName].isDirty, false);

          if (this._categoryIsDirty !== newDirtyState) {
            console.log(`category store: update category is dirty state to ${newDirtyState}`);
            this._categoryIsDirty = newDirtyState;
            this._updatePageExitVerification();
          }
        }
      );
  }

  private _updatePageExitVerification() {
    if (this._categoryIsDirty) {
      this._browserService.enablePageExitVerification();
    } else {
      this._browserService.disablePageExitVerification();
    }
  }

  ngOnDestroy() {
    this._loadCategorySubscription && this._loadCategorySubscription.unsubscribe();
    this._state.complete();
    this._category.complete();

    this._browserService.disablePageExitVerification();

    if (this._reloadCategoriesOnLeave) {
      this._categoriesStore.reload(true);
    }
  }

  private _mapSections(): void {
    if (!this._categoryRoute || !this._categoryRoute.snapshot.data.categoryRoute) {
      throw new Error('this service can be injected from component that is associated to the category route');
    }

    this._categoryRoute.snapshot.routeConfig.children.forEach(childRoute => {
      const routeSectionType = childRoute.data ? childRoute.data.sectionKey : null;

      if (routeSectionType !== null) {
        this._sectionToRouteMapping[routeSectionType] = childRoute.path;
      }
    });
  }

  private _onRouterEvents(): void {
    this._router.events
      .cancelOnDestroy(this)
      .filter(event => event instanceof NavigationEnd)
      .subscribe(
        event => {
          const currentCategoryId = this._categoryRoute.snapshot.params.id;
          if (currentCategoryId !== this._categoryId) {
            if (currentCategoryId === 'new') {
              const newData = this._categoriesStore.getNewCategoryData();

              if (newData) {
                this._categoriesStore.clearNewCategoryData();
                this._categoryId = currentCategoryId;

                this._category.next(
                  new KalturaCategory({
                    parentId: newData.categoryParentId
                  })
                );

                setTimeout(() => {
                  const categoryLoadedResult = this._widgetsManager.notifyDataLoaded(this.category, {isNewData: true});
                  if (categoryLoadedResult.errors.length) {
                    this._state.next({
                      action: ActionTypes.CategoryLoadingFailed,
                      error: new Error('one of the widgets failed while handling data loaded event')
                    });
                  } else {
                    this._state.next({action: ActionTypes.CategoryLoaded});
                  }
                }, 0);
              } else {
                this.returnToCategories();
              }
            } else {
              // we must defer the loadCategory to the next event cycle loop to allow components
              // to init them-selves when entering this module directly.
              setTimeout(() => this._loadCategory(currentCategoryId), 0);
            }
          }
        });
  }

  private _transmitSaveRequest(newCategory: KalturaCategory) {
    this._state.next({action: ActionTypes.CategorySaving});

    const request = new KalturaMultiRequest(
      new CategoryUpdateAction({
        id: this.categoryId,
        category: newCategory
      })
    );

    this._widgetsManager.notifyDataSaving(newCategory, request, this.category)
      .cancelOnDestroy(this)
      .monitor('category store: prepare category for save')
      .tag('block-shell')
      .flatMap(
        (response) => {
          if (response.ready) {
            this._reloadCategoriesOnLeave = true;

            return this._kalturaServerClient.multiRequest(request)
              .monitor('category store: save category')
              .tag('block-shell')
              .map(
                response2 => {
                  if (response2.hasErrors()) {
                    this._state.next({action: ActionTypes.CategorySavingFailed});
                  } else {
                    this._loadCategory(this.categoryId);
                  }

                  return Observable.empty();
                }
              )
          } else {
            switch (response.reason) {
              case OnDataSavingReasons.validationErrors:
                this._state.next({action: ActionTypes.CategoryDataIsInvalid});
                break;
              case OnDataSavingReasons.attachedWidgetBusy:
                this._state.next({action: ActionTypes.ActiveSectionBusy});
                break;
              case OnDataSavingReasons.buildRequestFailure:
                this._state.next({action: ActionTypes.CategoryPrepareSavingFailed});
                break;
            }

            return Observable.empty();
          }
        }
      )
      .subscribe(
        response => {
          // do nothing - the service state is modified inside the map functions.
        },
        error => {
          // should not reach here, this is a fallback plan.
          this._state.next({action: ActionTypes.CategorySavingFailed});
        }
      );
  }

  public saveCategory(): void {

    const newCategory = KalturaTypesFactory.createObject(this.category);

    if (newCategory && newCategory instanceof KalturaCategory) {
      this._transmitSaveRequest(newCategory)
    } else {
      console.error(new Error(`Failed to create a new instance of the category type '${this.category ? typeof this.category : 'n/a'}`));
      this._state.next({action: ActionTypes.CategoryPrepareSavingFailed});
    }
  }

  public reloadCategory(): void {
    if (this.categoryId) {
      this._loadCategory(this.categoryId);
    }
  }

  private _loadCategory(id: number): void {
    if (this._loadCategorySubscription) {
      this._loadCategorySubscription.unsubscribe();
      this._loadCategorySubscription = null;
    }

    this._categoryId = id;
    this._categoryIsDirty = false;
    this._updatePageExitVerification();

    this._state.next({action: ActionTypes.CategoryLoading});
    this._widgetsManager.notifyDataLoading(id);

    if (!id) {
      return this._state.next({action: ActionTypes.CategoryLoadingFailed, error: new Error('Missing categoryId')});
    }

    this._loadCategorySubscription = this._kalturaServerClient
      .request(new CategoryGetAction({id}))
      .cancelOnDestroy(this)
      .subscribe(category => {
          this._loadCategorySubscription = null;
          this._category.next(category);
          const dataLoadedResult = this._widgetsManager.notifyDataLoaded(category, {isNewData: false});
          if (dataLoadedResult.errors.length) {
            this._state.next({
              action: ActionTypes.CategoryLoadingFailed,
              error: new Error(`one of the widgets failed while handling data loaded event`)
            });
          } else {
            this._state.next({action: ActionTypes.CategoryLoaded});
          }
        },
        error => {
          this._loadCategorySubscription = null;
          this._state.next({action: ActionTypes.CategoryLoadingFailed, error});
        }
      );
  }

  public openSection(sectionKey: string): void {
    const navigatePath = this._sectionToRouteMapping[sectionKey];

    if (navigatePath) {
      this._router.navigate([navigatePath], {relativeTo: this._categoryRoute});
    }
  }

  public openCategory(categoryId: number) {
    if (this.categoryId !== categoryId) {
      this.canLeaveWithoutSaving()
        .cancelOnDestroy(this)
        .subscribe(
          response => {
            if (response.allowed) {
              this._router.navigate(['category', categoryId], {relativeTo: this._categoryRoute.parent});
            }
          }
        );
    }
  }

  public canLeaveWithoutSaving(): Observable<{ allowed: boolean }> {
    return Observable.create(observer => {
      if (this._categoryIsDirty) {
        this._browserService.confirm(
          {
            header: this._appLocalization.get('applications.content.categoryDetails.cancelEdit'),
            message: this._appLocalization.get('applications.content.categoryDetails.discard'),
            accept: () => {
              observer.next({allowed: true});
              observer.complete();
            },
            reject: () => {
              observer.next({allowed: false});
              observer.complete();
            }
          }
        )
      } else {
        observer.next({allowed: true});
        observer.complete();
      }
    }).monitor('category store: check if can leave section without saving');
  }

  public returnToCategories() {
    this._router.navigate(['content/categories']);
  }
}

