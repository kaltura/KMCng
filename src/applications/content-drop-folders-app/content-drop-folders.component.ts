import { Component } from '@angular/core';
import { DropFoldersStoreService } from './drop-folders-list/drop-folders-store.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

@Component({
  selector: 'kDropFolders',
  templateUrl: './content-drop-folders.component.html',
  styleUrls: ['./content-drop-folders.component.scss'],
  providers: [
    DropFoldersStoreService,
    KalturaLogger.createFactory('drop-folders-store.service')
  ]
})
export class ContentDropFoldersComponent {
}

