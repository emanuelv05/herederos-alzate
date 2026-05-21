import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarProveedores } from './editar-proveedores';

describe('EditarProveedores', () => {
  let component: EditarProveedores;
  let fixture: ComponentFixture<EditarProveedores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarProveedores]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarProveedores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
