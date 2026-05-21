import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaCategoria } from './nueva-categoria';

describe('NuevaCategoria', () => {
  let component: NuevaCategoria;
  let fixture: ComponentFixture<NuevaCategoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaCategoria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaCategoria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
