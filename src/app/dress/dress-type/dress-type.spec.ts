import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DressTypeService } from './dress-type';

describe('DressType', () => {
  let component: DressTypeService;
  let fixture: ComponentFixture<DressTypeService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DressTypeService],
    }).compileComponents();

    fixture = TestBed.createComponent(DressTypeService);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
