import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopCart } from './shop-cart';

describe('ShopCart', () => {
  let component: ShopCart;
  let fixture: ComponentFixture<ShopCart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopCart],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopCart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
