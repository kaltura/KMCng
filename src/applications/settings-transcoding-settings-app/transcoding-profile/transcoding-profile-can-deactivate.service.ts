import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { TranscodingProfileComponent } from './transcoding-profile.component';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class TranscodingProfileCanDeactivate implements CanDeactivate<TranscodingProfileComponent> {
  canDeactivate(component: TranscodingProfileComponent): Observable<boolean> {
    return component.canLeave()
      .pipe(map(({ allowed }) => allowed))
      .pipe(catchError(() => of(false)));
  }
}
