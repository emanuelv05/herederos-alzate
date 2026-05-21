import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarEntrada } from './agregar-entrada';

describe('AgregarEntrada', () => {
  let component: AgregarEntrada;
  let fixture: ComponentFixture<AgregarEntrada>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarEntrada]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarEntrada);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
