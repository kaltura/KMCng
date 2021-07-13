import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { ISubscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs';

import { KalturaClient } from 'kaltura-ngx-client';
import { TagSearchAction } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaTagFilter } from 'kaltura-ngx-client';
import { KalturaTaggedObjectType } from 'kaltura-ngx-client';
import { SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { PopupWidgetComponent, PopupWidgetStates } from '@kaltura-ng/kaltura-ui';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'kBulkAddTags',
  templateUrl: './bulk-add-tags.component.html',
  styleUrls: ['./bulk-add-tags.component.scss']
})
export class BulkAddTags implements OnInit, OnDestroy, AfterViewInit {

  @Input() parentPopupWidget: PopupWidgetComponent;
  @Output() addTagsChanged = new EventEmitter<string[]>();

  public _loading = false;
  public _sectionBlockerMessage: AreaBlockerMessage;

  public _tagsProvider = new Subject<SuggestionsProviderData>();
  public tags: string[] = [];

  private _searchTagsSubscription : ISubscription;
  private _parentPopupStateChangeSubscribe : ISubscription;
  private _confirmClose: boolean = true;

  constructor(private _kalturaServerClient: KalturaClient, private _appLocalization: AppLocalization, private _browserService: BrowserService) {
  }

  ngOnInit() {
    this.tags = [];
  }

  ngAfterViewInit(){
    if (this.parentPopupWidget) {
      this._parentPopupStateChangeSubscribe = this.parentPopupWidget.state$
        .subscribe(event => {
          if (event.state === PopupWidgetStates.Open) {
            this._confirmClose = true;
          }
          if (event.state === PopupWidgetStates.BeforeClose) {
            if (event.context && event.context.allowClose){
              if (this.tags.length && this._confirmClose){
                event.context.allowClose = false;
                this._browserService.confirm(
                  {
                    header: this._appLocalization.get('applications.content.entryDetails.captions.cancelEdit'),
                    message: this._appLocalization.get('applications.content.entryDetails.captions.discard'),
                    accept: () => {
                      this._confirmClose = false;
                      this.parentPopupWidget.close();
                    }
                  }
                );
              }
            }
          }
        });
    }
  }

  ngOnDestroy(){
    this._parentPopupStateChangeSubscribe.unsubscribe();
  }

  _searchTags(event) : void {
    this._tagsProvider.next({ suggestions : [], isLoading : true});

    if (this._searchTagsSubscription)
    {
      // abort previous request
      this._searchTagsSubscription.unsubscribe();
      this._searchTagsSubscription = null;
    }

    const requestSubscription = this._kalturaServerClient.request(
      new TagSearchAction(
        {
          tagFilter: new KalturaTagFilter(
            {
              tagStartsWith : event.query,
              objectTypeEqual : KalturaTaggedObjectType.entry
            }
          ),
          pager: new KalturaFilterPager({
            pageIndex : 0,
            pageSize : 30
          })
        }
      )
    )
      .pipe(cancelOnDestroy(this))
      .subscribe(
        result =>
        {
          const suggestions = [];
          const tags = result.objects.map(item => item.tag);
          (tags || []).forEach(suggestedTag => {
            const isSelectable = (this.tags || []).indexOf(suggestedTag) === -1;
            suggestions.push({ item: suggestedTag, isSelectable: isSelectable});
          });
          this._tagsProvider.next({suggestions: suggestions, isLoading: false});
        },
        err =>
        {
          this._tagsProvider.next({ suggestions : [], isLoading : false, errorMessage : <any>(err.message || err)});
        }
      );

  }

  public _apply(){
    this.addTagsChanged.emit(this.tags);
    this._confirmClose = false;
    this.parentPopupWidget.close();
  }
}

