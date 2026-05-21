import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Search } from 'lucide-angular';
import { NuevaCategoria } from '../../../nueva-categoria/nueva-categoria';
import { AuthService } from '../../../../nucleo/servicios/auth.service';
import { CalzadoService } from '../../../../nucleo/servicios/calzado.service';
import Swal from 'sweetalert2';

type CategoryStatus = 'Activa' | 'Inactiva';

interface CategoryItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: CategoryStatus;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NuevaCategoria, FormsModule],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css'
})
export class Categorias implements OnInit {
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Search = Search;

  showAddCategory: boolean = false;
  searchText: string = '';
  statusFilter: string = 'Todos los estados';
  editCategoryId: number | null = null;

  editForm = {
    codigo:      '',
    nombre:      '',
    descripcion: '',
  };

  categories: CategoryItem[] = [];

  constructor(
    private auth: AuthService,
    private calzadoService: CalzadoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  isUsuario(): boolean { return this.auth.isUsuario(); }

  cargarCategorias() {
    this.calzadoService.getCategorias().subscribe({
      next: (data: any[]) => {
        this.categories = data.map(c => ({
          id:          c.id_categoria,
          codigo:      c.codigo,
          nombre:      c.nombre_categoria,
          descripcion: c.descripcion,
          estado:      c.activo ? 'Activa' : 'Inactiva'
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando categorias:', err)
    });
  }

  get filteredCategories(): CategoryItem[] {
    return this.categories.filter(c => {
      const matchesSearch = !this.searchText ||
        c.codigo.toLowerCase().includes(this.searchText.toLowerCase()) ||
        c.nombre.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesStatus = this.statusFilter === 'Todos los estados' || c.estado === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  getStatusClass(status: CategoryStatus): string {
    return status === 'Activa' ? 'status-active' : 'status-inactive';
  }

  openAddCategory(): void  { this.showAddCategory = true; }
  closeAddCategory(): void { this.showAddCategory = false; this.cargarCategorias(); }

  editCategory(category: CategoryItem): void {
    if (this.editCategoryId === category.id) { this.cancelEdit(); return; }
    this.editCategoryId = category.id;
    this.editForm = {
      codigo:      category.codigo,
      nombre:      category.nombre,
      descripcion: category.descripcion,
    };
  }

  saveEdit(): void {
    if (!this.editCategoryId) return;

    const nombre = this.editForm.nombre.trim();
    const descripcion = this.editForm.descripcion.trim();

    if (!nombre || !descripcion) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa nombre y descripcion antes de guardar.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    const originalCategory = this.categories.find(c => c.id === this.editCategoryId);
    if (
      originalCategory &&
      originalCategory.nombre.trim() === nombre &&
      originalCategory.descripcion.trim() === descripcion
    ) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'Debes editar al menos un campo antes de guardar.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    const payload = {
      nombre_categoria: nombre,
      descripcion:      descripcion,
    };

    this.calzadoService.updateCategoria(this.editCategoryId, payload).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Categoria actualizada',
          text: 'Los cambios se guardaron correctamente.',
          confirmButtonColor: '#0056b3',
          timer: 2000,
          showConfirmButton: false
        });
        this.cargarCategorias();
        this.cancelEdit();
      },
      error: (err) => {
        console.error('Error actualizando categoria:', err);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo guardar',
          text: 'Hubo un problema al actualizar la categoria.',
          confirmButtonColor: '#0056b3'
        });
      }
    });
  }

  cancelEdit(): void { this.editCategoryId = null; }

  deleteCategory(category: CategoryItem): void {
    Swal.fire({
      icon: 'warning',
      title: 'Eliminar categoria',
      text: `Estas seguro de eliminar la categoria "${category.nombre}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#0056b3',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.calzadoService.deleteCategoria(category.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Categoria eliminada',
            text: 'La categoria se elimino correctamente.',
            confirmButtonColor: '#0056b3',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargarCategorias();
        },
        error: (err) => {
          console.error('Error eliminando categoria:', err);
          Swal.fire({
            icon: 'error',
            title: 'No se pudo eliminar',
            text: 'Hubo un problema al eliminar la categoria.',
            confirmButtonColor: '#0056b3'
          });
        }
      });
    });
  }
}
