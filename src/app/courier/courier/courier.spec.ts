import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Courier } from './courier';

describe('Courier', () => {
  let component: Courier;
  let fixture: ComponentFixture<Courier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Courier],
    }).compileComponents();

    fixture = TestBed.createComponent(Courier);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
