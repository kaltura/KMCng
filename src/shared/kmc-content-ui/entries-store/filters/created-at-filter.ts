import * as moment from 'moment';
import {FilterRequestContext, FilterItem} from "../filter-item";

export class CreatedAtFilter  extends FilterItem{

    private _createdBefore : Date;
    private _createdAfter : Date;

    public get createdAfter() : Date{
        return this._createdAfter;
    }

    public get createdBefore() : Date{
        return this._createdBefore;
    }

    constructor(createdAfter? : Date, createdBefore? : Date)
    {
        let tooltip = '';
        if (createdAfter && createdBefore)
        {
            tooltip =`${moment(createdAfter).format('LL')} - ${moment(createdBefore).format('LL')}`;
        }else if (createdAfter)
        {
            tooltip =`After ${moment(createdAfter).format('LL')}`;
        }else if (createdBefore)
        {
            tooltip =`Before ${moment(createdBefore).format('LL')}`;
        }

        super('Dates', tooltip);
        this._createdAfter = createdAfter;
        this._createdBefore = createdBefore;
    }



    private toServerDate(value?: Date): number {
        return value ? value.getTime() / 1000 : null;
    }


    _buildRequest(request: FilterRequestContext): void {

        if (this.createdBefore) {
            request.filter.createdAtLessThanOrEqual = this.toServerDate(this.createdBefore);
        }

        if (this.createdAfter) {
            request.filter.createdAtGreaterThanOrEqual = this.toServerDate(this.createdAfter);
        }
    }
}
