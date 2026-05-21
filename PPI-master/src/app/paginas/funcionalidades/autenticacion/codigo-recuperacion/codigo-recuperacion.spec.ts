import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodigoRecuperacion } from './codigo-recuperacion';

describe('CodigoRecuperacion', () => {
  let component: CodigoRecuperacion;
  let fixture: ComponentFixture<CodigoRecuperacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodigoRecuperacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodigoRecuperacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
