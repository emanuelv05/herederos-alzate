import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Briefcase, X } from 'lucide-angular';
import { CalzadoService } from '../../../../nucleo/servicios/calzado.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agregar-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './agregar-proveedor.html',
  styleUrl: './agregar-proveedor.css'
})
export class AgregarProveedor {
  @Output() close = new EventEmitter<void>();

  readonly Briefcase = Briefcase;
  readonly X = X;

  form = {
    codigo:           '',
    nombre_empresa:   '',
    nombre_proveedor: '',
    telefono:         '',
    mail:             '',
    ciudad:           '',
    direccion:        '',
    fecha_proveedor:  new Date().toISOString().split('T')[0],
    activo:           true,
  };

  constructor(private calzadoService: CalzadoService, private http: HttpClient) {}

  agregar() {
    // 1. Validar que todos los campos estén llenos
    if (!this.form.codigo || !this.form.nombre_empresa || !this.form.nombre_proveedor || 
        !this.form.telefono || !this.form.mail || !this.form.ciudad || !this.form.direccion) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor completa todos los campos obligatorios.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    // 2. Validar el formato del código (PROV seguido de 3 dígitos)
    const codigoUpper = this.form.codigo.toUpperCase();
    const codigoRegex = /^PROV\d{3}$/;
    if (!codigoRegex.test(codigoUpper)) {
      Swal.fire({
        icon: 'error',
        title: 'Código inválido',
        text: 'El código debe tener el formato PROV seguido de 3 números (ej. PROV001).',
        confirmButtonColor: '#0056b3'
      });
      return;
    }
    this.form.codigo = codigoUpper; // Guardar siempre en mayúscula

    // 3. Validar teléfono (exactamente 10 dígitos)
    const telefonoRegex = /^\d{10}$/;
    if (!telefonoRegex.test(this.form.telefono)) {
      Swal.fire({
        icon: 'error',
        title: 'Teléfono inválido',
        text: 'El teléfono debe contener exactamente 10 dígitos numéricos.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    // 4. Validar formato de correo electrónico básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.form.mail)) {
      Swal.fire({
        icon: 'error',
        title: 'Correo inválido',
        text: 'Por favor, ingresa un correo electrónico con formato válido.',
        confirmButtonColor: '#0056b3'
      });
      return;
    }

    // 5. Validar si el correo es real usando Abstract API
    Swal.fire({
      title: 'Verificando datos...',
      text: 'Comprobando que el correo electrónico exista, por favor espera.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const apiKey = '6577f24586364bb9aa588dbf91ed6595';
    const emailToVerify = encodeURIComponent(this.form.mail.trim());
    // Nueva URL para Email Reputation
    const apiUrl = `https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${emailToVerify}`;

    this.http.get<any>(apiUrl).subscribe({
      next: (response) => {
        // Abstract API devuelve un error si se acaba la prueba
        if (response.error) {
          Swal.fire({
            icon: 'warning',
            title: 'Límite de validación',
            text: 'El servicio de verificación de correos no está disponible (posible límite de prueba). ¿Deseas guardarlo de todas formas sin verificar el correo?',
            showCancelButton: true,
            confirmButtonColor: '#0056b3',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'No, cancelar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.guardarProveedor();
            }
          });
          return;
        }

        const status = response.email_deliverability?.status;

        // Si es 'undeliverable', NO dejamos agregarlo
        if (status === 'undeliverable') {
          Swal.fire({
            icon: 'error',
            title: 'Correo no válido',
            text: 'El correo ingresado no existe o no puede recibir mensajes. Por favor, ingresa uno válido.',
            confirmButtonColor: '#0056b3'
          });
          return;
        }

        // Si es 'unknown' o 'risky', mostramos advertencia
        if (status && status !== 'deliverable') {
          Swal.fire({
            icon: 'warning',
            title: 'Validación incierta',
            text: `No pudimos validar con certeza si el correo existe (estado: ${status}). ¿Deseas guardarlo de todas formas?`,
            showCancelButton: true,
            confirmButtonColor: '#0056b3',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'No, corregir'
          }).then((result) => {
            if (result.isConfirmed) {
              this.guardarProveedor();
            }
          });
          return;
        }

        // Si el correo es real y verificado, procedemos a guardar
        this.guardarProveedor();
      },
      error: (err) => {
        console.error('Error verificando correo:', err);
        // La API falló (puede ser por API key inválida, CORS, etc.)
        Swal.fire({
          icon: 'warning',
          title: 'Fallo en el servicio de verificación',
          text: 'No pudimos conectarnos al servicio para verificar si el correo existe. ¿Quieres guardar el proveedor de todas formas sin verificar el correo?',
          showCancelButton: true,
          confirmButtonColor: '#0056b3',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, guardarlo sin verificar',
          cancelButtonText: 'No, cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.guardarProveedor();
          }
        });
      }
    });
  }

  private guardarProveedor() {
    this.calzadoService.crearProveedor(this.form).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Proveedor agregado',
          text: 'El proveedor se ha guardado correctamente.',
          confirmButtonColor: '#0056b3',
          timer: 2000,
          showConfirmButton: false
        });
        this.close.emit();
      },
      error: (err) => {
        console.error('Error creando proveedor:', err);
        let errorMessage = 'Hubo un problema al guardar el proveedor.';

        // Parsear los errores de validación del backend (Django)
        if (err.error && typeof err.error === 'object') {
          const errors = [];
          for (const key in err.error) {
            if (Array.isArray(err.error[key])) {
              let msg = err.error[key][0];
              // Traducir mensajes comunes de unique=True
              if (msg.includes('already exists') || msg.includes('ya existe')) {
                if (key === 'codigo') {
                  msg = 'Este código ya está en uso, incluso si el proveedor fue "eliminado".';
                } else if (key === 'mail') {
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

  onClose(): void {
    this.close.emit();
  }
}
