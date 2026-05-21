import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UsuarioNavbar } from './usuario-navbar/usuario-navbar';
import { UsuarioSidebar } from './usuario-sidebar/usuario-sidebar';
import { Footer } from '../layout-principal/footer/footer';


@Component({
  selector: 'app-usuario-layout',
  standalone: true,
  imports: [RouterOutlet, UsuarioNavbar, UsuarioSidebar, Footer],
  templateUrl: './usuario-layout.html',
  styleUrls: ['./usuario-layout.css']
})
export class UsuarioLayout {
  isSidebarExpanded: boolean = false;

  toggleSidebar() {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  openSidebar() {
    this.isSidebarExpanded = true;
  }

  collapseSidebar() {
    this.isSidebarExpanded = false;
  }
}
