import { NgModule, SkipSelf, Optional, ModuleWithProviders, Self } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { CheckboxModule, SharedModule } from 'primeng/primeng';

import { AppShellService } from "./providers/app-shell.service";
import { BrowserService } from "./providers/browser.service";
import { ReleaseNotesComponent } from './components/release-notes/release-notes.component';
import { ScrollToTopComponent } from './components/scroll-to-top/scroll-to-top.component';
import { EntryTypePipe } from 'app-shared/kmc-shell/pipes/entry-type.pipe';
import { PageExitVerificationService, UploadPageExitVerificationService } from 'app-shared/kmc-shell/page-exit-verification';

@NgModule({
    imports: <any[]>[
        CommonModule,
        FormsModule,
        CheckboxModule,
        SharedModule
    ],
    declarations: <any[]>[
        ReleaseNotesComponent,
        ScrollToTopComponent,
        EntryTypePipe
    ],
    exports: <any[]>[
        ReleaseNotesComponent,
        ScrollToTopComponent,
        EntryTypePipe
    ],
    providers: <any[]>[

    ]
})
export class KMCShellModule {
    constructor(@Optional() @Self()  _uploadPageExitVerificationService: UploadPageExitVerificationService)
    {
        if (_uploadPageExitVerificationService) {
            _uploadPageExitVerificationService.init();
        }
    }

    static forRoot(): ModuleWithProviders {
        return {
            ngModule: KMCShellModule,
            providers: <any[]>[
                BrowserService,
                AppShellService,
                PageExitVerificationService,
                UploadPageExitVerificationService
            ]
        };
    }
}
