import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Trash2, Pencil } from 'lucide-angular';

type ProviderStatus = 'Activo' | 'Inactivo';

interface ProviderItem {
  id: number;
  codigo: string;
  empresa: string;
  contacto: string;
  telefono: string;
  email: string;
  ciudad: string;
  productos: number;
  estado: ProviderStatus;
}

@Component({
  selector: 'app-editar-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './editar-proveedores.html',
  styleUrls: ['./editar-proveedores.css']
})
export class EditarProveedores {

  readonly Search = Search;
  readonly Trash2 = Trash2;
  readonly Pencil = Pencil;

  searchTerm: string = '';
  statusFilter: 'Todos' | ProviderStatus = 'Todos';

  selectedIds = new Set<number>();

  showEditMenu = false;
  editProviderId: number | null = null;
  editForm = {
    empresa: '',
    contacto: '',
    telefono: '',
    email: '',
    ciudad: '',
    codigo: '', // Readonly
  };

  providers: ProviderItem[] = [
    {
      id: 1,
      codigo: 'PR001',
      empresa: 'Cueros Alzate',
      contacto: 'Carlos Mendoza',
      telefono: '+57 300 123 4567',
      email: 'contacto@cuerosalzate.com',
      ciudad: 'Medellín',
      productos: 89,
      estado: 'Activo'
    },
    {
      id: 2,
      codigo: 'PR002',
      empresa: 'Proveedores XYZ',
      contacto: 'Ana López',
      telefono: '+57 310 987 6543',
      email: 'ventas@provxyz.com',
      ciudad: 'Bogotá',
      productos: 45,
      estado: 'Activo'
    },
    {
      id: 3,
      codigo: 'PR003',
      empresa: 'Calzado Premium',
      contacto: 'Pedro Ramírez',
      telefono: '+57 320 456 7890',
      email: 'info@calzadopremium.co',
      ciudad: 'Cali',
      productos: 67,
      estado: 'Inactivo'
    },
    {
      id: 4,
      codigo: 'PR004',
      empresa: 'Deportes Max',
      contacto: 'Laura Martínez',
      telefono: '+57 315 789 0123',
      email: 'ventas@deportesmax.com',
      ciudad: 'Barranquilla',
      productos: 34,
      estado: 'Activo'
    }
  ];

  getStatusClass(status: ProviderStatus): string {
    return status === 'Activo' ? 'status-ok' : 'status-out';
  }

  get filteredProviders() {
    const search = this.searchTerm.toLowerCase().trim();

    return this.providers.filter(prov =>
      (prov.codigo.toLowerCase().includes(search) || prov.empresa.toLowerCase().includes(search) || prov.contacto.toLowerCase().includes(search)) &&
      (this.statusFilter === 'Todos' || prov.estado === this.statusFilter)
    );
  }

  get selectedCount() {
    return this.selectedIds.size;
  }

  get allFilteredSelected() {
    return this.filteredProviders.length > 0 && this.filteredProviders.every(p => this.selectedIds.has(p.id));
  }

  get allProvidersSelected() {
    return this.providers.length > 0 && this.providers.every(p => this.selectedIds.has(p.id));
  }

  get canEditSelection() {
    return this.selectedCount === 1;
  }

  toggleSelectAll(event: Event) {
    if (this.showEditMenu) return;

    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.filteredProviders.forEach(p => this.selectedIds.add(p.id));
      return;
    }

    this.filteredProviders.forEach(p => this.selectedIds.delete(p.id));

    if (this.selectedCount === 0 || this.allProvidersSelected) {
      this.closeEditMenu();
    }
  }

  toggleSelection(providerId: number, event: Event) {
    if (this.showEditMenu && this.editProviderId !== providerId) {
      (event.target as HTMLInputElement).checked = false;
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedIds.add(providerId);
      return;
    }

    this.selectedIds.delete(providerId);

    if (this.selectedCount === 0) {
      this.closeEditMenu();
    }
  }

  editSelected() {
    if (!this.canEditSelection) return;

    const providerToEdit = this.providers.find(p => this.selectedIds.has(p.id));
    if (!providerToEdit) return;

    this.editProviderId = providerToEdit.id;
    this.editForm = {
      empresa: providerToEdit.empresa,
      contacto: providerToEdit.contacto,
      telefono: providerToEdit.telefono,
      email: providerToEdit.email,
      ciudad: providerToEdit.ciudad,
      codigo: providerToEdit.codigo,
    };
    this.showEditMenu = true;
  }

  saveEditMenu() {
    if (!this.editProviderId) return;

    this.providers = this.providers.map(prov => {
      if (prov.id !== this.editProviderId) return prov;

      return {
        ...prov,
        empresa: this.editForm.empresa.trim(),
        contacto: this.editForm.contacto.trim(),
        telefono: this.editForm.telefono.trim(),
        email: this.editForm.email.trim(),
        ciudad: this.editForm.ciudad.trim(),
      };
    });

    this.closeEditMenu();
  }

  closeEditMenu() {
    this.showEditMenu = false;
    this.editProviderId = null;
  }

  deleteSelected() {
    if (this.selectedCount === 0) return;

    this.providers = this.providers.filter(prov => !this.selectedIds.has(prov.id));
    this.selectedIds.clear();
    this.closeEditMenu();
  }
}
