import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../nucleo/servicios/auth.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: './splash.html',
  styleUrls: ['./splash.css']
})
export class SplashComponent implements OnInit, OnDestroy {
  private timeoutId: number | undefined;
  private platformId = inject(PLATFORM_ID);
  private readonly splashDurationMs = 3000;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const next = this.route.snapshot.queryParamMap.get('next') ?? 'login';
    const target = this.resolveTarget(next);

    if (isPlatformBrowser(this.platformId)) {
      this.timeoutId = window.setTimeout(() => {
        this.router.navigate([target]);
      }, this.splashDurationMs);
    } else {
      this.router.navigate([target]);
    }
  }

  private resolveTarget(next: string): string {
    // Si es logout o no está autenticado, va al login
    if (next === 'login' || !this.auth.isAuthenticated()) {
      this.auth.logout();
      return '/login';
    }

    // Redirige según el rol
    const role = this.auth.getRole();
    if (role === 'admin') {
      return '/home';
    } else if (role === 'usuario') {
      return '/usuario/home';
    }

    return '/login';
  }

  ngOnDestroy() {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
    }
  }
}

