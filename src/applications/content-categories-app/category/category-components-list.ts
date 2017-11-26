import {LinkedEntriesPopup} from './category-entry-selector/linked-entries-popup.component';
import {LinkedEntries} from '././category-entry-selector/linked-entries.component';
import {JumpToSection} from './category-metadata/jump-to-section.component';
import {CategoryDetailsComponent} from './category-details/category-details.component';
import {CategorySectionsListComponent} from './category-sections-list/category-sections-list.component';
import {CategorySubcategoriesComponent} from './category-subcategories/category-subcategories.component';
import {CategoryMetadataComponent} from './category-metadata/category-metadata.component';
import {CategoryEntitlementsComponent} from './category-entitlements/category-entitlements.component';
import {CategoryComponent} from './category.component';
import {CategorySubcategoriesTableComponent} from './category-subcategories/category-subcategories-table/category-subcategories-table.component';
import {BulkOperationsComponent} from './category-subcategories/bulk-operations/bulk-operations.component';
import {NewSubcategoryComponent} from './category-subcategories/new-category/new-subcategory.component';

export const CategoryComponentsList = [
    CategoryComponent,
    CategoryEntitlementsComponent,
    CategoryMetadataComponent,
    CategorySubcategoriesComponent,
    NewSubcategoryComponent,
    BulkOperationsComponent,
    CategorySubcategoriesTableComponent,
    CategorySectionsListComponent,
    CategoryDetailsComponent,
    JumpToSection,
    LinkedEntriesPopup,
    LinkedEntries
];
