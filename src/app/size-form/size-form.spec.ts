import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SizeForm } from './size-form';

describe('SizeForm', () => {
  let component: SizeForm;
  let fixture: ComponentFixture<SizeForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SizeForm],
    }).compileComponents();

    fixture = TestBed.createComponent(SizeForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
