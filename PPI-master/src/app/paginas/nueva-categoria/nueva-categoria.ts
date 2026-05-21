import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Tag, X } from 'lucide-angular';
import { CalzadoService } from '../../../app/nucleo/servicios/calzado.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-nueva-categoria',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './nueva-categoria.html',
  styleUrl: './nueva-categoria.css',
})
export class NuevaCategoria {
  @Output() close = new EventEmitter<void>();

  readonly Tag = Tag;
  readonly X = X;

  form = {
    codigo:           '',
    nombre_categoria: '',
    descripcion:      '',
    fecha_categoria:  new Date().toISOString().split('T')[0],
    activo:           true,
  };

  constructor(private calzadoService: CalzadoService) {}

  agregar() {
    const codigo = this.form.codigo.trim().toUpperCase();
    const nombre = this.form.nombre_categoria.trim();
    const descripcion = this.form.descripcion.trim();

    if (!codigo || !nombre || !descripcion) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa codigo, nombre y descripcion antes de guardar.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    if (!/^CAT\d{3}$/.test(codigo)) {
      Swal.fire({
        icon: 'error',
        title: 'Codigo invalido',
        text: 'El codigo debe tener el formato CAT seguido de 3 numeros. Ejemplo: CAT006.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    this.form.codigo = codigo;
    this.form.nombre_categoria = nombre;
    this.form.descripcion = descripcion;

    this.calzadoService.crearCategoria(this.form).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Categoria agregada',
          text: 'La categoria se guardo correctamente.',
          confirmButtonColor: '#0056b3',
          timer: 2000,
          showConfirmButton: false
        });
        this.close.emit();
      },
      error: (err) => {
        console.error('Error creando categoria:', err);
        let errorMessage = 'Hubo un problema al guardar la categoria.';

        if (err.error && typeof err.error === 'object') {
          const errors = [];
          for (const key in err.error) {
            if (Array.isArray(err.error[key])) {
              let msg = err.error[key][0];
              if (msg.includes('already exists') || msg.includes('ya existe')) {
                if (key === 'codigo') {
                  msg = 'Este codigo ya esta registrado.';
                } else if (key === 'nombre_categoria') {
                  msg = 'Este nombre de categoria ya esta registrado.';
                } else {
                  msg = 'Este valor ya esta en uso.';
                }
              }
              errors.push(`${key.toUpperCase()}: ${msg}`);
            }
          }
          if (errors.length > 0) {
            errorMessage = errors.join('\n');
          }
        }

        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar',
          text: errorMessage,
          confirmButtonColor: '#0056b3'
        });
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
