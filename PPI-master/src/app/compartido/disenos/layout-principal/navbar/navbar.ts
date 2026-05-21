import { Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { LucideAngularModule, Menu, Settings, User, LogOut, UserCog } from 'lucide-angular';
import { AuthService } from '../../../../nucleo/servicios/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {

  @Output() menuClick = new EventEmitter<void>();

  readonly Menu = Menu;
  readonly Settings = Settings;
  readonly User = User;
  readonly LogOut = LogOut;

  readonly UserCog = UserCog;

  isSettingsOpen: boolean = false;

  get userName(): string {
    return this.auth.getUserName();
  }

  constructor(private elementRef: ElementRef, private router: Router, private auth: AuthService) {}

  onMenuClick() {
    this.menuClick.emit();
  }

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
  }

  goHome() {
    this.router.navigate(['home']);
  }

  goProfile() {
    this.isSettingsOpen = false;
    this.router.navigate(['/perfil']);
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
