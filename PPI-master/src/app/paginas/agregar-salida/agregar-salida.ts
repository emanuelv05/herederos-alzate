import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Minus, X } from 'lucide-angular';
import { CalzadoService } from '../../nucleo/servicios/calzado.service';
import { AuthService } from '../../nucleo/servicios/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-salida',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './agregar-salida.html',
  styleUrl: './agregar-salida.css',
})
export class AgregarSalida implements OnInit {
  @Output() close = new EventEmitter<void>();

  readonly Minus = Minus;
  readonly X = X;

  calzados: any[] = [];

  form = {
    id_variante:      null as number | null,
    cantidad:         null as number | null,
    fecha_movimiento: '',
    descripcion:      '',
  };

  constructor(
    private calzadoService: CalzadoService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.calzadoService.getModelosCalzado().subscribe({
      next: (data: any[]) => {
        this.calzados = [];
        data.forEach(m => {
          if (m.variantes && m.variantes.length > 0) {
            m.variantes.forEach((v: any) => {
              if (v.activo) {
                this.calzados.push({
                  id_variante: v.id_variante,
                  stock_actual: v.stock_actual,
                  nombre: `${m.codigo} - ${m.nombre_modelo} | Talla: ${v.talla} | Color: ${v.color} | (Stock Actual: ${v.stock_actual})`
                });
              }
            });
          }
        });
      },
      error: (err) => console.error('Error cargando calzados:', err)
    });
  }

  guardar() {
    if (!this.form.id_variante || !this.form.cantidad || !this.form.fecha_movimiento || !this.form.descripcion || this.form.descripcion.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos obligatorios, incluyendo la descripción/observaciones.',
        confirmButtonColor: '#0071bc'
      });
      return;
    }

    if (this.form.cantidad <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: 'La cantidad debe ser mayor a 0.',
        confirmButtonColor: '#0071bc'
      });
      return;
    }

    const varianteSeleccionada = this.calzados.find(c => c.id_variante === this.form.id_variante);
    if (varianteSeleccionada && this.form.cantidad > varianteSeleccionada.stock_actual) {
      Swal.fire({
        icon: 'error',
        title: 'Stock insuficiente',
        text: `Estás intentando sacar ${this.form.cantidad} pares, pero solo hay ${varianteSeleccionada.stock_actual} en stock.`,
        confirmButtonColor: '#d33'
      });
      return;
    }

    const payload = {
      id_variante:      this.form.id_variante,
      cantidad:         this.form.cantidad,
      fecha_movimiento: this.form.fecha_movimiento,
      descripcion:      this.form.descripcion,
      id_usuario:       this.auth.getUsuario()?.id_usuario,
    };

    this.calzadoService.registrarSalida(payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Salida registrada!',
          text: 'El movimiento de salida se guardó correctamente.',
          timer: 2000,
          showConfirmButton: false
        });
        this.close.emit();
      },
      error: (err) => {
        console.error('Error registrando salida:', err);
        const msg = err.error?.error || 'No se pudo registrar la salida. Verifica los datos.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}