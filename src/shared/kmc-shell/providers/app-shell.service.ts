import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable()
export class AppShellService {

  constructor()
  {
    this._areaHeight$ = <ReplaySubject<number>>new ReplaySubject(1); // we are using here a replay subject with buffer of 1 so any new subsribers will get the last one.
  }

  private _areaHeight$ : ReplaySubject<number>;

  public getContentAreaHeight() : Observable<number>{
    return this._areaHeight$.asObservable(); // we proxy the subject by a function that returns its observable to prevent others from broadcasting on that subject.
  }

  public setContentAreaHeight(value : number) : void {
    this._areaHeight$.next(value);
  };
}
