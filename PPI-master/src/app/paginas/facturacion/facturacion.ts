import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, FileText, Printer, ArrowLeft, Download, FileDown, FileSpreadsheet, Eraser } from 'lucide-angular';
import { CalzadoService } from '../../nucleo/servicios/calzado.service';
import { AuthService } from '../../nucleo/servicios/auth.service';
import Swal from 'sweetalert2';

interface Movimiento {
  id: number;
  fecha: string;
  tipo: string;
  modelo: string;
  talla: string;
  cantidad: number;
  usuario: string;
  id_usuario?: number;
  observaciones: string;
  tiene_firma?: boolean;
}

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [DecimalPipe],
  templateUrl: './facturacion.html',
  styleUrl: './facturacion.css'
})
export class Facturacion implements OnInit {
  readonly Search = Search;
  readonly FileText = FileText;
  readonly Printer = Printer;
  readonly ArrowLeft = ArrowLeft;
  readonly Download = Download;
  readonly FileDown = FileDown;
  readonly FileSpreadsheet = FileSpreadsheet;
  readonly Eraser = Eraser;

  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private lastX = 0;
  private lastY = 0;

  modoFirma: 'manual' | 'escrita' = 'manual';
  nombreFirma: string = '';

  busquedaModelo: string = '';
  movimientosSalida: Movimiento[] = [];
  facturaSeleccionada: Movimiento | null = null;
  
  firmaGuardada: any = null; // { tipo_firma, firma_base64, nombre_firma }
  guardandoFirma: boolean = false;
  
  miFirmaManual: any = null;
  miFirmaEscrita: any = null;
  dibujandoNueva: boolean = false;
  escribiendoNueva: boolean = false;
  usarFirmaGuardada: boolean = false;
  puedeFirmar: boolean = false;
  haDibujado: boolean = false;

  constructor(
    private calzadoService: CalzadoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarSalidas();
    this.cargarMisFirmas();
  }

  cargarMisFirmas() {
    const userId = Number(sessionStorage.getItem('userId'));
    if (!userId) return;
    this.calzadoService.obtenerMisFirmas(userId).subscribe({
      next: (data) => {
        console.log('Firmas cargadas desde el backend:', data);
        this.miFirmaManual = data.find(f => f.tipo_firma === 'manual');
        this.miFirmaEscrita = data.find(f => f.tipo_firma === 'escrita');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando historial de firmas:', err)
    });
  }

  cargarSalidas() {
    this.calzadoService.getMovimientos().subscribe({
      next: (data: any[]) => {
        // Solo salidas
        const salidas = data.filter(m => m.tipo?.toUpperCase() === 'SALIDA');
        this.movimientosSalida = salidas.map(m => ({
          id:            m.id_movimiento,
          fecha:         m.fecha_movimiento,
          tipo:          'SALIDA',
          modelo:        m.modelo,
          talla:         m.talla,
          cantidad:      Math.abs(m.cantidad),
          usuario:       m.nombre_usuario,
          id_usuario:    m.id_usuario,
          observaciones: m.descripcion,
          tiene_firma:   m.tiene_firma,
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando salidas:', err)
    });
  }

  get salidasFiltradas(): Movimiento[] {
    return this.movimientosSalida.filter(mov => {
      return !this.busquedaModelo || mov.modelo.toLowerCase().includes(this.busquedaModelo.toLowerCase());
    });
  }

  generarFactura(mov: Movimiento) {
    this.facturaSeleccionada = mov;
    this.firmaGuardada = null;
    this.usarFirmaGuardada = false;
    this.dibujandoNueva = false;
    this.escribiendoNueva = false;
    this.haDibujado = false;

    const isAdmin = this.authService.isAdmin();
    const userId = Number(sessionStorage.getItem('userId'));
    
    // Si es administrador o si la factura fue creada por el usuario actual
    this.puedeFirmar = isAdmin || (Number(mov.id_usuario) === userId);
    
    console.log('Permisos de firma evaluados -> isAdmin:', isAdmin, 'userId:', userId, 'creadorFactura:', mov.id_usuario, '=> puedeFirmar:', this.puedeFirmar);

    if (mov.tiene_firma) {
      this.calzadoService.obtenerFirma(mov.id).subscribe({
        next: (res) => {
          this.firmaGuardada = res;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al obtener la firma:', err)
      });
    } else {
      if (this.puedeFirmar) {
        this.cdr.detectChanges();
        setTimeout(() => {
          this.prepararVistaFirma();
        }, 100);
      } else {
        this.cdr.detectChanges();
      }
    }
  }

  prepararVistaFirma() {
    if (this.modoFirma === 'manual' && (!this.miFirmaManual || this.dibujandoNueva)) {
      this.initCanvas();
    }
  }

  cerrarFactura() {
    this.facturaSeleccionada = null;
    this.nombreFirma = '';
    this.modoFirma = 'manual';
    this.firmaGuardada = null;
    this.usarFirmaGuardada = false;
    this.dibujandoNueva = false;
    this.escribiendoNueva = false;
    this.haDibujado = false;
  }

  setModoFirma(modo: 'manual' | 'escrita') {
    this.modoFirma = modo;
    this.usarFirmaGuardada = false;
    setTimeout(() => this.prepararVistaFirma(), 50);
  }

  seleccionarFirmaGuardada() {
    this.usarFirmaGuardada = true;
    this.dibujandoNueva = false;
    this.escribiendoNueva = false;
  }

  dibujarNueva() {
    this.dibujandoNueva = true;
    this.usarFirmaGuardada = false;
    this.haDibujado = false;
    setTimeout(() => this.initCanvas(), 50);
  }

  escribirNueva() {
    this.escribiendoNueva = true;
    this.usarFirmaGuardada = false;
  }

  habilitarReFirma() {
    this.firmaGuardada = null;
    this.usarFirmaGuardada = false;
    this.dibujandoNueva = false;
    this.escribiendoNueva = false;
    this.haDibujado = false;
    setTimeout(() => this.prepararVistaFirma(), 100);
  }

  // --- Lógica de Firma Digital ---
  private initCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    // Ajustar tamaño del canvas a su contenedor real
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Configuración del trazo
    this.ctx.strokeStyle = '#0f172a';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Eventos de Mouse
    canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    canvas.addEventListener('mousemove', (e) => this.draw(e));
    canvas.addEventListener('mouseup', () => this.stopDrawing());
    canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Eventos Touch (Móvil)
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrawing(touch);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw(touch);
    }, { passive: false });

    canvas.addEventListener('touchend', () => this.stopDrawing());
  }

  private startDrawing(e: MouseEvent | Touch) {
    this.isDrawing = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.lastX = (e instanceof MouseEvent ? e.clientX : e.clientX) - rect.left;
    this.lastY = (e instanceof MouseEvent ? e.clientY : e.clientY) - rect.top;
  }

  private draw(e: MouseEvent | Touch) {
    if (!this.isDrawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = (e instanceof MouseEvent ? e.clientX : e.clientX) - rect.left;
    const y = (e instanceof MouseEvent ? e.clientY : e.clientY) - rect.top;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
    this.haDibujado = true;
  }

  private stopDrawing() {
    this.isDrawing = false;
  }

  limpiarFirma() {
    if (!this.ctx) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.haDibujado = false;
  }

  guardarFirmaBackend() {
    if (!this.facturaSeleccionada) return;

    const userId = Number(sessionStorage.getItem('userId'));
    let payload: any = { id_usuario: userId };

    if (this.usarFirmaGuardada) {
      if (this.modoFirma === 'manual' && this.miFirmaManual) {
        payload = {
          tipo_firma: 'manual',
          firma_base64: this.miFirmaManual.firma_base64
        };
      } else if (this.modoFirma === 'escrita' && this.miFirmaEscrita) {
        payload = {
          tipo_firma: 'escrita',
          nombre_firma: this.miFirmaEscrita.nombre_firma
        };
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Firma no encontrada',
          text: 'No se pudo usar la firma guardada.',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    } else {
      payload.tipo_firma = this.modoFirma;
      if (this.modoFirma === 'manual') {
        if (!this.canvasRef || !this.haDibujado) {
          Swal.fire({
            icon: 'warning',
            title: 'Firma vacía',
            text: 'Por favor, dibuja tu firma antes de guardar.',
            confirmButtonColor: '#3b82f6'
          });
          return;
        }
        const canvas = this.canvasRef.nativeElement;
        payload.firma_base64 = canvas.toDataURL('image/png');
      } else {
        if (!this.nombreFirma.trim()) {
          Swal.fire({
            icon: 'warning',
            title: 'Nombre requerido',
            text: 'Debe ingresar su nombre para la firma escrita.',
            confirmButtonColor: '#3b82f6'
          });
          return;
        }
        payload.nombre_firma = this.nombreFirma.trim();
      }
    }

    this.guardandoFirma = true;
    this.calzadoService.guardarFirma(this.facturaSeleccionada.id, payload).subscribe({
      next: (res) => {
        this.guardandoFirma = false;
        this.facturaSeleccionada!.tiene_firma = true;
        this.firmaGuardada = res;
        this.usarFirmaGuardada = false;
        this.dibujandoNueva = false;
        this.escribiendoNueva = false;
        // Actualizar el estado en la lista para que refleje que ya tiene firma
        const movIdx = this.movimientosSalida.findIndex(m => m.id === this.facturaSeleccionada!.id);
        if (movIdx !== -1) {
          this.movimientosSalida[movIdx].tiene_firma = true;
        }
        // Recargar historial de firmas
        this.cargarMisFirmas();
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'success',
          title: 'Firma guardada',
          text: 'Firma guardada correctamente.',
          confirmButtonColor: '#3b82f6'
        });
      },
      error: (err) => {
        this.guardandoFirma = false;
        console.error('Error al guardar firma', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al guardar la firma.',
          confirmButtonColor: '#3b82f6'
        });
      }
    });
  }

  exportarPDF() {
    window.print();
  }

  exportarExcel() {
    if (!this.facturaSeleccionada) return;

    const f = this.facturaSeleccionada;
    // Encabezados y datos en formato CSV con punto y coma para Excel en español
    const headers = ['No. Remision', 'Fecha', 'Atendido por', 'Producto', 'Modelo', 'Talla', 'Cantidad', 'Firmado', 'Observaciones'].join(';');
    const data = [
      `#${f.id}`,
      f.fecha,
      f.usuario,
      'Calzado',
      f.modelo,
      f.talla,
      f.cantidad,
      this.firmaGuardada ? (this.firmaGuardada.tipo_firma === 'manual' ? 'SI (Manual)' : `SI (${this.firmaGuardada.nombre_firma})`) : 'NO',
      f.observaciones || ''
    ].join(';');

    const csvContent = '\uFEFF' + headers + '\n' + data; // \uFEFF es el BOM para UTF-8 en Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Remision_${f.id}_${f.modelo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
