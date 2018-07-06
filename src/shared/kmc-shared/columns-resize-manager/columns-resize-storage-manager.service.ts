import { Inject, Injectable, InjectionToken } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { BrowserService } from 'app-shared/kmc-shell';

export interface ResizableColumns {
    [columnName: string]: string | number;
    lastViewPortWidth?: number;
}

export interface ResizableColumnsConfig {
    [tableName: string]: ResizableColumns;
}

@Injectable()
export class ColumnsResizeStorageManagerService {
    private readonly _windowWidthThreshold = 20;
    private _columnsConfig: ResizableColumnsConfig = {};
    private _tableName: string = null;

    private get _currentWindowWidth(): number {
        return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    }

    constructor(private _logger: KalturaLogger,
                private _browserService: BrowserService) {
        this._logger = _logger.subLogger('ColumnsResizeStorageManagerService');
    }

    private _getCacheToken(tableName: string = this._tableName): string {
        return tableName ? `resizable-columns.${tableName}` : null;
    }

    private _getConfigFromCache(tableName: string = this._tableName): ResizableColumns {
        const cacheToken = this._getCacheToken(tableName);
        this._logger.info(`load columns config from the local storage`, { cacheToken, tableName });
        if (cacheToken) {
            const config = this._browserService.getFromLocalStorage(cacheToken);
            try {
                this._columnsConfig[tableName] = JSON.parse(config) || { lastViewPortWidth: this._currentWindowWidth };
                return this._columnsConfig[tableName];
            } catch (e) {
                this._logger.warn(`couldn't load config from the local storage, return empty array`, { errorMessage: e.message });
                return { lastViewPortWidth: this._currentWindowWidth };
            }
        }

        return { lastViewPortWidth: this._currentWindowWidth };
    }

    private _setConfigInCache(config: ResizableColumns, tableName: string = this._tableName): void {
        this._logger.info(`set config in the local storage`, { tableName });
        const cacheToken = this._getCacheToken(tableName);
        if (cacheToken) {
            try {
                this._browserService.setInLocalStorage(cacheToken, JSON.stringify(config));
                this._columnsConfig[tableName] = Object.assign(this._columnsConfig[tableName], config);
            } catch (e) {
                this._logger.warn(`couldn't set updated config to the local storage, do nothing`, { errorMessage: e.message });
            }
        }
    }

    private _removeConfigFromCache(tableName: string = this._tableName): void {
        const cacheToken = this._getCacheToken(tableName);
        this._logger.info(`handle remove config from cache action`, { cacheToken, tableName });
        if (cacheToken) {
            try {
                this._browserService.removeFromLocalStorage(cacheToken);
            } catch (e) {
                this._logger.warn(`couldn't load config from the local storage, return empty array`, { errorMessage: e.message });
            }
        }
    }

    private _getConfig(tableName: string = this._tableName): ResizableColumns {
        if (!tableName) {
            return null;
        }

        if (this._columnsConfig.hasOwnProperty(tableName)) {
            return this._columnsConfig[tableName];
        }

        this._columnsConfig[tableName] = { lastViewPortWidth: this._currentWindowWidth };

        return this._columnsConfig[tableName];
    }

    private _updateNextSiblings(element: HTMLTableHeaderCellElement, config: ResizableColumns): void {
        if (element.nextElementSibling && element.nextElementSibling.id) {
            const { id: columnName, offsetWidth: columnWidth } = element;
            config[columnName] = `${columnWidth}px`;
            this._updateNextSiblings(<HTMLTableHeaderCellElement>element.nextElementSibling, config);
        }
    }

    private _updatePrevSiblings(element: HTMLTableHeaderCellElement, config: ResizableColumns): void {
        if (element.previousElementSibling && element.previousElementSibling.id) {
            const { id: columnName, offsetWidth: columnWidth } = element;
            config[columnName] = `${columnWidth}px`;
            this._updatePrevSiblings(<HTMLTableHeaderCellElement>element.previousElementSibling, config);
        }
    }

    public onColumnResize(event: { delta: number, element: HTMLTableHeaderCellElement }, tableName: string = this._tableName): void {
        this._logger.info(`handle column resize action by user`, {
            tableName: tableName,
            columnName: event && event.element ? event.element.id : null
        });
        const relevantConfig = this._getConfig(tableName);
        if (!relevantConfig) {
            this._logger.info(`no relevant config found, abort action`);
            return;
        }

        const { id: columnName, offsetWidth: columnWidth } = event.element;
        relevantConfig[columnName] = `${columnWidth}px`;

        this._updateNextSiblings(event.element, relevantConfig);
        this._updatePrevSiblings(event.element, relevantConfig);

        this._setConfigInCache(relevantConfig, tableName);
    }

    public onWindowResize(tableName: string = this._tableName): boolean {
        this._logger.info(`handle window resize action by user`, { tableName });
        const relevantConfig = this._getConfig();
        if (!relevantConfig) {
            this._logger.info(`no relevant config found, abort action`);
            return false;
        }

        const shouldClearCache = Math.abs(relevantConfig.lastViewPortWidth - this._currentWindowWidth) >= this._windowWidthThreshold;
        if (shouldClearCache) {
            this._removeConfigFromCache();
            delete this._columnsConfig[tableName];
            return true;
        }

        return false;
    }

    public getConfig(tableName: string = this._tableName): ResizableColumns {
        this._logger.info(`handle getConfig action by user`, { tableName });
        if (!tableName) {
            this._logger.info(`table name is not provided abort action`);
            return null;
        }

        return this._columnsConfig.hasOwnProperty(tableName)
            ? this._columnsConfig[tableName]
            : this._getConfigFromCache(tableName);
    }

    public registerTable(tableName: string): void {
        this._logger.info(`register table for saving columns size to LocalStorage`, { tableName });
        if (tableName) {
            this._tableName = tableName;
        } else {
            this._logger.info(`no table name provided, abort action`, { tableName });
        }
    }
}
