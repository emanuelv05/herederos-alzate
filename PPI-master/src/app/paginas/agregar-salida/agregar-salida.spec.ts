import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarSalida } from './agregar-salida';

describe('AgregarSalida', () => {
  let component: AgregarSalida;
  let fixture: ComponentFixture<AgregarSalida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarSalida]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarSalida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
