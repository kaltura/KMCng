import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReachFrameComponent } from './reach-frame.component';
import { ReachComponent } from './reach.component';
import { KalturaUIModule } from '@kaltura-ng/kaltura-ui';
import { LocalizationModule } from '@kaltura-ng/mc-shared';

@NgModule({
    imports: [
        CommonModule,
        KalturaUIModule,
        LocalizationModule
    ],
    declarations: [
        ReachFrameComponent,
        ReachComponent
    ],
    providers: [],
    exports: [
        ReachFrameComponent,
        ReachComponent
    ]
})
export class ReachModule {
}
