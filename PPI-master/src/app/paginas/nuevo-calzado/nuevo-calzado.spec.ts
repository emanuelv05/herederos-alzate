import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevoCalzado } from './nuevo-calzado';

describe('NuevoCalzado', () => {
  let component: NuevoCalzado;
  let fixture: ComponentFixture<NuevoCalzado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevoCalzado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevoCalzado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
