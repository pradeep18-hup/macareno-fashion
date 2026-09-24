import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductDettail } from './product-dettail';

describe('ProductDettail', () => {
  let component: ProductDettail;
  let fixture: ComponentFixture<ProductDettail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDettail],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDettail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
