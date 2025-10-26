import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PagoService, Pago } from '../../../services/pagos/pago';
import { HeaderRecepcionistaComponent } from '../../recepcionista/header-recepcionista/header-recepcionista';

@Component({
  selector: 'app-pago-details',
  standalone: true,
  imports: [CommonModule, HeaderRecepcionistaComponent],
  templateUrl: './pago-details.html',
  styleUrls: ['./pago-details.css']
})
export class PagoDetails implements OnInit {
  pago: Pago | null = null;
  cargando: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagoService: PagoService
  ) { }

  ngOnInit(): void {
    this.cargarPago();
  }

  cargarPago(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.error = 'ID de pago no válido';
      this.cargando = false;
      return;
    }

    this.cargando = true;
    this.error = '';

    this.pagoService.obtenerPagoPorId(+id).subscribe({
      next: (pago) => {
        this.pago = pago;
        this.cargando = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los detalles del pago';
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  // Navegar de regreso a la lista
  volverALista(): void {
    this.router.navigate(['/pagos']);
  }

  // Imprimir comprobante
  imprimirComprobante(): void {
    window.print();
  }

  // Formateadores
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  // Determinar tipo de producto
  getTipoProducto(codigo: string): string {
    if (codigo.startsWith('MEM_')) {
      return 'Membresía';
    } else if (codigo.startsWith('PROD')) {
      return 'Producto';
    }
    return 'Servicio';
  }

  // Obtener clase del badge según tipo
  getBadgeClass(codigoProducto: string): string {
    if (codigoProducto.startsWith('MEM_')) {
      return 'bg-primary';
    } else if (codigoProducto.startsWith('PROD')) {
      return 'bg-success';
    }
    return 'bg-secondary';
  }

  // Calcular subtotal (sin IVA)
  get subtotal(): number {
    return this.pago ? this.pago.total : 0;
  }

  // Generar folio para comprobante
  get folioComprobante(): string {
    if (!this.pago?.idVenta) return '';
    return `COMP-${this.pago.idVenta.toString().padStart(6, '0')}`;
  }

  // Recargar datos
  recargar(): void {
    this.cargarPago();
  }
}