import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  LucideAngularModule,
  Users,
  PackageSearch,
  Tag,
  Truck,
  UserCog,
  ArrowLeftRight,
  FileText
} from 'lucide-angular';
import { AuthService } from '../../../../nucleo/servicios/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {

  @Input() isExpanded: boolean = true;
  @Output() menuNavigate = new EventEmitter<void>();

  // ICONOS
  readonly Users = Users;
  readonly PackageSearch = PackageSearch;
  readonly Tag = Tag;
  readonly Truck = Truck;
  readonly UserCog = UserCog;
  readonly ArrowLeftRight = ArrowLeftRight;
  readonly FileText = FileText;

  // USUARIO
  get user() {
    return { name: this.auth.getUserName() };
  }

  constructor(private router: Router, private auth: AuthService) {}

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  private collapseAfterNavigation() {
    this.menuNavigate.emit();
  }

  goEditarEmpleado() {
    this.router.navigate(['/editar-empleado']);
    this.collapseAfterNavigation();
  }

  goCalzado() {
    this.router.navigate(['/calzado']);
    this.collapseAfterNavigation();
  }
  
  goEditarCalzado() {
    this.router.navigate(['/editar-calzado']);
    this.collapseAfterNavigation();
  }

  goCategorias() {
    this.router.navigate(['/categorias']);
    this.collapseAfterNavigation();
  }
  
  goEditarCategorias() {
    this.router.navigate(['/editar-categoria']);
    this.collapseAfterNavigation();
  }

  goProveedores() {
    this.router.navigate(['/proveedores']);
    this.collapseAfterNavigation();
  }
  
  goEditarProveedores() {
    this.router.navigate(['/editar-proveedores']);
    this.collapseAfterNavigation();
  }

  goMovimientoStock() {
    this.router.navigate(['/movimiento-stock']);
    this.collapseAfterNavigation();
  }

  goFacturacion() {
    this.router.navigate(['/facturacion']);
    this.collapseAfterNavigation();
  }
}
