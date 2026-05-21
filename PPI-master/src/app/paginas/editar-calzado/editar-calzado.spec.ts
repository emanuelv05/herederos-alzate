import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarCalzado } from './editar-calzado';

describe('EditarCalzado', () => {
  let component: EditarCalzado;
  let fixture: ComponentFixture<EditarCalzado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarCalzado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarCalzado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
