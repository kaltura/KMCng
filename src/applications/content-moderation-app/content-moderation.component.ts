import { Component } from '@angular/core';
import { EntriesStore } from 'app-shared/content-shared/entries-store/entries-store.service';

@Component({
    selector: 'kModeration',
    templateUrl: './content-moderation.component.html',
    styleUrls: ['./content-moderation.component.scss'],
    providers : [EntriesStore]
})
export class ContentModerationComponent  {}

