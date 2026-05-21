import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { Footer } from './footer/footer';
import { Sidebar } from './sidebar/sidebar';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, Sidebar],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class MainLayout {
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
