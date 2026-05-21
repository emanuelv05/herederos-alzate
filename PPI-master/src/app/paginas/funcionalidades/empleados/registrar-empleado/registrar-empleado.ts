import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { LucideAngularModule, Eye, EyeOff, CheckCircle, AlertCircle, X, UserPlus } from 'lucide-angular';
import { AuthService } from '../../../../nucleo/servicios/auth.service';

function cedulaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const cedula = control.value.toString();
  if (!/^\d*$/.test(cedula)) return { notNumbers: true };
  if (cedula.length !== 10) return { cedulaLength: true };
  return null;
}

function minDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const todayString = new Date().toISOString().split('T')[0];
  if (control.value < todayString) return { minDate: true };
  return null;
}

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('contrasena');
  const confirmPassword = control.get('confirmarContrasena');
  if (!password || !confirmPassword) return null;
  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    const errors = confirmPassword.errors;
    if (errors) {
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
  }
  return null;
}

@Component({
  selector: 'app-registrar-empleado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './registrar-empleado.html',
  styleUrls: ['./registrar-empleado.css']
})
export class RegistrarEmpleado {

  @Output() close = new EventEmitter<void>();
  @Output() empleadoRegistrado = new EventEmitter<void>(); // ✅ NUEVO

  cancelar(): void {
    this.employeeForm.reset();
    this.close.emit();
  }

  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly X = X;
  readonly UserPlus = UserPlus;

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  showModal: boolean = false;
  modalType: 'success' | 'error' = 'success';
  modalMessage: string = '';
  modalTitle: string = '';
  minDateValue: string;
  employeeForm;

  constructor(private fb: FormBuilder, private auth: AuthService) {
    const today = new Date();
    this.minDateValue = today.toISOString().split('T')[0];

    this.employeeForm = this.fb.group({
      nombreCompleto:      ['', Validators.required],
      apellidoCompleto:    ['', Validators.required],
      usuario:             ['', Validators.required],
      cedula:              ['', [Validators.required, cedulaValidator]],
      fechaIngreso:        ['', [Validators.required, minDateValidator]],
      contrasena:          ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required, Validators.minLength(6)]],
      correoPersonal:      ['', [Validators.required, Validators.email]],
    }, { validators: passwordMatchValidator });

    this.employeeForm.get('contrasena')?.valueChanges.subscribe(() => {
      this.employeeForm.updateValueAndValidity({ emitEvent: false });
    });
    this.employeeForm.get('confirmarContrasena')?.valueChanges.subscribe(() => {
      this.employeeForm.updateValueAndValidity({ emitEvent: false });
    });
  }

  togglePassword()        { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }
  closeModal()            { this.showModal = false; }

  onCedulaInput(event: any): void {
    const input = event.target as HTMLInputElement;
    const filtered = input.value.replace(/\D/g, '');
    if (input.value !== filtered) {
      input.value = filtered;
      this.employeeForm.get('cedula')?.setValue(filtered);
    }
  }

  submit() {
    const formValues = this.employeeForm.value;

    const allEmpty = !formValues.nombreCompleto?.trim() &&
                     !formValues.apellidoCompleto?.trim() &&
                     !formValues.usuario?.trim() &&
                     !formValues.cedula?.trim() &&
                     !formValues.fechaIngreso &&
                     !formValues.contrasena?.trim() &&
                     !formValues.confirmarContrasena?.trim() &&
                     !formValues.correoPersonal?.trim();

    if (allEmpty) {
      this.modalType = 'error';
      this.modalTitle = '⚠️ Todos los campos están vacíos';
      this.modalMessage = 'Por favor, completa todos los campos para registrar un empleado.';
      this.showModal = true;
      return;
    }

    if (this.employeeForm.invalid) {
      const errors: string[] = [];
      if (this.employeeForm.get('nombreCompleto')?.invalid)   errors.push('El nombre completo es obligatorio.');
      if (this.employeeForm.get('apellidoCompleto')?.invalid) errors.push('El apellido completo es obligatorio.');
      if (this.employeeForm.get('usuario')?.invalid)          errors.push('El usuario es obligatorio.');
      if (this.employeeForm.get('cedula')?.invalid) {
        const e = this.employeeForm.get('cedula')?.errors;
        if (e?.['required'])          errors.push('La cédula es obligatoria.');
        else if (e?.['notNumbers'])   errors.push('La cédula solo debe contener números.');
        else if (e?.['cedulaLength']) errors.push('La cédula debe tener exactamente 10 dígitos.');
      }
      if (this.employeeForm.get('fechaIngreso')?.invalid) {
        const e = this.employeeForm.get('fechaIngreso')?.errors;
        if (e?.['minDate'])       errors.push('La fecha de ingreso debe ser hoy o posterior.');
        else if (e?.['required']) errors.push('La fecha de ingreso es obligatoria.');
      }
      if (this.employeeForm.get('contrasena')?.invalid)          errors.push('La contraseña debe tener al menos 6 caracteres.');
      if (this.employeeForm.get('confirmarContrasena')?.invalid) errors.push('La confirmación de contraseña es obligatoria.');
      if (this.employeeForm.get('correoPersonal')?.invalid) {
        const e = this.employeeForm.get('correoPersonal')?.errors;
        if (e?.['required'])  errors.push('El correo personal es obligatorio.');
        else if (e?.['email']) errors.push('El correo debe ser válido y contener @.');
      }
      if (this.employeeForm.errors?.['passwordMismatch']) errors.push('Las contraseñas no coinciden.');

      this.modalType = 'error';
      this.modalTitle = '❌ No se pudo registrar el empleado';
      this.modalMessage = errors.join('\n');
      this.showModal = true;
      return;
    }

    const formData = this.employeeForm.value;

    const payload = {
      usuario:        formData.usuario,
      nombre:         formData.nombreCompleto,
      apellidos:      formData.apellidoCompleto,
      identificacion: formData.cedula,
      mail:           formData.correoPersonal,
      fecha_ingreso:  formData.fechaIngreso,
      password:       formData.contrasena,
      password2:      formData.confirmarContrasena,
    };

    this.auth.registrarEmpleado(payload).subscribe({
      next: () => {
        this.modalType = 'success';
        this.modalTitle = '✅ ¡Empleado registrado exitosamente!';
        this.modalMessage = `Bienvenido ${formData.nombreCompleto} ${formData.apellidoCompleto}!\n\nTu usuario "${formData.usuario}" ha sido creado correctamente.\nYa puedes iniciar sesión en el sistema.`;
        this.showModal = true;
        setTimeout(() => {
          this.employeeForm.reset();
          this.showPassword = false;
          this.showConfirmPassword = false;
          this.closeModal();
          this.empleadoRegistrado.emit(); // ✅ CAMBIADO: era close.emit()
        }, 3000);
      },
      error: (err) => {
        const errores = err.error;
        const msgs = Object.values(errores).flat().join('\n');
        this.modalType = 'error';
        this.modalTitle = '❌ Error al registrar';
        this.modalMessage = msgs;
        this.showModal = true;
      }
    });
  }
}