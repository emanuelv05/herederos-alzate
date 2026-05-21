import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { LucideAngularModule, Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-angular';
import { AgregarProveedor } from '../agregar-proveedor/agregar-proveedor';
import { AuthService } from '../../../../nucleo/servicios/auth.service';
import { CalzadoService } from '../../../../nucleo/servicios/calzado.service';

type ProviderStatus = 'Activo' | 'Inactivo';

interface ProviderItem {
  id: number;
  codigo: string;
  nombre_empresa: string;
  nombre_proveedor: string;
  telefono: string;
  mail: string;
  ciudad: string;
  direccion: string;
  estado: ProviderStatus;
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgregarProveedor, FormsModule],
  templateUrl: './proveedores.html',
  styleUrl: './proveedores.css'
})
export class Proveedores implements OnInit {
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;

  showAddSupplier = false;
  searchText: string = '';
  statusFilter: string = 'Todos los estados';
  editProviderId: number | null = null;

  editForm = {
    codigo:           '',
    nombre_empresa:   '',
    nombre_proveedor: '',
    telefono:         '',
    mail:             '',
    ciudad:           '',
    direccion:        '',
  };

  providers: ProviderItem[] = [];

  constructor(
    private auth: AuthService,
    private calzadoService: CalzadoService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() { this.cargarProveedores(); }

  isUsuario(): boolean { return this.auth.isUsuario(); }

  cargarProveedores() {
    this.calzadoService.getProveedores().subscribe({
      next: (data: any[]) => {
        this.providers = data.map(p => ({
          id:               p.id_proveedor,
          codigo:           p.codigo,
          nombre_empresa:   p.nombre_empresa,
          nombre_proveedor: p.nombre_proveedor,
          telefono:         p.telefono,
          mail:             p.mail,
          ciudad:           p.ciudad,
          direccion:        p.direccion,
          estado:           p.activo ? 'Activo' : 'Inactivo'
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando proveedores:', err)
    });
  }

  get filteredProviders(): ProviderItem[] {
    return this.providers.filter(p => {
      const matchesSearch = !this.searchText ||
        p.codigo.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.nombre_empresa.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.nombre_proveedor.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesStatus = this.statusFilter === 'Todos los estados' || p.estado === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  getStatusClass(status: ProviderStatus): string {
    return status === 'Activo' ? 'status-active' : 'status-inactive';
  }

  openAddSupplier(): void  { this.showAddSupplier = true; }
  closeAddSupplier(): void { this.showAddSupplier = false; this.cargarProveedores(); }

  editProvider(provider: ProviderItem): void {
    if (this.editProviderId === provider.id) { this.cancelEdit(); return; }
    this.editProviderId = provider.id;
    this.editForm = {
      codigo:           provider.codigo,
      nombre_empresa:   provider.nombre_empresa,
      nombre_proveedor: provider.nombre_proveedor,
      telefono:         provider.telefono,
      mail:             provider.mail,
      ciudad:           provider.ciudad,
      direccion:        provider.direccion,
    };
  }

  saveEdit(): void {
    if (!this.editProviderId) return;

    // Buscar los datos originales del proveedor
    const originalProvider = this.providers.find(p => p.id === this.editProviderId);
    
    // Verificar si los datos son exactamente iguales (sin cambios)
    if (originalProvider && 
        originalProvider.nombre_empresa === this.editForm.nombre_empresa &&
        originalProvider.nombre_proveedor === this.editForm.nombre_proveedor &&
        originalProvider.telefono === this.editForm.telefono &&
        originalProvider.mail === this.editForm.mail &&
        originalProvider.ciudad === this.editForm.ciudad &&
        originalProvider.direccion === this.editForm.direccion) {
        
        Swal.fire({
          icon: 'info',
          title: 'Sin cambios',
          text: 'No has modificado ningún dato del proveedor.',
          confirmButtonColor: '#0056b3'
        });
        return;
    }

    // 1. Validar campos obligatorios
    if (
      !this.editForm.nombre_proveedor ||
      !this.editForm.nombre_empresa ||
      !this.editForm.mail ||
      !this.editForm.telefono ||
      !this.editForm.ciudad ||
      !this.editForm.direccion
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, llena todos los campos obligatorios antes de guardar.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    // 2. Validar teléfono
    const telefonoRegex = /^\d{10}$/;
    if (!telefonoRegex.test(this.editForm.telefono)) {
      Swal.fire({
        icon: 'warning',
        title: 'Teléfono inválido',
        text: 'El teléfono debe contener exactamente 10 dígitos numéricos.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    // 3. Validar formato de correo electronico basico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.editForm.mail)) {
      Swal.fire({
        icon: 'error',
        title: 'Correo invalido',
        text: 'Por favor, ingresa un correo electronico con formato valido.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    // 4. Validar Correo con Abstract API (Email Reputation)
    Swal.fire({
      title: 'Verificando datos...',
      text: 'Comprobando que el correo electronico exista, por favor espera.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const apiKey = '6577f24586364bb9aa588dbf91ed6595';
    const emailToVerify = encodeURIComponent(this.editForm.mail.trim());
    const apiUrl = `https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${emailToVerify}`;

    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        if (response.error) {
          Swal.fire({
            icon: 'warning',
            title: 'Límite de validación',
            text: 'El servicio de verificación de correos no está disponible (posible límite de prueba). ¿Deseas guardar los cambios de todas formas sin verificar el correo?',
            showCancelButton: true,
            confirmButtonColor: '#0056b3',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'No, cancelar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.ejecutarGuardarEdicion();
            }
          });
          return;
        }

        const status = response.email_deliverability?.status;
        
        if (status === 'undeliverable') {
          Swal.fire({
            icon: 'error',
            title: 'Correo no válido',
            text: 'El correo ingresado no existe o no puede recibir mensajes. Por favor, ingresa uno válido.',
            confirmButtonColor: '#0056b3'
          });
          return;
        }

        if (status && status !== 'deliverable') {
          Swal.fire({
            icon: 'warning',
            title: 'Validación incierta',
            text: `No pudimos validar con certeza si el correo existe (estado: ${status}). ¿Deseas guardar los cambios de todas formas?`,
            showCancelButton: true,
            confirmButtonColor: '#0056b3',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'No, corregir'
          }).then((result) => {
            if (result.isConfirmed) {
              this.ejecutarGuardarEdicion();
            }
          });
          return;
        }

        this.ejecutarGuardarEdicion();
      },
      error: (err) => {
        console.error('Error verificando correo:', err);
        Swal.fire({
          icon: 'warning',
          title: 'Fallo en el servicio de verificación',
          text: 'No pudimos conectarnos al servicio para verificar si el correo existe. ¿Quieres guardar los cambios de todas formas sin verificar el correo?',
          showCancelButton: true,
          confirmButtonColor: '#0056b3',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, guardar sin verificar',
          cancelButtonText: 'No, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.ejecutarGuardarEdicion();
          }
        });
      }
    });
  }

  ejecutarGuardarEdicion(): void {
    if (!this.editProviderId) return;

    const payload = {
      nombre_empresa:   this.editForm.nombre_empresa,
      nombre_proveedor: this.editForm.nombre_proveedor,
      telefono:         this.editForm.telefono,
      mail:             this.editForm.mail,
      ciudad:           this.editForm.ciudad,
      direccion:        this.editForm.direccion,
    };

    this.calzadoService.updateProveedor(this.editProviderId, payload).subscribe({
      next: () => { 
        Swal.fire({
          icon: 'success',
          title: 'Proveedor actualizado',
          text: 'Los cambios se han guardado correctamente.',
          confirmButtonColor: '#0056b3',
          timer: 2000,
          showConfirmButton: false
        });
        this.cargarProveedores(); 
        this.cancelEdit(); 
      },
      error: (err) => {
        console.error('Error actualizando proveedor:', err);
        let errorMessage = 'Hubo un problema al guardar los cambios.';

        if (err.error && typeof err.error === 'object') {
          const errors = [];
          for (const key in err.error) {
            if (Array.isArray(err.error[key])) {
              let msg = err.error[key][0];
              if (msg.includes('already exists') || msg.includes('ya existe')) {
                if (key === 'mail') {
                  msg = 'Este correo ya está registrado en otro proveedor.';
                } else {
                  msg = 'Este valor ya está en uso.';
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

  cancelEdit(): void { this.editProviderId = null; }

  deleteProvider(provider: ProviderItem): void {
    Swal.fire({
      icon: 'warning',
      title: 'Eliminar proveedor',
      text: `Estas seguro de eliminar el proveedor "${provider.nombre_empresa}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#0056b3',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.calzadoService.deleteProveedor(provider.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Proveedor eliminado',
            text: 'El proveedor se elimino correctamente.',
            confirmButtonColor: '#0056b3',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargarProveedores();
        },
        error: (err) => {
          console.error('Error eliminando proveedor:', err);
          Swal.fire({
            icon: 'error',
            title: 'No se pudo eliminar',
            text: 'Hubo un problema al eliminar el proveedor.',
            confirmButtonColor: '#0056b3'
          });
        }
      });
    });
  }
}
