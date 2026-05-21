import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Trash2, Pencil, Package } from 'lucide-angular';
import { CalzadoService } from '../../nucleo/servicios/calzado.service';
import Swal from 'sweetalert2';

// ...existing code...

type Status = 'En Stock' | 'Stock Bajo' | 'Sin Stock';

interface ShoeItem {
  id: number; // id_variante
  id_modelo: number;
  codigo: string;
  modelo: string;
  categoria: string;
  id_categoria: number;
  talla: string;
  color: string;
  stock: number;
  proveedor: string;
  id_proveedor: number;
  estado: Status;
}

@Component({
  selector: 'app-editar-calzado',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './editar-calzado.html',
  styleUrls: ['./editar-calzado.css']
})
export class EditarCalzado implements OnInit {

  readonly Search = Search;
  readonly Trash2 = Trash2;
  readonly Pencil = Pencil;
  readonly Package = Package;

  searchTerm: string = '';
  statusFilter: 'Todos' | Status = 'Todos';
  showEditMenu = false;
  editShoeId: number | null = null;
  editModeloId: number | null = null;
  categorias: any[] = [];
  proveedores: any[] = [];

  editForm = {
    modelo: '',
    id_categoria: 0,
    talla: '',
    color: '',
    stock: 0,
    id_proveedor: 0,
    codigo: '',
  };

  shoes: ShoeItem[] = [];

  private calzadoService = inject(CalzadoService);

  ngOnInit() {
    this.cargarCalzados();
    this.cargarCategorias();
    this.cargarProveedores();
  }

  cargarCalzados() {
    this.calzadoService.getModelosCalzado().subscribe({
      next: (data: any[]) => {
        this.shoes = [];
        data.forEach(m => {
          if (m.variantes && m.variantes.length > 0) {
            m.variantes.forEach((v: any) => {
              if (v.activo) {
                this.shoes.push({
                  id:           v.id_variante,
                  id_modelo:    m.id_modelo,
                  codigo:       m.codigo,
                  modelo:       m.nombre_modelo,
                  categoria:    m.nombre_categoria,
                  id_categoria: m.id_categoria,
                  talla:        v.talla,
                  color:        v.color,
                  stock:        v.stock_actual,
                  proveedor:    m.nombre_proveedor,
                  id_proveedor: m.id_proveedor,
                  estado:       this.calcularEstado(v.stock_actual)
                });
              }
            });
          }
        });
      },
      error: (err: any) => console.error('Error cargando calzados:', err)
    });
  }

  cargarCategorias() {
    this.calzadoService.getCategorias().subscribe({
      next: (data: any) => this.categorias = data,
      error: (err: any) => console.error('Error cargando categorias:', err)
    });
  }

  cargarProveedores() {
    this.calzadoService.getProveedores().subscribe({
      next: (data: any) => this.proveedores = data,
      error: (err: any) => console.error('Error cargando proveedores:', err)
    });
  }

  calcularEstado(stock: number): Status {
    if (stock === 0)  return 'Sin Stock';
    if (stock <= 50)  return 'Stock Bajo';
    return 'En Stock';
  }

  getStatusClass(status: Status): string {
    if (status === 'En Stock')   return 'status-ok';
    if (status === 'Stock Bajo') return 'status-low';
    return 'status-out';
  }

  getStockClass(stock: number): string {
    if (stock === 0)  return 'stock-out';
    if (stock <= 50)  return 'stock-low';
    return 'strong';
  }

  get filteredShoes() {
    const search = this.searchTerm.toLowerCase().trim();
    return this.shoes.filter(shoe =>
      (shoe.codigo.toLowerCase().includes(search) ||
       shoe.modelo.toLowerCase().includes(search)) &&
      (this.statusFilter === 'Todos' || shoe.estado === this.statusFilter)
    );
  }

  // ── Editar por fila ──────────────────────────────────────
  editRow(shoe: ShoeItem) {
    if (this.showEditMenu && this.editShoeId === shoe.id) {
      this.closeEditMenu();
      return;
    }
    this.editShoeId = shoe.id;
    this.editModeloId = shoe.id_modelo;
    this.editForm = {
      codigo:       shoe.codigo,
      modelo:       shoe.modelo,
      id_categoria: shoe.id_categoria,
      talla:        shoe.talla,
      color:        shoe.color,
      stock:        shoe.stock,
      id_proveedor: shoe.id_proveedor,
    };
    this.showEditMenu = true;
  }

  saveEditMenu() {
    if (!this.editShoeId || !this.editModeloId) {
      return;
    }

    if (!this.editForm.modelo?.trim() || !this.editForm.talla?.trim() || !this.editForm.color?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'El modelo, talla y color son obligatorios.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (this.editForm.stock < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock inválido',
        text: 'El stock no puede ser un número negativo.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (!this.editForm.id_categoria || !this.editForm.id_proveedor) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta selección',
        text: 'Debe seleccionar una categoría y un proveedor válidos.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const payloadModelo = {
      nombre_modelo: this.editForm.modelo.trim(),
      id_categoria: Number(this.editForm.id_categoria),
    };

    const payloadVariante = {
      talla: this.editForm.talla.trim(),
      color: this.editForm.color.trim(),
      stock_actual: Number(this.editForm.stock),
      id_proveedor: Number(this.editForm.id_proveedor),
    };

    // Actualizamos el Modelo y luego la Variante
    this.calzadoService.updateModeloCalzado(this.editModeloId, payloadModelo).subscribe({
      next: () => {
        this.calzadoService.updateVarianteCalzado(this.editShoeId!, payloadVariante).subscribe({
          next: () => {
            this.cargarCalzados();
            this.closeEditMenu();
            Swal.fire({
              icon: 'success',
              title: '¡Actualizado!',
              text: 'La variante se actualizó correctamente.',
              confirmButtonColor: '#3b82f6'
            });
          },
          error: (err: any) => {
            console.error('Error actualizando variante:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al actualizar la variante.',
              confirmButtonColor: '#3b82f6'
            });
          }
        });
      },
      error: (err: any) => {
        console.error('Error actualizando modelo:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al actualizar el modelo.',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  closeEditMenu() {
    this.showEditMenu = false;
    this.editShoeId = null;
    this.editModeloId = null;
  }

  // ── Eliminar por fila ────────────────────────────────────
  deleteRow(shoe: ShoeItem) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Eliminar la variante de talla ${shoe.talla} y color ${shoe.color} del modelo "${shoe.modelo}" (#${shoe.codigo})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.calzadoService.deleteVarianteCalzado(shoe.id).subscribe({
          next: () => {
            this.cargarCalzados();
            if (this.editShoeId === shoe.id) this.closeEditMenu();
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La variante ha sido eliminada.',
              confirmButtonColor: '#3b82f6'
            });
          },
          error: (err: any) => {
            console.error('Error eliminando variante:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la variante.',
              confirmButtonColor: '#3b82f6'
            });
          }
        });
      }
    });
  }
}
