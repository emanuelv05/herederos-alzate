import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarEmpleado } from './registrar-empleado';

describe('RegistrarEmpleado', () => {
  let component: RegistrarEmpleado;
  let fixture: ComponentFixture<RegistrarEmpleado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarEmpleado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarEmpleado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
