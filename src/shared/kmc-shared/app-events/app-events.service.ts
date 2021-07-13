import { Injectable } from '@angular/core'
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { AppEvent } from './app-event';

@Injectable()
export class AppEventsService {
    private events = { };

    constructor() { }

    public event<T extends AppEvent>(eventType: { new(...args): T }): Observable<T> {
        const eventName = new eventType().name;
        let event$ = this.events[eventName];
        if (!event$) {
            event$ = this.events[eventName] = new Subject<any>();
        }

        return event$.asObservable();
    }

    public publish(event: AppEvent) {
        const eventName = event.name;
        const event$ = this.events[eventName];
        if (event$) {
            event$.next(event);
        }
    }
}
