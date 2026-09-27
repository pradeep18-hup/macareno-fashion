import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikedProducts } from './liked-products';

describe('LikedProducts', () => {
  let component: LikedProducts;
  let fixture: ComponentFixture<LikedProducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikedProducts],
    }).compileComponents();

    fixture = TestBed.createComponent(LikedProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
