import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Trash2, Pencil } from 'lucide-angular';

type CategoryStatus = 'Activa' | 'Inactiva';

interface CategoryItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  productos: number;
  stockTotal: string;
  estado: CategoryStatus;
}

@Component({
  selector: 'app-editar-categoria',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './editar-categoria.html',
  styleUrls: ['./editar-categoria.css']
})
export class EditarCategoria {

  readonly Search = Search;
  readonly Trash2 = Trash2;
  readonly Pencil = Pencil;

  searchTerm: string = '';
  statusFilter: 'Todos' | CategoryStatus = 'Todos';

  selectedIds = new Set<number>();

  showEditMenu = false;
  editCategoryId: number | null = null;
  editForm = {
    nombre: '',
    descripcion: '',
    codigo: '', // Readonly
  };

  categories: CategoryItem[] = [
    {
      id: 1,
      codigo: 'CAT001',
      nombre: 'Zapatos Formales',
      descripcion: 'Zapatos ejecutivos, Oxford, Derby',
      productos: 289,
      stockTotal: '3,456',
      estado: 'Activa'
    },
    {
      id: 2,
      codigo: 'CAT002',
      nombre: 'Botas',
      descripcion: 'Botas clásicas, botines, botas de trabajo',
      productos: 156,
      stockTotal: '2,134',
      estado: 'Activa'
    },
    {
      id: 3,
      codigo: 'CAT003',
      nombre: 'Tenis Deportivos',
      descripcion: 'Running, training, basketball',
      productos: 234,
      stockTotal: '5,678',
      estado: 'Activa'
    },
    {
      id: 4,
      codigo: 'CAT004',
      nombre: 'Sandalias',
      descripcion: 'Sandalias casuales, playeras, elegantes',
      productos: 89,
      stockTotal: '1,234',
      estado: 'Activa'
    },
    {
      id: 5,
      codigo: 'CAT005',
      nombre: 'Casuales',
      descripcion: 'Mocasines, náuticos, alpargatas',
      productos: 178,
      stockTotal: '2,890',
      estado: 'Inactiva'
    }
  ];

  getStatusClass(status: CategoryStatus): string {
    return status === 'Activa' ? 'status-ok' : 'status-out';
  }

  get filteredCategories() {
    const search = this.searchTerm.toLowerCase().trim();

    return this.categories.filter(cat =>
      (cat.codigo.toLowerCase().includes(search) || cat.nombre.toLowerCase().includes(search)) &&
      (this.statusFilter === 'Todos' || cat.estado === this.statusFilter)
    );
  }

  get selectedCount() {
    return this.selectedIds.size;
  }

  get allFilteredSelected() {
    return this.filteredCategories.length > 0 && this.filteredCategories.every(c => this.selectedIds.has(c.id));
  }

  get allCategoriesSelected() {
    return this.categories.length > 0 && this.categories.every(c => this.selectedIds.has(c.id));
  }

  get canEditSelection() {
    return this.selectedCount === 1;
  }

  toggleSelectAll(event: Event) {
    if (this.showEditMenu) return;

    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.filteredCategories.forEach(c => this.selectedIds.add(c.id));
      return;
    }

    this.filteredCategories.forEach(c => this.selectedIds.delete(c.id));

    if (this.selectedCount === 0 || this.allCategoriesSelected) {
      this.closeEditMenu();
    }
  }

  toggleSelection(categoryId: number, event: Event) {
    if (this.showEditMenu && this.editCategoryId !== categoryId) {
      (event.target as HTMLInputElement).checked = false;
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedIds.add(categoryId);
      return;
    }

    this.selectedIds.delete(categoryId);

    if (this.selectedCount === 0) {
      this.closeEditMenu();
    }
  }

  editSelected() {
    if (!this.canEditSelection) return;

    const categoryToEdit = this.categories.find(c => this.selectedIds.has(c.id));
    if (!categoryToEdit) return;

    this.editCategoryId = categoryToEdit.id;
    this.editForm = {
      nombre: categoryToEdit.nombre,
      descripcion: categoryToEdit.descripcion,
      codigo: categoryToEdit.codigo,
    };
    this.showEditMenu = true;
  }

  saveEditMenu() {
    if (!this.editCategoryId) return;

    this.categories = this.categories.map(cat => {
      if (cat.id !== this.editCategoryId) return cat;

      return {
        ...cat,
        nombre: this.editForm.nombre.trim(),
        descripcion: this.editForm.descripcion.trim(),
      };
    });

    this.closeEditMenu();
  }

  closeEditMenu() {
    this.showEditMenu = false;
    this.editCategoryId = null;
  }

  deleteSelected() {
    if (this.selectedCount === 0) return;

    this.categories = this.categories.filter(cat => !this.selectedIds.has(cat.id));
    this.selectedIds.clear();
    this.closeEditMenu();
  }
}
