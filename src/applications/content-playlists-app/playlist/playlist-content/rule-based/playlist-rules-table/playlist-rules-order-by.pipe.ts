import { Pipe, PipeTransform } from '@angular/core';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { KalturaPlayableEntryOrderBy } from 'kaltura-ngx-client/api/types/KalturaPlayableEntryOrderBy';
import { PlaylistRule } from 'app-shared/content-shared/playlist-rule.interface';

@Pipe({ name: 'playlistRuleOrderBy' })
export class PlaylistOrderByPipe implements PipeTransform {
  constructor(private _appLocalization: AppLocalization) {
  }

  transform(rule: PlaylistRule = null): string {
    switch (true) {
      case KalturaPlayableEntryOrderBy.playsDesc.equals(rule.orderBy):
        return this._appLocalization.get('applications.content.playlistDetails.content.orderBy.mostPlayed');

      case KalturaPlayableEntryOrderBy.recentDesc.equals(rule.orderBy):
        return this._appLocalization.get('applications.content.playlistDetails.content.orderBy.mostRecent');

      case KalturaPlayableEntryOrderBy.rankDesc.equals(rule.orderBy):
        return this._appLocalization.get('applications.content.playlistDetails.content.orderBy.highestRated');

      case KalturaPlayableEntryOrderBy.nameAsc.equals(rule.orderBy):
        return this._appLocalization.get('applications.content.playlistDetails.content.orderBy.entryName');

      default:
        return '';
    }
  }
}
