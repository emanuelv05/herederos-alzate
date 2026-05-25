import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../nucleo/servicios/auth.service';
import {
  LucideAngularModule,
  Download,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  type LucideIconData
} from 'lucide-angular';
import { CalzadoService } from '../../nucleo/servicios/calzado.service';
import { forkJoin } from 'rxjs';

type StockStatus = 'Stock Bajo' | 'Sin Stock';
type MovementType = 'ENTRADA' | 'SALIDA';

interface StatCard {
  label: string;
  value: string;
  icon: LucideIconData;
  tone: 'purple' | 'cyan' | 'orange' | 'red';
}

interface LowStockItem {
  codigo: string;
  modelo: string;
  talla: string;
  color: string;
  stock: number;
  minimo: number;
  proveedor: string;
  estado: StockStatus;
}

interface RecentMovement {
  fecha: string;
  tipo: MovementType;
  modelo: string;
  talla: string;
  cantidad: string;
  usuario: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  readonly Download = Download;
  readonly AlertTriangle = AlertTriangle;
  readonly Package = Package;

  stats: StatCard[] = [];
  lowStockItems: LowStockItem[] = [];
  recentMovements: RecentMovement[] = [];
  
  // Power BI Style Selection
  allCalzados: any[] = [];
  filtroActual: string = 'Total Calzado';
  donutPercentage: number = 100;

  constructor(
    private router: Router, 
    private auth: AuthService,
    private calzadoService: CalzadoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    forkJoin({
      calzados: this.calzadoService.getModelosCalzado(),
      movimientos: this.calzadoService.getMovimientos()
    }).subscribe({
      next: ({ calzados, movimientos }) => {
        const variantes: any[] = [];
        calzados.forEach((m: any) => {
          if (m.variantes) {
            m.variantes.forEach((v: any) => {
              if (v.activo) {
                variantes.push({
                  codigo: m.codigo,
                  modelo: m.nombre_modelo,
                  talla: v.talla,
                  color: v.color,
                  stock_actual: v.stock_actual,
                  nombre_proveedor: v.nombre_proveedor || m.nombre_proveedor || ''
                });
              }
            });
          }
        });

        this.allCalzados = variantes;
        this.procesarEstadisticas(variantes);
        this.procesarMovimientos(movimientos);
        this.actualizarVistaDetalle();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando datos del dashboard:', err)
    });
  }

  cambiarFiltro(label: string) {
    this.filtroActual = label;
    this.actualizarVistaDetalle();
  }

  private actualizarVistaDetalle() {
    const items = this.getItemsFiltrados();
    const total = this.allCalzados.length || 1;
    this.donutPercentage = Math.round((items.length / total) * 100);
    
    this.lowStockItems = items.map(c => ({
      codigo: c.codigo,
      modelo: c.modelo,
      talla: c.talla,
      color: c.color,
      stock: c.stock_actual,
      minimo: 50,
      proveedor: c.nombre_proveedor,
      estado: c.stock_actual <= 0 ? 'Sin Stock' : (c.stock_actual <= 50 ? 'Stock Bajo' : 'En Stock') as StockStatus
    }));
  }

  getItemsFiltrados(): any[] {
    switch (this.filtroActual) {
      case 'En Stock':
        return this.allCalzados.filter(c => c.stock_actual > 0);
      case 'Stock Bajo':
        return this.allCalzados.filter(c => c.stock_actual > 0 && c.stock_actual <= 50);
      case 'Sin Stock':
        return this.allCalzados.filter(c => (c.stock_actual || 0) <= 0);
      default:
        return this.allCalzados;
    }
  }

  private procesarEstadisticas(calzados: any[]) {
    const totalModelos = calzados.length;
    const stockTotal = calzados.reduce((acc, c) => acc + (c.stock_actual || 0), 0);
    const bajoStockCount = calzados.filter(c => c.stock_actual > 0 && c.stock_actual <= 50).length;
    const sinStockCount = calzados.filter(c => (c.stock_actual || 0) <= 0).length;

    this.stats = [
      { label: 'Total Calzado', value: totalModelos.toLocaleString(), icon: Package, tone: 'purple' },
      { label: 'En Stock', value: stockTotal.toLocaleString(), icon: TrendingUp, tone: 'cyan' },
      { label: 'Stock Bajo', value: bajoStockCount.toLocaleString(), icon: AlertTriangle, tone: 'orange' },
      { label: 'Sin Stock', value: sinStockCount.toLocaleString(), icon: TrendingDown, tone: 'red' }
    ];
  }

  private procesarMovimientos(movimientos: any[]) {
    // Tomamos los últimos 5 movimientos
    const ultimos = movimientos.slice(0, 5);
    this.recentMovements = ultimos.map(m => ({
      fecha: m.fecha_movimiento,
      tipo: m.tipo?.toUpperCase() === 'ENTRADA' ? 'ENTRADA' : 'SALIDA',
      modelo: m.modelo,
      talla: m.talla,
      cantidad: m.tipo?.toUpperCase() === 'ENTRADA' ? `+${m.cantidad}` : `-${Math.abs(m.cantidad)}`,
      usuario: m.nombre_usuario
    }));
  }

  private procesarBajoStock(calzados: any[]) {
    // Productos con stock <= 50
    const criticos = calzados.filter(c => (c.stock_actual || 0) > 0 && (c.stock_actual || 0) <= 50).slice(0, 8); // Limitamos a 8 para no saturar
    this.lowStockItems = criticos.map(c => ({
      codigo: c.codigo,
      modelo: c.modelo,
      talla: c.talla,
      color: c.color,
      stock: c.stock_actual,
      minimo: 50, // Hardcoded as agreed
      proveedor: c.nombre_proveedor,
      estado: c.stock_actual <= 0 ? 'Sin Stock' : 'Stock Bajo'
    }));
  }

  getStatToneClass(tone: StatCard['tone']): string {
    const classes: Record<StatCard['tone'], string> = {
      purple: 'tone-purple',
      cyan: 'tone-cyan',
      orange: 'tone-orange',
      red: 'tone-red'
    };

    return classes[tone];
  }

  getStockStatusClass(status: StockStatus): string {
    return status === 'Sin Stock' ? 'status-out' : 'status-low';
  }

  getMovementTypeClass(type: MovementType): string {
    return type === 'ENTRADA' ? 'type-in' : 'type-out';
  }

  getQuantityClass(quantity: string): string {
    return quantity.startsWith('+') ? 'qty-in' : 'qty-out';
  }

  private basePath(): string {
    return this.auth.isUsuario() ? '/usuario' : '';
  }

  goToInventory(): void {
    this.router.navigate([`${this.basePath()}/calzado`]);
  }

  verHistorialCompleto(): void {
    this.router.navigate([`${this.basePath()}/movimiento-stock`]);
  }
}
