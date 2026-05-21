import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Calzado } from './calzado';

describe('Calzado', () => {
  let component: Calzado;
  let fixture: ComponentFixture<Calzado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Calzado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Calzado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
