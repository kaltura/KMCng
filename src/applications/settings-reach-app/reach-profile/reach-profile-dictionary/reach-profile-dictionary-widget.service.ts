import { Injectable } from '@angular/core';
import { ReachProfileWidget } from '../reach-profile-widget';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { SettingsReachProfileViewSections } from "app-shared/kmc-shared/kmc-views/details-views";
import { Observable } from "rxjs";
import { KalturaCatalogItemLanguage, KalturaDictionary, KalturaMultiRequest, KalturaReachProfile } from "kaltura-ngx-client";
import { of } from 'rxjs';

export interface Dictionary extends KalturaDictionary {
    words?: string[];
    isValid?: boolean;
    usedCharacters?: number;
}

@Injectable()
export class ReachProfileDictionaryWidget extends ReachProfileWidget {

    public _languages: { label: string, value: string }[] = [];
    public _dictionaries: Dictionary[] = [];
    public _maxCharacters = 4000;

    constructor(logger: KalturaLogger) {
        super(SettingsReachProfileViewSections.Dictionary, logger);
    }

    /**
     * Do some cleanups if needed once the section is removed
     */
    protected onReset(): void {

    }

    protected onActivate(firstTimeActivating: boolean): Observable<{ failed: boolean }> | void {
        // set Languages dropdown options
        this._languages = [];
        Object.keys(KalturaCatalogItemLanguage).forEach(key => {
            this._languages.push({label: KalturaCatalogItemLanguage[key], value: KalturaCatalogItemLanguage[key]});
        });

        // set dictionaries (clone objects)
        this._dictionaries = [];
        this.data.dictionaries.forEach((dictionary: KalturaDictionary) => {
            this._dictionaries.push(Object.assign({
                words: dictionary.data.split(String.fromCharCode(10)),
                usedCharacters: dictionary.data.split(String.fromCharCode(10)).join('').length,
                isValid: true
            }, dictionary));
        })
    }

    private validate(): boolean {
        let valid = true;
        this._dictionaries.forEach(dictionary => {
            if (!dictionary.isValid) {
                valid = false;
            }
        });
        return valid;
    }

    protected onValidate(wasActivated: boolean): Observable<{ isValid: boolean }> {
        return of({
            isValid: this.validate()
        });
    }

    protected onDataSaving(newData: KalturaReachProfile, request: KalturaMultiRequest): void {
        newData.dictionaries = [];
        this._dictionaries.forEach((dictionary: Dictionary) => {
            if (dictionary.words.length) {
                newData.dictionaries.push(new KalturaDictionary({
                    language: dictionary.language,
                    data: dictionary.words.join(String.fromCharCode(10))
                }));
            }
        });
    }

    public _onDataChange(index, data: string[] = null): void {
        if (data) {
            const numberOfCharacters = data.join('').length;
            this._dictionaries[index].usedCharacters = numberOfCharacters;
            this._dictionaries[index].isValid = numberOfCharacters <= this._maxCharacters;
        }
        super.updateState({
            isValid: data ? data.join('').length <= this._maxCharacters : true,
            isDirty: true
        });
    }

    public _addDictionary(): void {
        this._dictionaries.unshift({
            language: KalturaCatalogItemLanguage.en,
            data: '',
            words: [],
            isValid: true,
            usedCharacters: 0
        } as Dictionary);
    }

    public _deleteDictionary(index): void{
        this._dictionaries.splice(index, 1);
        super.updateState({
            isValid: this.validate(),
            isDirty: true
        });
    }
}
