import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {KalturaUIModule} from '@kaltura-ng/kaltura-ui';
import {KeditHosterComponent} from 'app-shared/kmc-shared/kedit-hoster/kedit-hoster.component';
import { KEditHosterService } from 'app-shared/kmc-shared/kedit-hoster/kedit-hoster.service';

@NgModule({
  imports: <any[]>[
      CommonModule,
      KalturaUIModule
  ],
  declarations: <any[]>[
      KeditHosterComponent
  ],
  exports: <any[]>[KeditHosterComponent],
  providers: <any[]>[
    KEditHosterService
  ]
})
export class KEditHosterModule {
}
