import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { BaseEntryService } from '../../../shared/@kmc/kaltura-api/baseentry.service.ts';

@Component({
  selector: 'kmc-playlists',
  templateUrl: './playlists.component.html',
  styleUrls: ['./playlists.component.scss']
})
export class PlaylistsComponent implements OnInit {

  private playlists$: Observable<any>;
  private searchForm: FormGroup;
  private filter: any;
  private responseProfile: any;

  constructor(private baseEntryService: BaseEntryService, private formBuilder: FormBuilder) {
    this.searchForm = formBuilder.group({
      'search': ['', Validators.required]
    });
    this.filter = {
      'objectType': 'KalturaBaseEntryFilter',
      'typeEqual': '5'
    }
    this.responseProfile = {
      'objectType': 'KalturaDetachedResponseProfile',
      'type': '1',
      'fields': 'id,name,playlistType,createdAt'
    }
  }

  ngOnInit() {
    this.playlists$ = this.searchForm.controls['search'].valueChanges
      .startWith('')
      .debounceTime(500)
      .switchMap(value => this.baseEntryService.list(value, this.filter, this.responseProfile));
  }

  onActionSelected(action, entryID){
    alert('Selected Action: '+action+'\nPlaylist ID: '+entryID);
  }
}
