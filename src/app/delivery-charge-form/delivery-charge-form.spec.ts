import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryChargeForm } from './delivery-charge-form';

describe('DeliveryChargeForm', () => {
  let component: DeliveryChargeForm;
  let fixture: ComponentFixture<DeliveryChargeForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryChargeForm],
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryChargeForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
