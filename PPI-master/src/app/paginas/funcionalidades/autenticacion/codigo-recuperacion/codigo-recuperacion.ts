import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../nucleo/servicios/auth.service';

@Component({
  selector: 'app-codigo-recuperacion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './codigo-recuperacion.html',
  styleUrl: './codigo-recuperacion.css',
})
export class CodigoRecuperacion implements OnDestroy {

  usuario = '';
  mail = '';
  feedback = '';
  feedbackType: 'success' | 'error' | 'info' = 'info';

  // 6 dígitos independientes
  d0 = ''; d1 = ''; d2 = ''; d3 = ''; d4 = ''; d5 = '';

  // Cooldown reenvío
  reenvioEnCooldown = false;
  cooldownSegundos = 0;
  private cooldownTimer: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {
    this.route.queryParamMap.subscribe(params => {
      this.usuario = params.get('usuario') ?? '';
      this.mail    = params.get('mail')    ?? '';
    });
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  // Devuelve el valor del campo según su índice
  private getDigit(i: number): string {
    return [this.d0, this.d1, this.d2, this.d3, this.d4, this.d5][i];
  }

  // Asigna el valor al campo según índice
  private setDigit(i: number, val: string): void {
    switch (i) {
      case 0: this.d0 = val; break;
      case 1: this.d1 = val; break;
      case 2: this.d2 = val; break;
      case 3: this.d3 = val; break;
      case 4: this.d4 = val; break;
      case 5: this.d5 = val; break;
    }
  }

  // Foco en el input por índice (usando ID único)
  private focusBox(i: number): void {
    setTimeout(() => {
      const el = document.getElementById(`otp-digit-${i}`) as HTMLInputElement | null;
      if (el) el.focus();
    }, 0);
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const raw   = input.value.replace(/\D/g, '');

    // Soporte pegar 6 dígitos de golpe
    if (raw.length === 6) {
      this.d0 = raw[0]; this.d1 = raw[1]; this.d2 = raw[2];
      this.d3 = raw[3]; this.d4 = raw[4]; this.d5 = raw[5];
      this.focusBox(5);
      input.value = raw[index] ?? '';
      return;
    }

    const digit = raw.slice(-1);
    this.setDigit(index, digit);
    input.value = digit;

    if (digit && index < 5) this.focusBox(index + 1);
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.getDigit(index) && index > 0) {
        this.setDigit(index - 1, '');
        this.focusBox(index - 1);
      } else {
        this.setDigit(index, '');
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    this.d0 = pasted[0] ?? ''; this.d1 = pasted[1] ?? '';
    this.d2 = pasted[2] ?? ''; this.d3 = pasted[3] ?? '';
    this.d4 = pasted[4] ?? ''; this.d5 = pasted[5] ?? '';
    this.focusBox(Math.min(pasted.length, 5));
  }

  get codigoCompleto(): string {
    return this.d0 + this.d1 + this.d2 + this.d3 + this.d4 + this.d5;
  }

  get codigoValido(): boolean {
    return this.codigoCompleto.length === 6;
  }

  volverLogin(): void {
    this.router.navigate(['/login']);
  }

  verificarCodigo(): void {
    const code = this.codigoCompleto;
    if (code.length !== 6) {
      this.feedbackType = 'error';
      this.feedback = 'Ingresa los 6 dígitos del código.';
      return;
    }

    this.feedback = '';
    this.auth.verifyCode(this.usuario, code).subscribe({
      next: () => {
        this.feedbackType = 'success';
        this.feedback = 'Código verificado. Redirigiendo...';
        this.router.navigate(['/nueva-contrasena'], {
          queryParams: { usuario: this.usuario, codigo: code }
        });
      },
      error: (err) => {
        this.feedbackType = 'error';
        this.feedback = err.error?.error || 'Código incorrecto. Intenta de nuevo.';
        this.d0=''; this.d1=''; this.d2=''; this.d3=''; this.d4=''; this.d5='';
        this.focusBox(0);
      }
    });
  }

  reenviarCodigo(): void {
    if (this.reenvioEnCooldown) return;

    this.auth.forgotPassword(this.usuario).subscribe({
      next: (res) => {
        this.feedbackType = 'success';
        this.feedback = `Código reenviado a ${res.mail}. Revisa tu bandeja.`;
        this.d0=''; this.d1=''; this.d2=''; this.d3=''; this.d4=''; this.d5='';
        this.focusBox(0);
        this.iniciarCooldown(60);
      },
      error: (err) => {
        this.feedbackType = 'error';
        this.feedback = err.error?.error || 'No se pudo reenviar el código.';
      }
    });
  }

  private iniciarCooldown(segundos: number): void {
    this.reenvioEnCooldown  = true;
    this.cooldownSegundos   = segundos;
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.cooldownSegundos--;
      if (this.cooldownSegundos <= 0) {
        clearInterval(this.cooldownTimer);
        this.reenvioEnCooldown = false;
      }
    }, 1000);
  }
}
