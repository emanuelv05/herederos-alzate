import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  LucideAngularModule,
  PackageSearch,
  Tag,
  Truck,
  UserCheck,
  ArrowLeftRight,
  FileText
} from 'lucide-angular';
import { AuthService } from '../../../../nucleo/servicios/auth.service';

@Component({
  selector: 'app-usuario-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './usuario-sidebar.html',
  styleUrls: ['./usuario-sidebar.css']
})
export class UsuarioSidebar {

  @Input() isExpanded: boolean = true;
  @Output() menuNavigate = new EventEmitter<void>();

  // ICONOS
  readonly PackageSearch = PackageSearch;
  readonly Tag = Tag;
  readonly Truck = Truck;
  readonly UserCheck = UserCheck;
  readonly ArrowLeftRight = ArrowLeftRight;
  readonly FileText = FileText;

  get userName(): string {
    return this.auth.getUserName();
  }

  constructor(private router: Router, private auth: AuthService) {}

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  private collapseAfterNavigation() {
    this.menuNavigate.emit();
  }

  goCalzado() {
    this.router.navigate(['/usuario/calzado']);
    this.collapseAfterNavigation();
  }

  goCategorias() {
    this.router.navigate(['/usuario/categorias']);
    this.collapseAfterNavigation();
  }

  goProveedores() {
    this.router.navigate(['/usuario/proveedores']);
    this.collapseAfterNavigation();
  }

  goMovimientoStock() {
    this.router.navigate(['/usuario/movimiento-stock']);
    this.collapseAfterNavigation();
  }

  goFacturacion() {
    this.router.navigate(['/usuario/facturacion']);
    this.collapseAfterNavigation();
  }
}
