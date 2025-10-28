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

  // Propiedades para los nombres
  clientes: any[] = [];
  recepcionistas: any[] = [];
  productos: any[] = [];
  membresias: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagoService: PagoService
  ) { }

  ngOnInit(): void {
    this.cargarPago();
    this.cargarNombres();
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

  // Método para cargar los nombres
  cargarNombres(): void {
    this.pagoService.obtenerClientes().subscribe({
      next: (clientes: any) => {
        this.clientes = clientes;
      },
      error: (error: any) => {
        console.error('Error al cargar clientes:', error);
      }
    });

    this.pagoService.obtenerRecepcionistas().subscribe({
      next: (recepcionistas: any) => {
        this.recepcionistas = recepcionistas;
      },
      error: (error: any) => {
        console.error('Error al cargar recepcionistas:', error);
      }
    });

    this.pagoService.obtenerProductos().subscribe({
      next: (productos: any) => {
        this.productos = productos;
      },
      error: (error: any) => {
        console.error('Error al cargar productos:', error);
      }
    });

    this.pagoService.obtenerTiposMembresia().subscribe({
      next: (membresias: any) => {
        this.membresias = membresias;
      },
      error: (error: any) => {
        console.error('Error al cargar membresías:', error);
      }
    });
  }

  // Métodos para obtener nombres
  obtenerNombreCliente(folio: string): string {
    const cliente = this.clientes.find((c: any) => c.folioCliente === folio);
    return cliente ? cliente.nombre : folio;
  }

  obtenerNombreRecepcionista(id: string): string {
    const recepcionista = this.recepcionistas.find((r: any) => r.idRecepcionista === id);
    return recepcionista ? recepcionista.nombre : id;
  }

  obtenerNombreProducto(codigo: string | undefined): string {
    if (!codigo) {
      return 'Producto no especificado';
    }
    
    // Buscar en productos
    const producto = this.productos.find((p: any) => p.codigo === codigo);
    if (producto) return producto.nombre;
    
    // Buscar en membresías
    const membresia = this.membresias.find((m: any) => m.codigo === codigo);
    if (membresia) return membresia.nombre;
    
    return codigo;
  }

  // NUEVO MÉTODO PARA OBTENER EL NOMBRE CORRECTO SEGÚN EL TIPO DE PAGO
  obtenerNombreProductoMembresia(): string {
    if (!this.pago) return 'Producto no especificado';
    
    // Si es membresía, usar idMembresia
    if (this.pago.tipoPago === 'membresia' && this.pago.idMembresia) {
      const membresia = this.membresias.find((m: any) => m.codigo === this.pago!.idMembresia);
      return membresia ? membresia.nombre : this.pago.idMembresia;
    }
    
    // Si es producto, usar codigoProducto
    if (this.pago.tipoPago === 'producto' && this.pago.codigoProducto) {
      const producto = this.productos.find((p: any) => p.codigo === this.pago!.codigoProducto);
      return producto ? producto.nombre : this.pago.codigoProducto;
    }
    
    return 'Producto no especificado';
  }

  obtenerDescripcionProducto(codigo: string | undefined): string {
    if (!codigo) {
      return 'Descripción no disponible';
    }
    
    // Buscar en productos
    const producto = this.productos.find((p: any) => p.codigo === codigo);
    if (producto) return producto.descripcion || 'Producto general';
    
    // Buscar en membresías
    const membresia = this.membresias.find((m: any) => m.codigo === codigo);
    if (membresia) return membresia.descripcion || 'Membresía del gimnasio';
    
    return 'Servicio general';
  }

  obtenerDuracionMembresia(codigo: string | undefined): string {
    if (!codigo) {
      return 'Duración no especificada';
    }
    
    const membresia = this.membresias.find((m: any) => m.codigo === codigo);
    if (membresia) {
      return membresia.duracion || '30 días';
    }
    
    return 'No aplica';
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

  formatearFechaCorta(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  // Determinar tipo de producto
  getTipoProducto(codigo: string | undefined): string {
    if (!codigo) {
      return 'Sin especificar';
    }
    
    // Verificar si es membresía
    const membresia = this.membresias.find((m: any) => m.codigo === codigo);
    if (membresia) return 'Membresía';
    
    // Verificar si es producto
    const producto = this.productos.find((p: any) => p.codigo === codigo);
    if (producto) return 'Producto';
    
    // Por código
    if (codigo.startsWith('MEM') || codigo.includes('MEMBRESIA')) {
      return 'Membresía';
    } else if (codigo.startsWith('PROD') || codigo.includes('PRODUCTO')) {
      return 'Producto';
    } else if (codigo.startsWith('SERV') || codigo.includes('SERVICIO')) {
      return 'Servicio';
    }
    
    return 'Servicio';
  }

  // Obtener clase del badge según tipo
  getBadgeClass(codigoProducto: string | undefined): string {
    if (!codigoProducto) {
      return 'bg-secondary';
    }
    
    const tipo = this.getTipoProducto(codigoProducto);
    
    switch(tipo) {
      case 'Membresía':
        return 'bg-primary';
      case 'Producto':
        return 'bg-success';
      case 'Servicio':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  // Calcular fecha de vencimiento
  get fechaVencimiento(): string {
    if (!this.pago?.fechaVenta) return 'No disponible';
    
    const fechaVenta = new Date(this.pago.fechaVenta);
    const duracion = this.obtenerDuracionMembresia(this.pago.codigoProducto);
    
    if (duracion.includes('30') || duracion.includes('1 mes')) {
      fechaVenta.setMonth(fechaVenta.getMonth() + 1);
    } else if (duracion.includes('90') || duracion.includes('3 meses')) {
      fechaVenta.setMonth(fechaVenta.getMonth() + 3);
    } else if (duracion.includes('180') || duracion.includes('6 meses')) {
      fechaVenta.setMonth(fechaVenta.getMonth() + 6);
    } else if (duracion.includes('365') || duracion.includes('1 año')) {
      fechaVenta.setFullYear(fechaVenta.getFullYear() + 1);
    } else {
      // Por defecto 30 días
      fechaVenta.setDate(fechaVenta.getDate() + 30);
    }
    
    return this.formatearFechaCorta(fechaVenta.toISOString());
  }

  // Verificar si es membresía
  get esMembresia(): boolean {
    return this.getTipoProducto(this.pago?.codigoProducto) === 'Membresía';
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
    this.cargarNombres();
  }
}