import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NuevoCalzado } from '../../../nuevo-calzado/nuevo-calzado';
import { LucideAngularModule, Plus, Pencil, Trash2, Search, ListFilter, RotateCcw, Filter, ChevronDown, ChevronRight } from 'lucide-angular';
import { AuthService } from '../../../../nucleo/servicios/auth.service';
import { CalzadoService } from '../../../../nucleo/servicios/calzado.service';
import Swal from 'sweetalert2';

type Status = 'En Stock' | 'Stock Bajo' | 'Sin Stock';

interface VariantColorItem {
  id: number; // id_variante
  talla: string;
  color: string;
  stock: number;
  proveedor: string;
  id_proveedor: number;
  estado: Status;
  groupColor?: string;
}

interface GroupedShoe {
  id_modelo: number;
  codigo: string;
  modelo: string;
  categoria: string;
  id_categoria: number;
  variantes: VariantColorItem[];
  totalVariantes: number;
  expanded?: boolean;
}

@Component({
  selector: 'app-calzado',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, NuevoCalzado, FormsModule],
  templateUrl: './calzado.html',
  styleUrl: './calzado.css'
})
export class Calzado implements OnInit {
  readonly Plus = Plus;
  readonly Pencil = Pencil;
  readonly Trash2 = Trash2;
  readonly Search = Search;
  readonly ListFilter = ListFilter;
  readonly Filter = Filter;
  readonly RotateCcw = RotateCcw;
  readonly ChevronDown = ChevronDown;
  readonly ChevronRight = ChevronRight;

  showFilters: boolean = false;
  showAddShoe: boolean = false;
  searchText: string = '';
  selectedCategory: string = 'Todas';
  selectedSize: string = 'Todas';
  selectedStatus: string = 'Todos';
  editShoeId: number | null = null;
  editModeloId: number | null = null;

  categorias: any[] = [];
  proveedores: any[] = [];

  editForm = {
    id:           0,
    codigo:       '',
    talla:        '',
    color:        '',
    stock:        0,
    id_proveedor: 0,
  };

  onStockChange(val: any) {
    console.log('Stock ha cambiado en el input:', val);
    console.trace();
  }

  shoesGrouped: GroupedShoe[] = [];
  filteredShoesGroupedList: GroupedShoe[] = [];

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;

  constructor(
    private auth: AuthService,
    private calzadoService: CalzadoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarCalzados();
    this.cargarCategorias();
    this.cargarProveedores();
  }

  isUsuario(): boolean { return this.auth.isUsuario(); }

  cargarCalzados() {
    this.calzadoService.getModelosCalzado().subscribe({
      next: (data: any[]) => {
        this.shoesGrouped = data.map(m => {
          const variantesActivas = m.variantes.filter((v: any) => v.activo);
          const variantes: VariantColorItem[] = variantesActivas.map((v: any) => ({
            id:           v.id_variante,
            talla:        v.talla,
            color:        v.color,
            stock:        v.stock_actual,
            proveedor:    v.nombre_proveedor,
            id_proveedor: v.id_proveedor,
            estado:       this.calcularEstado(v.stock_actual)
          }));

          return {
            id_modelo:    m.id_modelo,
            codigo:       m.codigo,
            modelo:       m.nombre_modelo,
            categoria:    m.nombre_categoria,
            id_categoria: m.id_categoria,
            variantes:    variantes,
            totalVariantes: variantes.length,
            expanded:     false
          };
        }).filter(m => m.totalVariantes > 0);
        
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando calzados:', err)
    });
  }

  cargarCategorias() {
    this.calzadoService.getCategorias().subscribe({
      next: (data) => { this.categorias = data; this.cdr.detectChanges(); },
      error: (err) => console.error('Error categorias:', err)
    });
  }

  cargarProveedores() {
    this.calzadoService.getProveedores().subscribe({
      next: (data) => { this.proveedores = data; this.cdr.detectChanges(); },
      error: (err) => console.error('Error proveedores:', err)
    });
  }

  calcularEstado(stock: number): Status {
    if (stock === 0)  return 'Sin Stock';
    if (stock <= 50)  return 'Stock Bajo';
    return 'En Stock';
  }

  getStatusClass(status: Status): string {
    if (status === 'En Stock')   return 'status-ok';
    if (status === 'Stock Bajo') return 'status-low';
    return 'status-out';
  }

  getStockClass(stock: number): string {
    if (stock === 0)  return 'stock-out';
    if (stock <= 50)  return 'stock-low';
    return 'strong';
  }

  openAddShoe(): void  { this.showAddShoe = true; }
  closeAddShoe(): void { this.showAddShoe = false; this.cargarCalzados(); }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  resetFilters() {
    this.selectedCategory = 'Todas';
    this.selectedSize = 'Todas';
    this.selectedStatus = 'Todos';
    this.searchText = '';
    this.applyFilters();
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.selectedCategory !== 'Todas') count++;
    if (this.selectedSize !== 'Todas') count++;
    if (this.selectedStatus !== 'Todos') count++;
    return count;
  }

  onFilterChange() {
    this.currentPage = 1; // Volver a la página 1 al filtrar
    this.applyFilters();
  }

  applyFilters() {
    const searchStr = this.searchText.toLowerCase();
    
    this.filteredShoesGroupedList = this.shoesGrouped.map(m => {
      const matchesSearchModel = !this.searchText || 
        m.codigo.toLowerCase().includes(searchStr) || 
        m.modelo.toLowerCase().includes(searchStr);
      
      let filteredVars = m.variantes.filter(v => {
        const matchesSearchVar = matchesSearchModel || 
          v.talla.toLowerCase().includes(searchStr) || 
          v.color.toLowerCase().includes(searchStr);
        
        const matchesSize = this.selectedSize === 'Todas' || v.talla === this.selectedSize;
        const matchesStatus = this.selectedStatus === 'Todos' || v.estado === this.selectedStatus;
        
        return matchesSearchVar && matchesSize && matchesStatus;
      });

      // Sort variants by size and calculate group colors
      filteredVars.sort((a, b) => {
        const numA = parseFloat(a.talla);
        const numB = parseFloat(b.talla);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.talla.localeCompare(b.talla);
      });

      let groupColorIndex = 0;
      const colors = ['#cde3f1', '#d6d6d6'];
      const sizeCounts: { [key: string]: number } = {};
      
      filteredVars.forEach(v => {
        sizeCounts[v.talla] = (sizeCounts[v.talla] || 0) + 1;
      });

      let currentSize = '';
      let currentColor = '';

      filteredVars.forEach(v => {
        if (sizeCounts[v.talla] === 1) {
          v.groupColor = '#ffffff'; // Blanco si es el unico de esa talla
        } else {
          if (v.talla !== currentSize) {
            currentSize = v.talla;
            currentColor = colors[groupColorIndex % colors.length];
            groupColorIndex++;
          }
          v.groupColor = currentColor;
        }
      });

      const matchesCategory = this.selectedCategory === 'Todas' || m.categoria === this.selectedCategory;
      
      const isFiltered = this.searchText !== '' || this.selectedSize !== 'Todas' || this.selectedStatus !== 'Todos' || this.selectedCategory !== 'Todas';

      return {
        ...m,
        variantes: matchesCategory ? filteredVars : [],
        totalVariantes: matchesCategory ? filteredVars.length : 0,
        expanded: isFiltered ? true : m.expanded
      };
    }).filter(m => m.totalVariantes > 0);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredShoesGroupedList.length / this.itemsPerPage) || 1;
  }

  get paginatedShoes(): GroupedShoe[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredShoesGroupedList.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  toggleExpand(m: GroupedShoe) {
    m.expanded = !m.expanded;
  }

  trackById(index: number, m: GroupedShoe): number { return m.id_modelo; }

  editShoe(m: GroupedShoe, v: VariantColorItem): void {
    console.log('Abriendo edición para:', { modelo: m.modelo, talla: v.talla, color: v.color, stock: v.stock });
    if (this.editShoeId === v.id) { this.cancelEdit(); return; }
    this.editShoeId = v.id;
    this.editModeloId = m.id_modelo;
    this.editForm = {
      id:           v.id,
      codigo:       m.codigo,
      talla:        v.talla,
      color:        v.color,
      stock:        v.stock,
      id_proveedor: v.id_proveedor,
    };
  }

  saveEdit(): void {
    if (!this.editShoeId || !this.editModeloId) return;

    if (!this.editForm.talla || !this.editForm.color || this.editForm.stock === null || this.editForm.stock === undefined || this.editForm.stock < 0 || !this.editForm.id_proveedor) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos o inválidos',
        text: 'Por favor completa todos los campos (Talla, Color, Stock, Proveedor). El stock no puede ser negativo.',
        confirmButtonColor: '#0071bc'
      });
      return;
    }

    // Buscar la variante original para ver si hubo cambios
    const originalModel = this.shoesGrouped.find(m => m.id_modelo === this.editModeloId);
    if (originalModel) {
      const originalVariant = originalModel.variantes.find((v: any) => v.id === this.editShoeId);
      if (originalVariant) {
        if (
          this.editForm.talla === originalVariant.talla &&
          this.editForm.color.trim() === originalVariant.color.trim() &&
          Number(this.editForm.stock) === Number(originalVariant.stock) &&
          this.editForm.id_proveedor === originalVariant.id_proveedor
        ) {
          Swal.fire({
            icon: 'info',
            title: 'Sin cambios',
            text: 'No has modificado ningún valor. Cambia algún dato antes de guardar o dale a Cancelar.',
            confirmButtonColor: '#0071bc'
          });
          return;
        }
      }
    }

    console.log('Enviando stock:', this.editForm.stock, typeof this.editForm.stock);
    
    const payloadVariante = {
      talla: this.editForm.talla,
      color: this.editForm.color,
      stock_actual: Number(this.editForm.stock), // Asegurar que sea número
      id_proveedor: this.editForm.id_proveedor,
    };

    const editId = this.editShoeId;
    const modelId = this.editModeloId;

    this.calzadoService.updateVarianteCalzado(editId, payloadVariante).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Guardado',
          text: 'Variante actualizada correctamente.',
          timer: 1500,
          showConfirmButton: false
        });
        this.cargarCalzados();
        this.cancelEdit();
      },
      error: (err) => {
        if (err.status === 400 && err.error && err.error.non_field_errors && err.error.non_field_errors[0].includes('unique set')) {
          const existingVariant = this.findVariant(modelId, payloadVariante.talla, payloadVariante.color, payloadVariante.id_proveedor);
          if (existingVariant && existingVariant.id !== editId) {
            const sumStock = payloadVariante.stock_actual + existingVariant.stock;
            Swal.fire({
              icon: 'question',
              title: 'Variante existente',
              html: `Ya existe el color "${payloadVariante.color}" para la talla ${payloadVariante.talla} con el mismo proveedor.<br><br>¿Deseas fusionarlos?<br>Esto sumará los stocks (${payloadVariante.stock_actual} + ${existingVariant.stock} = <b>${sumStock}</b>) y unificará la variante.`,
              showCancelButton: true,
              confirmButtonColor: '#0071bc',
              cancelButtonColor: '#d33',
              confirmButtonText: 'Sí, fusionar',
              cancelButtonText: 'Cancelar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.mergeVariants(editId, existingVariant.id, sumStock);
              }
            });
          } else {
            Swal.fire('Error', 'Combinación de talla, color y proveedor ya existe o es inválida.', 'error');
          }
        } else {
          Swal.fire('Error', 'Hubo un error al actualizar el calzado.', 'error');
          console.error('Error actualizando variante:', err);
        }
      }
    });
  }

  findVariant(id_modelo: number, talla: string, color: string, id_proveedor: number): VariantColorItem | null {
    const modelo = this.shoesGrouped.find(m => m.id_modelo === id_modelo);
    if (!modelo) return null;
    
    const variant = modelo.variantes.find(v => 
      v.talla === talla &&
      v.color.toLowerCase().trim() === color.toLowerCase().trim() &&
      v.id_proveedor === id_proveedor
    );
    return variant || null;
  }

  mergeVariants(oldId: number, targetId: number, newStock: number) {
    this.calzadoService.updateVarianteCalzado(targetId, { stock_actual: newStock }).subscribe({
      next: () => {
        this.calzadoService.deleteVarianteCalzado(oldId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Fusionado con éxito',
              text: 'Las variantes se han fusionado y el stock ha sido sumado.',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarCalzados();
            this.cancelEdit();
          },
          error: (err) => {
            console.error('Error eliminando variante antigua:', err);
            Swal.fire({
              icon: 'warning',
              title: 'Fusión parcial',
              text: 'Se sumó el stock al color existente, pero hubo un problema al ocultar la variante antigua.',
              confirmButtonColor: '#0071bc'
            });
            this.cargarCalzados();
            this.cancelEdit();
          }
        });
      },
      error: (err) => {
        console.error('Error fusionando variante:', err);
        Swal.fire('Error', 'Hubo un error al intentar actualizar el stock de la variante existente.', 'error');
      }
    });
  }

  cancelEdit(): void { this.editShoeId = null; this.editModeloId = null; }

  deleteModel(m: GroupedShoe): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro?',
      html: `Estás a punto de eliminar <b>TODO</b> el modelo <b>"${m.modelo}" (#${m.codigo})</b> y <b>TODAS</b> sus variantes.<br><br>Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.calzadoService.deleteModeloCalzado(m.id_modelo).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El modelo y todas sus variantes han sido eliminados.',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarCalzados();
          },
          error: (err) => {
            console.error('Error eliminando modelo:', err);
            Swal.fire('Error', 'Hubo un error al eliminar el modelo.', 'error');
          }
        });
      }
    });
  }

  deleteShoe(m: GroupedShoe, v: VariantColorItem): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar variante?',
      html: `Vas a eliminar la variante de talla <b>${v.talla}</b> y color <b>${v.color}</b> del modelo <b>"${m.modelo}" (#${m.codigo})</b>.`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.calzadoService.deleteVarianteCalzado(v.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La variante ha sido eliminada correctamente.',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarCalzados();
          },
          error: (err) => {
            console.error('Error eliminando variante:', err);
            Swal.fire('Error', 'Hubo un error al eliminar la variante.', 'error');
          }
        });
      }
    });
  }

}