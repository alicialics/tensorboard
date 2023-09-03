/* Copyright 2022 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '../../testing/mat_icon_module';
import {By} from '@angular/platform-browser';
import {
  ColumnHeader,
  ColumnHeaderType,
  TableData,
  SortingInfo,
  SortingOrder,
  DiscreteFilter,
  IntervalFilter,
  DomainType,
} from './types';
import {DataTableComponent, Side} from './data_table_component';
import {DataTableModule} from './data_table_module';
import {HeaderCellComponent} from './header_cell_component';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ColumnSelectorComponent} from './column_selector_component';
import {ContentCellComponent} from './content_cell_component';
import {ColumnSelectorModule} from './column_selector_module';
import {CustomModalModule} from '../custom_modal/custom_modal_module';
import {FilterDialog} from './filter_dialog_component';

@Component({
  selector: 'testable-comp',
  template: `
    <tb-data-table
      #DataTable
      [headers]="headers"
      [sortingInfo]="sortingInfo"
      [selectableColumns]="selectableColumns"
      [columnFilters]="columnFilters"
      (sortDataBy)="sortDataBy($event)"
      (orderColumns)="orderColumns($event)"
      (addColumn)="addColumn.emit($event)"
      (removeColumn)="removeColumn.emit($event)"
    >
      <ng-container header>
        <ng-container *ngFor="let header of headers">
          <tb-data-table-header-cell
            [header]="header"
            [sortingInfo]="sortingInfo"
            [hparamsEnabled]="hparamsEnabled"
          ></tb-data-table-header-cell> </ng-container
      ></ng-container>
      <ng-container content>
        <ng-container *ngFor="let dataRow of data">
          <tb-data-table-content-row>
            <ng-container *ngFor="let header of headers">
              <tb-data-table-content-cell
                *ngIf="header.enabled"
                [header]="header"
                [datum]="dataRow[header.name]"
              ></tb-data-table-content-cell>
            </ng-container>
          </tb-data-table-content-row>
        </ng-container>
      </ng-container>
    </tb-data-table>
  `,
})
class TestableComponent {
  @ViewChild('DataTable')
  dataTable!: DataTableComponent;

  @Input() headers!: ColumnHeader[];
  @Input() data!: TableData[];
  @Input() sortingInfo!: SortingInfo;
  @Input() smoothingEnabled!: boolean;

  @Input() sortDataBy!: (sortingInfo: SortingInfo) => void;
  @Input() orderColumns!: (newOrder: ColumnHeaderType[]) => void;
  @Input() selectableColumns!: ColumnHeader[];
  @Input() columnFilters!: Map<string, DiscreteFilter | IntervalFilter>;

  @Output() addColumn = new EventEmitter<{
    header: ColumnHeader;
    index?: number;
  }>();
  @Output() removeColumn = new EventEmitter<ColumnHeader>();
}

describe('data table', () => {
  let sortDataBySpy: jasmine.Spy;
  let orderColumnsSpy: jasmine.Spy;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TestableComponent,
        DataTableComponent,
        HeaderCellComponent,
      ],
      imports: [
        MatIconTestingModule,
        DataTableModule,
        ColumnSelectorModule,
        CustomModalModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();
  });

  function createComponent(input: {
    headers?: ColumnHeader[];
    sortingInfo?: SortingInfo;
    hparamsEnabled?: boolean;
    data?: TableData[];
    potentialColumns?: ColumnHeader[];
    columnFilters?: Map<string, DiscreteFilter | IntervalFilter>;
  }): ComponentFixture<TestableComponent> {
    const fixture = TestBed.createComponent(TestableComponent);

    fixture.componentInstance.headers = input.headers || [];
    fixture.componentInstance.sortingInfo = input.sortingInfo || {
      name: 'run',
      order: SortingOrder.ASCENDING,
    };

    if (input.data) {
      fixture.componentInstance.data = input.data;
    }

    if (input.potentialColumns) {
      fixture.componentInstance.selectableColumns = input.potentialColumns;
    }

    fixture.componentInstance.columnFilters = input.columnFilters || new Map();

    sortDataBySpy = jasmine.createSpy();
    fixture.componentInstance.sortDataBy = sortDataBySpy;

    orderColumnsSpy = jasmine.createSpy();
    fixture.componentInstance.orderColumns = orderColumnsSpy;
    fixture.detectChanges();

    return fixture;
  }

  it('renders', () => {
    const fixture = createComponent({});
    fixture.detectChanges();
    const dataTable = fixture.debugElement.query(By.css('.data-table'));
    expect(dataTable).toBeTruthy();
  });

  it('emits sortDataBy event when header emits headerClicked event', () => {
    const fixture = createComponent({
      headers: [
        {
          type: ColumnHeaderType.VALUE,
          name: 'value',
          displayName: 'Value',
          enabled: true,
        },
        {
          type: ColumnHeaderType.RUN,
          name: 'run',
          displayName: 'Run',
          enabled: true,
        },
        {
          type: ColumnHeaderType.STEP,
          name: 'step',
          displayName: 'Step',
          enabled: true,
        },
        {
          type: ColumnHeaderType.RELATIVE_TIME,
          name: 'relativeTime',
          displayName: 'Relative',
          enabled: true,
        },
      ],
    });
    fixture.detectChanges();
    const headerElements = fixture.debugElement.queryAll(
      By.directive(HeaderCellComponent)
    );

    headerElements[3].componentInstance.headerClicked.emit('step');
    expect(sortDataBySpy).toHaveBeenCalledOnceWith({
      name: 'step',
      order: SortingOrder.ASCENDING,
    });
  });

  it('emits sortDataBy event with DESCENDING when header that is currently sorted emits headerClick event', () => {
    const fixture = createComponent({
      headers: [
        {
          type: ColumnHeaderType.VALUE,
          name: 'value',
          displayName: 'Value',
          enabled: true,
        },
        {
          type: ColumnHeaderType.RUN,
          name: 'run',
          displayName: 'Run',
          enabled: true,
        },
        {
          type: ColumnHeaderType.STEP,
          name: 'step',
          displayName: 'Step',
          enabled: true,
        },
        {
          type: ColumnHeaderType.RELATIVE_TIME,
          name: 'relativeTime',
          displayName: 'Relative',
          enabled: true,
        },
      ],
      sortingInfo: {
        name: 'step',
        order: SortingOrder.ASCENDING,
      },
    });
    fixture.detectChanges();
    const headerElements = fixture.debugElement.queryAll(
      By.directive(HeaderCellComponent)
    );

    headerElements[3].componentInstance.headerClicked.emit('step');
    expect(sortDataBySpy).toHaveBeenCalledOnceWith({
      name: 'step',
      order: SortingOrder.DESCENDING,
    });
  });

  it('keeps sorting arrow invisible unless sorting on that header', () => {
    const fixture = createComponent({
      headers: [
        {
          type: ColumnHeaderType.VALUE,
          name: 'value',
          displayName: 'Value',
          enabled: true,
          sortable: true,
        },
        {
          type: ColumnHeaderType.RUN,
          name: 'run',
          displayName: 'Run',
          enabled: true,
          sortable: true,
        },
        {
          type: ColumnHeaderType.STEP,
          name: 'step',
          displayName: 'Step',
          enabled: true,
          sortable: true,
        },
      ],
      sortingInfo: {
        name: 'value',
        order: SortingOrder.ASCENDING,
      },
    });
    fixture.detectChanges();
    const headerElements = fixture.debugElement.queryAll(
      By.directive(HeaderCellComponent)
    );

    expect(
      headerElements[0]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show')
    ).toBe(true);
    expect(
      headerElements[0]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.getAttribute('svgIcon')
    ).toBe('arrow_upward_24px');
    expect(
      headerElements[1]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show')
    ).toBe(false);
    expect(
      headerElements[1]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show-on-hover')
    ).toBe(true);
    expect(
      headerElements[2]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show')
    ).toBe(false);
    expect(
      headerElements[2]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show-on-hover')
    ).toBe(true);
  });

  it('shows downward arrow when order is DESCENDING', () => {
    const fixture = createComponent({
      headers: [
        {
          type: ColumnHeaderType.VALUE,
          name: 'value',
          displayName: 'Value',
          enabled: true,
          sortable: true,
        },
        {
          type: ColumnHeaderType.RUN,
          name: 'run',
          displayName: 'Run',
          enabled: true,
          sortable: true,
        },
        {
          type: ColumnHeaderType.STEP,
          name: 'step',
          displayName: 'Step',
          enabled: true,
          sortable: true,
        },
      ],
      sortingInfo: {
        name: 'step',
        order: SortingOrder.DESCENDING,
      },
    });
    fixture.detectChanges();
    const headerElements = fixture.debugElement.queryAll(
      By.directive(HeaderCellComponent)
    );

    expect(
      headerElements[0]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show')
    ).toBe(false);
    expect(
      headerElements[0]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show-on-hover')
    ).toBe(true);
    expect(
      headerElements[1]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show')
    ).toBe(false);
    expect(
      headerElements[1]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show-on-hover')
    ).toBe(true);
    expect(
      headerElements[2]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.classList.contains('show')
    ).toBe(true);
    expect(
      headerElements[2]
        .query(By.css('.sorting-icon-container mat-icon'))
        .nativeElement.getAttribute('svgIcon')
    ).toBe('arrow_downward_24px');
  });

  it('emits orderColumns with new order when dragged left', () => {
    const fixture = createComponent({
      headers: [
        {
          type: ColumnHeaderType.VALUE,
          name: 'value',
          displayName: 'Value',
          enabled: true,
        },
        {
          type: ColumnHeaderType.RUN,
          name: 'run',
          displayName: 'Run',
          enabled: true,
        },
        {
          type: ColumnHeaderType.STEP,
          name: 'step',
          displayName: 'Step',
          enabled: true,
        },
      ],
      sortingInfo: {
        name: 'step',
        order: SortingOrder.DESCENDING,
      },
    });
    fixture.detectChanges();
    const headerElements = fixture.debugElement.queryAll(
      By.directive(HeaderCellComponent)
    );

    headerElements[1].query(By.css('.cell')).triggerEventHandler('dragstart');
    headerElements[0].query(By.css('.cell')).triggerEventHandler('dragenter');
    fixture.detectChanges();
    expect(
      headerElements[0]
        .query(By.css('.cell'))
        .nativeElement.classList.contains('highlight')
    ).toBe(true);
    expect(
      headerElements[0]
        .query(By.css('.cell'))
        .nativeElement.classList.contains('highlight-border-left')
    ).toBe(true);
    headerElements[1].query(By.css('.cell')).triggerEventHandler('dragend');

    expect(orderColumnsSpy).toHaveBeenCalledOnceWith([
      {
        type: ColumnHeaderType.RUN,
        name: 'run',
        displayName: 'Run',
        enabled: true,
      },
      {
        type: ColumnHeaderType.VALUE,
        name: 'value',
        displayName: 'Value',
        enabled: true,
      },
      {
        type: ColumnHeaderType.STEP,
        name: 'step',
        displayName: 'Step',
        enabled: true,
      },
    ]);
  });

  it('emits orderColumns with new order when dragged right', () => {
    const fixture = createComponent({
      headers: [
        {
          type: ColumnHeaderType.VALUE,
          name: 'value',
          displayName: 'Value',
          enabled: true,
        },
        {
          type: ColumnHeaderType.RUN,
          name: 'run',
          displayName: 'Run',
          enabled: true,
        },
        {
          type: ColumnHeaderType.STEP,
          name: 'step',
          displayName: 'Step',
          enabled: true,
        },
      ],
      sortingInfo: {
        name: 'step',
        order: SortingOrder.DESCENDING,
      },
    });
    fixture.detectChanges();
    const headerElements = fixture.debugElement.queryAll(
      By.directive(HeaderCellComponent)
    );

    headerElements[1].query(By.css('.cell')).triggerEventHandler('dragstart');
    headerElements[2].query(By.css('.cell')).triggerEventHandler('dragenter');
    fixture.detectChanges();
    expect(
      headerElements[2]
        .query(By.css('.cell'))
        .nativeElement.classList.contains('highlight')
    ).toBe(true);
    expect(
      headerElements[2]
        .query(By.css('.cell'))
        .nativeElement.classList.contains('highlight-border-right')
    ).toBe(true);
    headerElements[1].query(By.css('.cell')).triggerEventHandler('dragend');

    expect(orderColumnsSpy).toHaveBeenCalledOnceWith([
      {
        type: ColumnHeaderType.VALUE,
        name: 'value',
        displayName: 'Value',
        enabled: true,
      },
      {
        type: ColumnHeaderType.STEP,
        name: 'step',
        displayName: 'Step',
        enabled: true,
      },
      {
        type: ColumnHeaderType.RUN,
        name: 'run',
        displayName: 'Run',
        enabled: true,
      },
    ]);
  });

  it('does not show add button when there are no selectable columns', () => {
    const fixture = createComponent({});
    expect(fixture.debugElement.query(By.css('.add-column-button'))).toBeNull();
  });

  it('renders column selector when + button is clicked', () => {
    const fixture = createComponent({
      potentialColumns: [
        {
          type: ColumnHeaderType.HPARAM,
          name: 'lr',
          displayName: 'learning rate',
          enabled: false,
        },
      ],
    });
    expect(
      fixture.debugElement.query(By.directive(ColumnSelectorComponent))
    ).toBeNull();
    const addBtn = fixture.debugElement.query(By.css('.add-column-btn'));
    addBtn.nativeElement.click();
    expect(
      fixture.debugElement.query(By.directive(ColumnSelectorComponent))
    ).toBeDefined();
  });

  describe('context menu', () => {
    let mockTableData: TableData[];
    let mockHeaders: ColumnHeader[];
    let mockPotentialColumns: ColumnHeader[];

    beforeEach(() => {
      mockHeaders = [
        {
          name: 'run',
          type: ColumnHeaderType.RUN,
          displayName: 'Run',
          enabled: true,
          movable: true,
          sortable: true,
        },
        {
          name: 'disabled_header',
          type: ColumnHeaderType.MAX_VALUE,
          displayName: 'disabled',
          enabled: false,
          removable: true,
          movable: true,
        },
        {
          name: 'other_header',
          type: ColumnHeaderType.HPARAM,
          displayName: 'Display This',
          enabled: true,
          removable: true,
          movable: true,
        },
        {
          name: 'another_hparam',
          type: ColumnHeaderType.HPARAM,
          displayName: 'Display This',
          enabled: true,
          removable: true,
          movable: false,
          filterable: true,
        },
        {
          name: 'some static column',
          type: ColumnHeaderType.HPARAM,
          displayName: 'cant touch this',
          enabled: true,
        },
      ];
      mockTableData = [
        {
          id: 'runid',
          run: 'run name',
          disabled_header: 'disabled header',
          other_header: 'other header',
        },
      ];
      mockPotentialColumns = [
        {
          type: ColumnHeaderType.HPARAM,
          name: 'lr',
          displayName: 'Learning Rate',
          enabled: false,
        },
      ];
    });
    it('renders context menu when a column cell is clicked', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
      });
      expect(fixture.debugElement.query(By.css('.context-menu'))).toBeNull();
      const cell = fixture.debugElement.query(
        By.directive(ContentCellComponent)
      );
      cell.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.css('.context-menu'))
      ).not.toBeNull();
    });

    it('renders context menu when a column header is clicked', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
      });
      expect(fixture.debugElement.query(By.css('.context-menu'))).toBeNull();
      const cell = fixture.debugElement.query(
        By.directive(HeaderCellComponent)
      );
      cell.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.css('.context-menu'))
      ).not.toBeNull();
    });

    it('renders column selector when add column to the left is clicked', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
      });
      const cell = fixture.debugElement.query(
        By.directive(ContentCellComponent)
      );
      cell.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
      fixture.detectChanges();

      fixture.debugElement
        .queryAll(By.css('.context-menu button'))
        .find((element) => element.nativeElement.innerHTML.includes('Left'))!
        .nativeElement.click();
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.directive(ColumnSelectorComponent))
      ).not.toBeNull();
      const dataTable = fixture.debugElement.query(
        By.directive(DataTableComponent)
      );
      expect(dataTable.componentInstance.insertColumnTo).toEqual(Side.LEFT);
      expect(dataTable.componentInstance.contextMenuHeader.name).toEqual('run');
    });

    it('renders column selector when add column to the right is clicked', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
      });
      const cell = fixture.debugElement.query(
        By.directive(ContentCellComponent)
      );
      cell.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
      fixture.detectChanges();

      fixture.debugElement
        .queryAll(By.css('.context-menu button'))
        .find((element) => element.nativeElement.innerHTML.includes('Right'))!
        .nativeElement.click();
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.directive(ColumnSelectorComponent))
      ).not.toBeNull();
      const dataTable = fixture.debugElement.query(
        By.directive(DataTableComponent)
      );
      expect(dataTable.componentInstance.insertColumnTo).toEqual(Side.RIGHT);
      expect(dataTable.componentInstance.contextMenuHeader.name).toEqual('run');
    });

    it('only shows the remove button when the column is removable', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
      });
      const cells = fixture.debugElement.queryAll(
        By.directive(ContentCellComponent)
      );

      expect(cells.length).toBe(4);

      cells.forEach((cell) => {
        cell.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
        fixture.detectChanges();

        const removeButton = fixture.debugElement
          .queryAll(By.css('.context-menu button'))
          .find((btn) => btn.nativeElement.innerHTML.includes('Remove'));

        if (cell.componentInstance.header.removable) {
          expect(removeButton).toBeDefined();
        } else {
          expect(removeButton).toBeUndefined();
        }
      });
    });

    it('removes column when Remove button is clicked', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
      });
      const cell = fixture.debugElement
        .queryAll(By.directive(ContentCellComponent))
        .find((cell) => cell.nativeElement.innerHTML.includes('other header'))!;
      cell.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
      fixture.detectChanges();

      spyOn(fixture.componentInstance.removeColumn, 'emit');
      fixture.debugElement
        .queryAll(By.css('.context-menu button'))
        .find((btn) => btn.nativeElement.innerHTML.includes('Remove'))!
        .nativeElement.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.removeColumn.emit).toHaveBeenCalled();
      expect(fixture.debugElement.query(By.css('.context-menu'))).toBeNull();
    });

    it('does not include add buttons when there are no selectable columns', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
      });
      const cell = fixture.debugElement
        .queryAll(By.directive(ContentCellComponent))
        .find((cell) => cell.nativeElement.innerHTML.includes('other header'))!;
      cell.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
      fixture.detectChanges();

      expect(
        fixture.debugElement
          .queryAll(By.css('.context-menu button'))
          .find((element) => element.nativeElement.innerHTML.includes('Left'))!
      ).toBeUndefined();

      expect(
        fixture.debugElement
          .queryAll(By.css('.context-menu button'))
          .find((element) => element.nativeElement.innerHTML.includes('Right'))!
      ).toBeUndefined();
    });

    it('only includes add buttons when header is movable', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
      });
      const cells = fixture.debugElement.queryAll(
        By.directive(ContentCellComponent)
      );

      expect(cells.length).toBe(4);

      cells.forEach((cell) => {
        cell.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
        fixture.detectChanges();

        const addLeft = fixture.debugElement
          .queryAll(By.css('.context-menu button'))
          .find((element) => element.nativeElement.innerHTML.includes('Left'))!;
        const addRight = fixture.debugElement
          .queryAll(By.css('.context-menu button'))
          .find((element) =>
            element.nativeElement.innerHTML.includes('Right')
          )!;

        if (cell.componentInstance.header.movable) {
          expect(addLeft).toBeDefined();
          expect(addRight).toBeDefined();
        } else {
          expect(addLeft).toBeUndefined();
          expect(addRight).toBeUndefined();
        }
      });
    });

    it('renders an upwards arrow when the sort direction is ascending', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
        sortingInfo: {
          name: 'run',
          order: SortingOrder.ASCENDING,
        },
      });
      const header = fixture.debugElement.query(
        By.directive(HeaderCellComponent)
      );
      header.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
      fixture.detectChanges();

      expect(
        fixture.debugElement
          .query(By.css('.context-menu-button.sort-button mat-icon'))
          .nativeElement.getAttribute('svgIcon')
      ).toBe('arrow_downward_24px');
    });

    it('renders a downwards arrow when the sort direction is descending', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
        sortingInfo: {
          name: 'run',
          order: SortingOrder.DESCENDING,
        },
      });
      const header = fixture.debugElement.query(
        By.directive(HeaderCellComponent)
      );
      header.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
      fixture.detectChanges();

      expect(
        fixture.debugElement
          .query(By.css('.context-menu-button.sort-button mat-icon'))
          .nativeElement.getAttribute('svgIcon')
      ).toBe('arrow_upward_24px');
    });

    it('displays a message when empty', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
      });
      const fixedHeader = fixture.debugElement.queryAll(
        By.directive(HeaderCellComponent)
      )[4];
      fixedHeader.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
      fixture.detectChanges();

      const contextMenu = fixture.debugElement.query(By.css('.context-menu'));
      expect(
        contextMenu.nativeElement.innerHTML.includes('No Actions Available')
      ).toBeTrue();
    });

    it('only shows the filter button when then column is filterable', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
      });
      const cells = fixture.debugElement.queryAll(
        By.directive(ContentCellComponent)
      );
      expect(cells.length).toBe(4);
      cells.forEach((cell) => {
        cell.nativeElement.dispatchEvent(new MouseEvent('contextmenu'));
        fixture.detectChanges();
        const fitlerbutton = fixture.debugElement
          .queryAll(By.css('.context-menu button'))
          .find((btn) => btn.nativeElement.innerHTML.includes('Filter'));
        if (cell.componentInstance.header.filterable) {
          expect(fitlerbutton).toBeDefined();
        } else {
          expect(fitlerbutton).toBeUndefined();
        }
      });
    });

    it('opens filter modal when the filter button is clicked', () => {
      const fixture = createComponent({
        headers: mockHeaders,
        data: mockTableData,
        potentialColumns: mockPotentialColumns,
        columnFilters: new Map([
          [
            'another_hparam',
            {
              type: DomainType.DISCRETE,
              includeUndefined: true,
              possibleValues: [1, 2, 3],
              filterValues: [1, 2, 3],
            },
          ],
        ]),
      });

      expect(
        fixture.debugElement.query(By.directive(FilterDialog))
      ).toBeFalsy();

      const filterableHeader = fixture.debugElement.queryAll(
        By.directive(HeaderCellComponent)
      )[3];
      filterableHeader.nativeElement.dispatchEvent(
        new MouseEvent('contextmenu')
      );
      fixture.detectChanges();

      const filterBtn = fixture.debugElement
        .queryAll(By.css('.context-menu button'))
        .find((btn) => btn.nativeElement.innerHTML.includes('Filter'))!;
      filterBtn.nativeElement.click();
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.directive(DataTableComponent))
          .componentInstance.filterColumn
      ).toBeTruthy();
      expect(
        fixture.debugElement.query(By.directive(FilterDialog))
      ).toBeTruthy();
    });
  });

  describe('column filtering', () => {
    let mockHeaders: ColumnHeader[];
    beforeEach(() => {
      mockHeaders = [
        {
          name: 'some_hparam',
          type: ColumnHeaderType.HPARAM,
          displayName: 'Display This',
          enabled: true,
          removable: true,
          movable: true,
          filterable: true,
        },
      ];
    });

    function openFilterDialog(fixture: ComponentFixture<TestableComponent>) {
      fixture.debugElement
        .query(By.directive(DataTableComponent))
        .componentInstance.openContextMenu(
          mockHeaders[0],
          new MouseEvent('contextmenu')
        );
      fixture.detectChanges();
      const filterBtn = fixture.debugElement
        .queryAll(By.css('.context-menu button'))
        .find((btn) => btn.nativeElement.innerHTML.includes('Filter'))!;
      filterBtn.nativeElement.click();
      fixture.detectChanges();

      return fixture.debugElement.query(By.directive(FilterDialog));
    }

    it('converts rangevalues to interval filter when an interval filter is changed', () => {
      const filter: IntervalFilter = {
        type: DomainType.INTERVAL,
        includeUndefined: true,
        minValue: 2,
        maxValue: 10,
        filterLowerValue: 3,
        filterUpperValue: 8,
      };
      const fixture = createComponent({
        headers: mockHeaders,
        columnFilters: new Map([['some_hparam', filter]]),
      });
      const addFilterSpy = spyOn(
        fixture.debugElement.query(By.directive(DataTableComponent))
          .componentInstance.addFilter,
        'emit'
      );
      const filterDialog = openFilterDialog(fixture);
      filterDialog.componentInstance.intervalFilterChanged.emit({
        lowerValue: 3,
        upperValue: 8,
      });

      expect(addFilterSpy).toHaveBeenCalledOnceWith({
        header: mockHeaders[0],
        value: {
          ...filter,
          filterLowerValue: 3,
          filterUpperValue: 8,
        },
      });
    });

    it('removes value from filter values when a discrete filter is toggled off', () => {
      const filter: DiscreteFilter = {
        type: DomainType.DISCRETE,
        includeUndefined: true,
        possibleValues: [2, 4, 6, 8],
        filterValues: [2, 4, 6, 8],
      };
      const fixture = createComponent({
        headers: mockHeaders,
        columnFilters: new Map([['some_hparam', filter]]),
      });
      const addFilterSpy = spyOn(
        fixture.debugElement.query(By.directive(DataTableComponent))
          .componentInstance.addFilter,
        'emit'
      );
      const filterDialog = openFilterDialog(fixture);
      filterDialog.componentInstance.discreteFilterChanged.emit(2);

      expect(addFilterSpy).toHaveBeenCalledOnceWith({
        header: mockHeaders[0],
        value: {
          ...filter,
          filterValues: [4, 6, 8],
        },
      });
    });

    it('adds value to filter values when a discrete filter is toggled on', () => {
      const filter: DiscreteFilter = {
        type: DomainType.DISCRETE,
        includeUndefined: true,
        possibleValues: [2, 4, 6, 8],
        filterValues: [2, 4],
      };
      const fixture = createComponent({
        headers: mockHeaders,
        columnFilters: new Map([['some_hparam', filter]]),
      });
      const addFilterSpy = spyOn(
        fixture.debugElement.query(By.directive(DataTableComponent))
          .componentInstance.addFilter,
        'emit'
      );
      const filterDialog = openFilterDialog(fixture);
      filterDialog.componentInstance.discreteFilterChanged.emit(6);

      expect(addFilterSpy).toHaveBeenCalledOnceWith({
        header: mockHeaders[0],
        value: {
          ...filter,
          filterValues: [2, 4, 6],
        },
      });
    });

    it('toggles includeUndefined when include undefined is toggled', () => {
      const filter: DiscreteFilter = {
        type: DomainType.DISCRETE,
        includeUndefined: true,
        possibleValues: [2, 4, 6, 8],
        filterValues: [2, 4, 6, 8],
      };
      const fixture = createComponent({
        headers: mockHeaders,
        columnFilters: new Map([['some_hparam', filter]]),
      });
      const addFilterSpy = spyOn(
        fixture.debugElement.query(By.directive(DataTableComponent))
          .componentInstance.addFilter,
        'emit'
      );
      const filterDialog = openFilterDialog(fixture);
      filterDialog.componentInstance.includeUndefinedToggled.emit();

      expect(addFilterSpy).toHaveBeenCalledOnceWith({
        header: mockHeaders[0],
        value: {
          ...filter,
          filterValues: [2, 4, 6, 8],
          includeUndefined: false,
        },
      });
    });
  });
});
