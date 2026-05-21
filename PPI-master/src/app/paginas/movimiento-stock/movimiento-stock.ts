import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Plus, Minus, ListFilter, RotateCcw } from 'lucide-angular';
import { AgregarEntrada } from '../agregar-entrada/agregar-entrada';
import { AgregarSalida } from '../agregar-salida/agregar-salida';
import { CalzadoService } from '../../nucleo/servicios/calzado.service';

interface Movimiento {
  id: number;
  fecha: string;
  tipo: 'ENTRADA' | 'SALIDA';
  modelo: string;
  talla: string;
  cantidad: number;
  usuario: string;
  observaciones: string;
}

@Component({
  selector: 'app-movimiento-stock',
  imports: [CommonModule, FormsModule, LucideAngularModule, AgregarEntrada, AgregarSalida],
  templateUrl: './movimiento-stock.html',
  styleUrl: './movimiento-stock.css',
})
export class MovimientoStock implements OnInit {
  readonly Search = Search;
  readonly Plus = Plus;
  readonly Minus = Minus;
  readonly ListFilter = ListFilter;
  readonly RotateCcw = RotateCcw;

  showFilters = false;

  showAddEntry = false;
  showAddOutput = false;

  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroTipo: string = '';
  filtroUsuario: string = '';
  busquedaModelo: string = '';

  movimientos: Movimiento[] = [];

  constructor(
    private calzadoService: CalzadoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    this.calzadoService.getMovimientos().subscribe({
      next: (data: any[]) => {
        this.movimientos = data.map(m => {
          const tipoNormalizado = m.tipo?.toUpperCase().trim();
          const esSalida = tipoNormalizado === 'SALIDA';
          
          return {
            id:            m.id_movimiento,
            fecha:         m.fecha_movimiento,
            tipo:          esSalida ? 'SALIDA' : 'ENTRADA',
            modelo:        m.modelo || 'Sin modelo',
            talla:         m.talla || '-',
            cantidad:      esSalida ? -Math.abs(m.cantidad) : Math.abs(m.cantidad),
            usuario:       m.nombre_usuario || 'Sistema',
            observaciones: m.descripcion || '',
          };
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando movimientos:', err)
    });
  }

  get usuariosUnicos(): string[] {
    return [...new Set(this.movimientos.map(m => m.usuario))];
  }

  get movimientosFiltrados(): Movimiento[] {
    return this.movimientos.filter(mov => {
      const cumpleTipo = !this.filtroTipo || mov.tipo === this.filtroTipo;
      const cumpleUsuario = !this.filtroUsuario || mov.usuario === this.filtroUsuario;
      const cumpleBusqueda = !this.busquedaModelo ||
        mov.modelo.toLowerCase().includes(this.busquedaModelo.toLowerCase());
      const fechaMovimiento = new Date(mov.fecha);
      const fechaDesde = this.filtroFechaDesde ? new Date(this.filtroFechaDesde) : null;
      const fechaHasta = this.filtroFechaHasta ? new Date(this.filtroFechaHasta) : null;
      const cumpleFechaDesde = !fechaDesde || fechaMovimiento >= fechaDesde;
      const cumpleFechaHasta = !fechaHasta || fechaMovimiento <= new Date(fechaHasta.getTime() + (24 * 60 * 60 * 1000) - 1);
      return cumpleTipo && cumpleUsuario && cumpleBusqueda && cumpleFechaDesde && cumpleFechaHasta;
    });
  }

  openAddEntry(): void  { this.showAddEntry = true; }
  closeAddEntry(): void { this.showAddEntry = false; this.cargarMovimientos(); }

  openAddOutput(): void  { this.showAddOutput = true; }
  closeAddOutput(): void { this.showAddOutput = false; this.cargarMovimientos(); }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  resetFilters() {
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroTipo = '';
    this.filtroUsuario = '';
    this.busquedaModelo = '';
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.filtroFechaDesde) count++;
    if (this.filtroFechaHasta) count++;
    if (this.filtroTipo) count++;
    if (this.filtroUsuario) count++;
    return count;
  }
}