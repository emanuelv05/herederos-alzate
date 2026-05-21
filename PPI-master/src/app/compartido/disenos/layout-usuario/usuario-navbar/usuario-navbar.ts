import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { LucideAngularModule, Menu, Settings, User, LogOut, UserCheck } from 'lucide-angular';
import { AuthService } from '../../../../nucleo/servicios/auth.service';

@Component({
  selector: 'app-usuario-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './usuario-navbar.html',
  styleUrls: ['./usuario-navbar.css']
})
export class UsuarioNavbar {

  @Output() menuClick = new EventEmitter<void>();

  readonly Menu = Menu;
  readonly Settings = Settings;
  readonly User = User;
  readonly LogOut = LogOut;
  readonly UserCheck = UserCheck;

  isSettingsOpen: boolean = false;

  get userName(): string {
    return this.auth.getUserName();
  }

  constructor(
    private elementRef: ElementRef,
    private router: Router,
    private auth: AuthService
  ) {}

  onMenuClick() {
    this.menuClick.emit();
  }

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
  }

  goHome() {
    this.router.navigate(['/usuario/home']);
  }

  goProfile() {
    this.isSettingsOpen = false;
    this.router.navigate(['/usuario/perfil']);
  }

  logout() {
    this.isSettingsOpen = false;
    this.auth.logout();
    this.router.navigate(['/splash'], { queryParams: { next: 'login' } });
  }

  @HostListener('document:mousedown', ['$event'])
  closeDropdownOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isSettingsOpen = false;
    }
  }
}
