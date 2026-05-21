import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShoppingBag, X } from 'lucide-angular';
import { CalzadoService } from '../../../app/nucleo/servicios/calzado.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-nuevo-calzado',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './nuevo-calzado.html',
  styleUrl: './nuevo-calzado.css',
})
export class NuevoCalzado implements OnInit {
  @Output() close = new EventEmitter<void>();

  ShoppingBag = ShoppingBag;
  X = X;

  categorias: any[] = [];
  proveedores: any[] = [];
  modelosExistentes: any[] = [];
  modeloEncontrado: boolean = false;

  form = {
    codigo:       '',
    modelo:       '',
    talla:        '',
    color:        '',
    stock_actual: 0,
    fecha_calzado: new Date().toISOString().split('T')[0],
    id_categoria: 0,
    id_proveedor: 0,
    activo:       true,
  };

  constructor(private calzadoService: CalzadoService) {}

  ngOnInit() {
    this.calzadoService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        if (data.length > 0) this.form.id_categoria = data[0].id_categoria;
      },
      error: (err) => console.error('Error categorias:', err)
    });

    this.calzadoService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
        if (data.length > 0) this.form.id_proveedor = data[0].id_proveedor;
      },
      error: (err) => console.error('Error proveedores:', err)
    });

    this.calzadoService.getModelosCalzado().subscribe({
      next: (data) => this.modelosExistentes = data,
      error: (err) => console.error('Error modelos:', err)
    });
  }

  verificarCodigo() {
    if (!this.form.codigo) {
      this.modeloEncontrado = false;
      return;
    }
    const modelo = this.modelosExistentes.find(m => m.codigo.toLowerCase().trim() === this.form.codigo.toLowerCase().trim());
    if (modelo) {
      if (modelo.activo !== false) {
        this.form.modelo = modelo.nombre_modelo;
        this.form.id_categoria = modelo.id_categoria;
      } else {
        // Si el modelo está inactivo (eliminado), limpiamos los campos
        // para permitir ingresar nuevos datos y reciclar el código.
        this.form.modelo = '';
      }
      this.modeloEncontrado = true;
    } else {
      this.modeloEncontrado = false;
    }
  }

  agregar() {
    if (!this.form.codigo || !this.form.modelo || !this.form.talla || !this.form.color) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos obligatorios.',
        confirmButtonColor: '#0071bc'
      });
      return;
    }

    // Validar el formato del código (CAL seguido de 3 dígitos)
    const codigoUpper = this.form.codigo.toUpperCase();
    const codigoRegex = /^CAL\d{3}$/;
    if (!codigoRegex.test(codigoUpper)) {
      Swal.fire({
        icon: 'error',
        title: 'Código inválido',
        text: 'El código debe tener el formato CAL seguido de 3 números (ej. CAL001).',
        confirmButtonColor: '#0071bc'
      });
      return;
    }
    this.form.codigo = codigoUpper; // Guardar siempre en mayúscula

    if (this.modeloEncontrado) {
      const modelo = this.modelosExistentes.find(m => m.codigo.toLowerCase().trim() === this.form.codigo.toLowerCase().trim());
      if (modelo) {
        if (modelo.activo === false) {
          // Si el modelo estaba eliminado lógicamente (activo=false), lo reactivamos
          // usando los NUEVOS datos que el usuario acaba de ingresar en el formulario
          const updateData = {
            codigo: modelo.codigo,
            nombre_modelo: this.form.modelo, // Nuevos datos
            id_categoria: this.form.id_categoria, // Nuevos datos
            activo: true
          };
          this.calzadoService.updateModeloCalzado(modelo.id_modelo, updateData).subscribe({
            next: () => this.crearVariante(modelo.id_modelo),
            error: (err) => {
              console.error('Error reactivando modelo', err);
              this.crearVariante(modelo.id_modelo); // Intentamos crear la variante de todas formas
            }
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Código existente',
            text: `El código ${this.form.codigo} ya existe. ¿Deseas agregar esta nueva variante al modelo "${modelo.nombre_modelo}"?`,
            showCancelButton: true,
            confirmButtonColor: '#0071bc',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, agregar',
            cancelButtonText: 'Cancelar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.crearVariante(modelo.id_modelo);
            }
          });
        }
      }
      return;
    }

    const modeloData = {
      codigo: this.form.codigo,
      nombre_modelo: this.form.modelo,
      fecha_registro: this.form.fecha_calzado,
      id_categoria: this.form.id_categoria,
      activo: true
    };

    // Crear el modelo si es nuevo
    this.calzadoService.crearModeloCalzado(modeloData).subscribe({
      next: (modeloCreado) => {
        this.crearVariante(modeloCreado.id_modelo);
      },
      error: (err) => {
        let msg = 'Error al crear el modelo.';
        if (err.error && typeof err.error === 'object') {
          // Extraer mensajes de error de forma más amigable
          const errores = [];
          for (const key in err.error) {
            if (Array.isArray(err.error[key])) {
              errores.push(`${key}: ${err.error[key][0]}`);
            }
          }
          if (errores.length > 0) msg = errores.join('\n');
          else msg = 'Error de validación: revisa los datos.';
        } else if (err.status === 400) {
          msg = 'El código ya existe o hay datos inválidos.';
        }
        
        Swal.fire({
          icon: 'error',
          title: 'No se pudo crear',
          text: msg,
          confirmButtonColor: '#0071bc'
        });
        console.error('Error creando modelo:', err);
      }
    });
  }

  crearVariante(id_modelo: number) {
    const varianteData = {
      id_modelo: id_modelo,
      talla: this.form.talla,
      color: this.form.color,
      stock_actual: this.form.stock_actual,
      id_proveedor: this.form.id_proveedor,
      activo: true
    };
    
    this.calzadoService.crearVarianteCalzado(varianteData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Calzado agregado',
          text: 'Se ha guardado el calzado correctamente.',
          confirmButtonColor: '#0071bc',
          timer: 2000,
          showConfirmButton: false
        });
        this.close.emit();
      },
      error: (err) => {
        let msg = 'Error creando la variante.';
        if (err.error && err.error.non_field_errors) {
          if (err.error.non_field_errors[0].includes('unique set')) {
            msg = 'Ya existe este zapato con exactamente la misma Talla, Color y Proveedor.\n\nSi deseas aumentar el stock, hazlo desde la tabla principal (botón de editar).';
          } else {
            msg = err.error.non_field_errors[0];
          }
        } else if (err.error && typeof err.error === 'object') {
          // Formatear error genérico
          const errores = [];
          for (const key in err.error) {
            if (Array.isArray(err.error[key])) {
              errores.push(`${key}: ${err.error[key][0]}`);
            }
          }
          if (errores.length > 0) msg = errores.join('\n');
        }
        
        Swal.fire({
          icon: 'error',
          title: 'No se pudo agregar',
          text: msg,
          confirmButtonColor: '#0071bc'
        });
        console.error('Error creando variante:', err);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}