import { Observable, of as ObservableOf } from 'rxjs';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { Title } from '@angular/platform-browser';
import { ContextualHelpService } from 'app-shared/kmc-shared/contextual-help/contextual-help.service';
import { catchError, map } from 'rxjs/operators';


export interface DetailsViewMetadata {
    title: string;
    viewKey: string;
}

export abstract class KmcDetailsViewBaseService<TArgs extends {}> {

    private _lastArgsUsedByOpen: TArgs = null;

    protected constructor(protected _logger: KalturaLogger,
                          protected _browserService: BrowserService,
                          private _titleService: Title,
                          private _contextualHelpService: ContextualHelpService) {
    }

    protected abstract _open(args: TArgs): Observable<boolean>;

    abstract isAvailable(args: TArgs): boolean;

    abstract getViewMetadata(args: TArgs): DetailsViewMetadata;

    popOpenArgs(): TArgs | null {
        const result = this._lastArgsUsedByOpen;
        this._lastArgsUsedByOpen = null;
        return result;
    }

    open(args: TArgs): void {
        if (this.isAvailable(args)) {
            this._lastArgsUsedByOpen = args;
            this._open(args)
                .pipe(map(result => result === null ? true : result)) // treat navigation to save route as successful operation
                .subscribe(
                result => {
                    if (!result) {
                        this._logger.info('open view operation failed');
                        this._lastArgsUsedByOpen = null;
                    }

                }, error => {
                    this._logger.info('open view operation failed', { errorMessage: error ? error.message : '' });
                    this._lastArgsUsedByOpen = null;
                    this._browserService.handleUnpermittedAction(false);
                }
            );
        } else {
            this._logger.info('ignore open view operation request, view is not available');
            this._lastArgsUsedByOpen = null;
            this._browserService.handleUnpermittedAction(false);
        }
    }

    open$(args: TArgs): Observable<boolean> {
        if (this.isAvailable(args)) {
            this._lastArgsUsedByOpen = args;
            return this._open(args)
                .pipe(
                    map(result => result === null ? true : !!result),
                    catchError(error => {
                        this._logger.info('open view operation failed', { errorMessage: error ? error.message : '' });
                        this._lastArgsUsedByOpen = null;
                        return ObservableOf(false);
                    })
                );
        }

        return ObservableOf(false);
    }

    viewEntered(args: TArgs, redirectToDefault = true): boolean {
        this._logger.info('handle view entered');
        if (this.isAvailable(args)) {
            const metadata = this.getViewMetadata(args);
            const title = `KMC > ${metadata.title || ''}`;
            this._logger.info('update browser page title', { title });
            this._titleService.setTitle(title);
            this._contextualHelpService.updateHelpItems(metadata.viewKey);
            return true;
        } else {
            this._logger.warn('view is not available, handle unpermitted action');
            this._browserService.handleUnpermittedAction(redirectToDefault);
            return false;
        }
    }
}
