import { ReachProfilesListComponent } from './reach-profiles-list/reach-profiles-list.component';
import { ReachProfilesListsHolderComponent } from './reach-profiles-lists-holder/reach-profiles-lists-holder.component';
import { ReachProfilesTableComponent } from './reach-profiles-table/reach-profiles-table.component';
import { ReachProfileCreditPipe } from './pipes/reach-profile-credit.pipe';
import { ReachServiceTypePipe } from './pipes/reach-service-type.pipe';
import { ReachServiceTatPipe } from './pipes/reach-service-tat.pipe';
import { ReachServiceSpeakerPipe } from './pipes/reach-service-speaker.pipe';
import { ReachProfilesTagsComponent } from './reach-profiles-tags/reach-profiles-tags.component';
import { ReachServicesTableComponent } from './reach-services-table/reach-services-table.component';
import { ReachServicesListComponent } from './reach-services-list/reach-services-list.component';
import {ServicesRefineFiltersComponent} from "./services-refine-filters/services-refine-filters.component";
import {ReachServicesTagsComponent} from "./reach-services-tags/reach-services-tags.component";

export const ReachProfilesComponentsList = [
  ReachProfilesListComponent,
  ReachProfilesListsHolderComponent,
  ReachProfilesTableComponent,
  ReachProfilesTagsComponent,
  ReachProfileCreditPipe,
  ReachServiceTypePipe,
  ReachServiceTatPipe,
  ReachServiceSpeakerPipe,
  ReachServicesTableComponent,
  ReachServicesListComponent,
  ServicesRefineFiltersComponent,
  ReachServicesTagsComponent
];
