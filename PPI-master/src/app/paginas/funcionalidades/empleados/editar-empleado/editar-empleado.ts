import { Component, HostListener, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistrarEmpleado } from '../registrar-empleado/registrar-empleado';
import { AuthService } from '../../../../nucleo/servicios/auth.service';

import { LucideAngularModule, Search, Trash2, Pencil, History, UserPlus, X } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-empleado',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RegistrarEmpleado],
  templateUrl: './editar-empleado.html',
  styleUrls: ['./editar-empleado.css']
})
export class EditarEmpleado implements OnInit, OnDestroy {

  readonly Search = Search;
  readonly Trash2 = Trash2;
  readonly Pencil = Pencil;
  readonly History = History;
  readonly UserPlus = UserPlus;
  readonly X = X;

  searchTerm: string = '';
  statusFilter: 'Todos' | 'Activo' | 'Inactivo' = 'Todos';
  selectedIds = new Set<number>();

  showEditMenu = false;
  editEmployeeId: number | null = null;
  openHistoryEmployeeId: number | null = null;
  editForm = {
    nombreCompleto: '',
    apellidoCompleto: '',
    usuario: '',
    fechaIngreso: '',
    cedula: '',
    correoPersonal: '',
    nuevaContrasena: '',
    confirmarContrasena: '',
  };

  showAddEmployeeModal = false;
  employees: any[] = [];

  // ✅ AGREGADO
  constructor(private auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarEmpleados();
  }

  cargarEmpleados(): void {
    this.auth.getEmpleados().subscribe({
      next: (data: any[]) => {
        this.employees = data.map((emp: any) => ({
          id:               emp.id_usuario ?? emp.id,
          nombre:           `${emp.nombre ?? ''} ${emp.apellidos ?? ''}`.trim(),
          email:            emp.mail ?? '',
          nombreCompleto:   emp.nombre ?? '',
          apellidoCompleto: emp.apellidos ?? '',
          usuario:          emp.usuario ?? '',
          fechaIngreso:     emp.fecha_ingreso ?? '',
          cedula:           emp.identificacion ?? '',
          correoPersonal:   emp.mail ?? '',
          status:           emp.activo ? 'Activo' : 'Inactivo' as 'Activo' | 'Inactivo',
          ultimaConexion:   emp.ultimo_acceso
                              ? new Date(emp.ultimo_acceso).toLocaleString('es-CO')
                              : 'Sin registro',
          history:          [] as string[]
        }));
        this.cdr.detectChanges(); // ✅ AGREGADO
      },
      error: (err) => console.error('Error al cargar empleados:', err)
    });
  }

  get filteredEmployees() {
    const search = this.searchTerm.toLowerCase().trim();
    return this.employees.filter(emp =>
      (emp.usuario.toLowerCase().includes(search) || emp.cedula.includes(search)) &&
      (this.statusFilter === 'Todos' || emp.status === this.statusFilter)
    );
  }

  get selectedCount()       { return this.selectedIds.size; }
  get canEditSelection()    { return this.selectedCount === 1; }
  get allFilteredSelected() { return this.filteredEmployees.length > 0 && this.filteredEmployees.every(emp => this.selectedIds.has(emp.id)); }
  get allUsersSelected()    { return this.employees.length > 0 && this.employees.every(emp => this.selectedIds.has(emp.id)); }

  openAddEmployeeModal()  { this.showAddEmployeeModal = true; }
  closeAddEmployeeModal() { this.showAddEmployeeModal = false; }

  onEmpleadoRegistrado() {
    this.showAddEmployeeModal = false;
    this.cargarEmpleados();
  }

  toggleSelectAll(event: Event) {
    if (this.showEditMenu) return;
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) { this.filteredEmployees.forEach(emp => this.selectedIds.add(emp.id)); return; }
    this.filteredEmployees.forEach(emp => this.selectedIds.delete(emp.id));
    if (this.selectedCount === 0 || this.allUsersSelected) this.closeEditMenu();
  }

  toggleSelection(employeeId: number, event: Event) {
    if (this.showEditMenu && this.editEmployeeId !== employeeId) {
      (event.target as HTMLInputElement).checked = false;
      return;
    }
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) { this.selectedIds.add(employeeId); return; }
    this.selectedIds.delete(employeeId);
    if (this.selectedCount === 0) this.closeEditMenu();
  }

  editSelected() {
    if (!this.canEditSelection) return;
    const employeeToEdit = this.employees.find(emp => this.selectedIds.has(emp.id));
    if (!employeeToEdit) return;
    this.editEmployeeId = employeeToEdit.id;
    this.editForm = {
      nombreCompleto:      employeeToEdit.nombreCompleto,
      apellidoCompleto:    employeeToEdit.apellidoCompleto,
      usuario:             employeeToEdit.usuario,
      fechaIngreso:        employeeToEdit.fechaIngreso,
      cedula:              employeeToEdit.cedula,
      correoPersonal:      employeeToEdit.correoPersonal,
      nuevaContrasena:     '',
      confirmarContrasena: '',
    };
    this.showEditMenu = true;
  }

  deleteSelected() {
    if (this.selectedCount === 0) return;
    const idsArray = Array.from(this.selectedIds);
    let completed = 0;
    let hasError = false;
    idsArray.forEach(id => {
      this.auth.eliminarEmpleado(id).subscribe({
        next: () => {
          completed++;
          if (completed === idsArray.length && !hasError) {
            this.employees = this.employees.filter(emp => !this.selectedIds.has(emp.id));
            this.selectedIds.clear();
            this.closeEditMenu();
            this.cdr.detectChanges(); // ✅ AGREGADO
          }
        },
        error: (err) => {
          hasError = true;
          console.error(`Error al eliminar empleado ${id}:`, err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al eliminar uno o más empleados.',
            confirmButtonColor: '#3b82f6'
          });
        }
      });
    });
  }

  toggleStatus(employeeId: number) {
    this.employees = this.employees.map(emp => {
      if (emp.id !== employeeId) return emp;
      const nextStatus = emp.status === 'Activo' ? 'Inactivo' : 'Activo';
      const hora = new Date().toLocaleTimeString('es-CO');
      return {
        ...emp,
        status: nextStatus,
        history: [...emp.history, `${hora} — Status cambiado a ${nextStatus}`]
      };
    });
    this.cdr.detectChanges(); // ✅ AGREGADO
  }

  saveEditMenu() {
    if (!this.editEmployeeId) return;

    if (!this.editForm.nombreCompleto?.trim() || !this.editForm.apellidoCompleto?.trim() || !this.editForm.usuario?.trim() || !this.editForm.correoPersonal?.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'El nombre, apellido, usuario y correo son obligatorios.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(this.editForm.correoPersonal)) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Por favor, ingresa un correo electrónico válido.',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    if (this.editForm.nuevaContrasena.trim()) {
      if (this.editForm.nuevaContrasena.trim() !== this.editForm.confirmarContrasena.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseñas no coinciden',
          text: 'La nueva contraseña y su confirmación deben ser iguales.',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }

    const payload: any = {
      nombre:        this.editForm.nombreCompleto.trim(),
      apellidos:     this.editForm.apellidoCompleto.trim(),
      usuario:       this.editForm.usuario.trim(),
      mail:          this.editForm.correoPersonal.trim(),
      fecha_ingreso: this.editForm.fechaIngreso,
    };
    if (this.editForm.nuevaContrasena.trim()) {
      payload.password  = this.editForm.nuevaContrasena.trim();
      payload.password2 = this.editForm.confirmarContrasena.trim();
    }
    this.auth.editarEmpleado(this.editEmployeeId, payload).subscribe({
      next: (updatedUser) => {
        const hora = new Date().toLocaleTimeString('es-CO');
        this.employees = this.employees.map(emp => {
          if (emp.id !== this.editEmployeeId) return emp;
          return {
            ...emp,
            nombreCompleto:   updatedUser.nombre,
            apellidoCompleto: updatedUser.apellidos,
            usuario:          updatedUser.usuario,
            correoPersonal:   updatedUser.mail,
            email:            updatedUser.mail,
            fechaIngreso:     updatedUser.fecha_ingreso,
            nombre:           `${updatedUser.nombre} ${updatedUser.apellidos}`.trim(),
            history:          [...emp.history, `${hora} — Datos actualizados`],
          };
        });
        this.closeEditMenu();
        this.cdr.detectChanges(); // ✅ AGREGADO
      },
      error: (err) => {
        const msgs = Object.values(err.error ?? {}).flat().join('\\n');
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: msgs || 'Ocurrió un error inesperado.',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  closeEditMenu() {
    this.showEditMenu = false;
    this.editEmployeeId = null;
    this.editForm.nuevaContrasena = '';
    this.editForm.confirmarContrasena = '';
  }

  toggleHistoryMenu(employeeId: number) {
    this.openHistoryEmployeeId = this.openHistoryEmployeeId === employeeId ? null : employeeId;
  }

  isHistoryOpen(employeeId: number) {
    return this.openHistoryEmployeeId === employeeId;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.openHistoryEmployeeId === null) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.history-wrapper')) {
      this.openHistoryEmployeeId = null;
    }
  }

  ngOnDestroy() { this.openHistoryEmployeeId = null; }
}