import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DressType } from './dress-type';

describe('DressType', () => {
  let component: DressType;
  let fixture: ComponentFixture<DressType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DressType],
    }).compileComponents();

    fixture = TestBed.createComponent(DressType);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
