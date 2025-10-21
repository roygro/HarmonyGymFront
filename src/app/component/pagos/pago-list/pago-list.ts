import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // ← CORRECTO
import { FormsModule } from '@angular/forms';
import { PagoService, Pago, EstadisticasDia } from '../../../services/pagos/pago';

@Component({
  selector: 'app-pago-list',
  templateUrl: './pago-list.html',
  styleUrls: ['./pago-list.css'],
  imports: [CommonModule, FormsModule] // ← AGREGAR ESTO
})
export class PagoList implements OnInit {
  pagos: Pago[] = [];
  estadisticas: EstadisticasDia = { totalVentas: 0, cantidadVentas: 0 };
  
  cargando: boolean = true;
  cargandoEstadisticas: boolean = true;
  error: string = '';

  // Filtros
  filtroCliente: string = '';
  filtroRecepcionista: string = '';

  constructor(
    private pagoService: PagoService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarPagos();
    this.cargarEstadisticas();
  }

  cargarPagos(): void {
    this.cargando = true;
    this.error = '';
    
    this.pagoService.obtenerPagos().subscribe({
      next: (pagos) => {
        this.pagos = pagos;
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los pagos';
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  cargarEstadisticas(): void {
    this.cargandoEstadisticas = true;
    
    this.pagoService.obtenerEstadisticasDia().subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
        this.cargandoEstadisticas = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.cargandoEstadisticas = false;
      }
    });
  }

  // Filtrar pagos
  get pagosFiltrados(): Pago[] {
    let filtered = this.pagos;

    if (this.filtroCliente) {
      filtered = filtered.filter(pago => 
        pago.folioCliente.toLowerCase().includes(this.filtroCliente.toLowerCase())
      );
    }

    if (this.filtroRecepcionista) {
      filtered = filtered.filter(pago => 
        pago.idRecepcionista.toLowerCase().includes(this.filtroRecepcionista.toLowerCase())
      );
    }

    return filtered;
  }

  // Limpiar filtros
  limpiarFiltros(): void {
    this.filtroCliente = '';
    this.filtroRecepcionista = '';
  }

  // Navegar a detalles
  verDetalles(pago: Pago): void {
    if (pago.idVenta) {
      this.router.navigate(['/pagos', pago.idVenta]);
    }
  }

  // Navegar a crear nuevo pago
  crearPago(): void {
    this.router.navigate(['/pagos/crear']);
  }

  // Formateadores
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  // Obtener badge según el tipo de producto
  getBadgeClass(codigoProducto: string): string {
    if (codigoProducto.startsWith('MEM_')) {
      return 'bg-primary'; // Membresías - azul
    } else if (codigoProducto.startsWith('PROD')) {
      return 'bg-success'; // Productos - verde
    }
    return 'bg-secondary'; // Otros - gris
  }

  // Calcular total de los pagos filtrados
  get totalFiltrado(): number {
    return this.pagosFiltrados.reduce((total, pago) => total + pago.total, 0);
  }

  // Recargar datos
  recargar(): void {
    this.cargarPagos();
    this.cargarEstadisticas();
  }
}