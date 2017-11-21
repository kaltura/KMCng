import { Pipe, PipeTransform } from '@angular/core';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { KalturaModerationFlagType } from 'kaltura-typescript-client/types/KalturaModerationFlagType';

@Pipe({name: 'kFlagType'})
export class FlagTypePipe implements PipeTransform {
	constructor(private appLocalization: AppLocalization) {
	}

	transform(value: string): string {
		let flagType: string = '';
		if (value) {
			switch (value.toString()) {
				case KalturaModerationFlagType.sexualContent.toString():
					flagType = this.appLocalization.get("applications.content.moderation.sexualContent");
					break;
				case KalturaModerationFlagType.harmfulDangerous.toString():
          flagType = this.appLocalization.get("applications.content.moderation.harmfulOrDangerousAct");
					break;
				case KalturaModerationFlagType.spamCommercials.toString():
          flagType = this.appLocalization.get("applications.content.moderation.spamOrCommercials");
					break;
				case KalturaModerationFlagType.violentRepulsive.toString():
          flagType = this.appLocalization.get("applications.content.moderation.violentOrRepulsive");
					break;
			}
		}
		return flagType;
	}
}
