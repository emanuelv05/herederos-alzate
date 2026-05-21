import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovimientoStock } from './movimiento-stock';

describe('MovimientoStock', () => {
  let component: MovimientoStock;
  let fixture: ComponentFixture<MovimientoStock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovimientoStock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovimientoStock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
