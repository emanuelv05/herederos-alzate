import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Eye, EyeOff, Lock, LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../nucleo/servicios/auth.service';

@Component({
  selector: 'app-nueva-contrasena',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './nueva-contrasena.html',
  styleUrl: './nueva-contrasena.css',
})
export class NuevaContrasena {
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  usuario = '';
  codigo = '';
  feedback = '';
  feedbackType: 'success' | 'error' = 'success';

  showPassword = false;
  showConfirmPassword = false;

  resetForm;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      },
      { validators: this.passwordsMatchValidator }
    );

    this.route.queryParamMap.subscribe((params) => {
      this.usuario = params.get('usuario') ?? '';
      this.codigo = params.get('codigo') ?? '';
    });
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  passwordInputType() {
    return this.showPassword ? 'text' : 'password';
  }

  confirmPasswordInputType() {
    return this.showConfirmPassword ? 'text' : 'password';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  volverCodigo() {
    this.router.navigate(['/codigo-recuperacion'], {
      queryParams: { usuario: this.usuario }
    });
  }

  resetPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();

      if (this.resetForm.hasError('passwordMismatch')) {
        this.feedbackType = 'error';
        this.feedback = 'Las contraseñas no coinciden.';
      }
      return;
    }

    const newPassword = this.resetForm.get('password')?.value;

    this.feedbackType = 'success';
    this.feedback = 'Procesando...';

    this.auth.resetPassword({
      usuario: this.usuario,
      codigo: this.codigo,
      password: newPassword
    }).subscribe({
      next: (res) => {
        this.feedback = 'Contraseña actualizada correctamente. Redirigiendo al login...';
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { reset: 'ok' },
          });
        }, 1400);
      },
      error: (err) => {
        this.feedbackType = 'error';
        this.feedback = err.error?.error || 'Error al restablecer la contraseña.';
      }
    });
  }

}
