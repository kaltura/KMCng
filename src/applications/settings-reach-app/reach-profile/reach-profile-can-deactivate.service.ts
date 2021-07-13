import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { ReachProfileComponent } from './reach-profile.component';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class ReachProfileCanDeactivate implements CanDeactivate<ReachProfileComponent> {
  canDeactivate(component: ReachProfileComponent): Observable<boolean> {
    return component.canLeave()
      .pipe(map(({ allowed }) => allowed))
      .pipe(catchError(() => of(false)));
  }
}
