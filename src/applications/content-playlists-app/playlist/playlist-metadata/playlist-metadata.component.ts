import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PlaylistMetadataWidget } from './playlist-metadata-widget.service';
import { Subject } from 'rxjs';
import { SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';
import { ISubscription } from 'rxjs/Subscription';

@Component({
  selector: 'kPlaylistMetadata',
  templateUrl: './playlist-metadata.component.html',
  styleUrls: ['./playlist-metadata.component.scss']
})

export class PlaylistMetadataComponent implements AfterViewInit, OnInit, OnDestroy {
  private _searchTagsSubscription: ISubscription;
  public _tagsProvider = new Subject<SuggestionsProviderData>();

  @ViewChild('metadataNameInput', { static: true }) public metadataNameInput;

  constructor(public _widgetService: PlaylistMetadataWidget) {
  }

  ngOnInit() {
    this._widgetService.attachForm();
  }

  ngOnDestroy() {
    this._widgetService.detachForm();
    this._tagsProvider.complete();

    if (this._searchTagsSubscription) {
      this._searchTagsSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.metadataNameInput.nativeElement.focus();
  }

  public _searchTags(event): void {
    this._tagsProvider.next({ suggestions: [], isLoading: true });

    if (this._searchTagsSubscription) {
      // abort previous request
      this._searchTagsSubscription.unsubscribe();
      this._searchTagsSubscription = null;
    }

    this._searchTagsSubscription = this._widgetService.searchTags(event.query).subscribe(data => {
        const suggestions = [];
        const entryTags = this._widgetService.metadataForm.value.tags || [];

        (data || []).forEach(suggestedTag => {
          const isSelectable = !entryTags.find(tag => {
            return tag === suggestedTag;
          });
          suggestions.push({ item: suggestedTag, isSelectable: isSelectable });
        });
        this._tagsProvider.next({ suggestions: suggestions, isLoading: false });
      },
      (err) => {
        this._tagsProvider.next({ suggestions: [], isLoading: false, errorMessage: <any>(err.message || err) });
      });
  }

  public _trimNameValue(): void {
    const name = (this._widgetService.metadataForm.controls['name'].value || '').trim();
    this._widgetService.metadataForm.controls['name'].setValue(name);
  }
}

