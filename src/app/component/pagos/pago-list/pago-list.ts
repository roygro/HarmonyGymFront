import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderRecepcionistaComponent } from '../../recepcionista/header-recepcionista/header-recepcionista';

// Importar las librerías de PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { PagoService, Pago, EstadisticasDia } from '../../../services/pagos/pago';

@Component({
  selector: 'app-pago-list',
  templateUrl: './pago-list.html',
  styleUrls: ['./pago-list.css'],
  imports: [CommonModule, FormsModule, HeaderRecepcionistaComponent]
})
export class PagoList implements OnInit {
  pagos: Pago[] = [];
  estadisticas: EstadisticasDia = {
    totalVentas: 0,
    cantidadVentas: 0
  };

  // Propiedad separada para clientes únicos
  clientesUnicos: number = 0;

  cargando: boolean = true;
  cargandoEstadisticas: boolean = true;
  error: string = '';

  // Filtros
  filtroCliente: string = '';
  filtroRecepcionista: string = '';
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';

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
        // Calcular clientes únicos después de cargar los pagos
        this.calcularClientesUnicos();
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

  // Calcular clientes únicos basado en los pagos del día
  private calcularClientesUnicos(): void {
    const hoy = new Date().toISOString().split('T')[0];
    const pagosHoy = this.pagos.filter(pago =>
      pago.fechaVenta &&
      new Date(pago.fechaVenta).toISOString().split('T')[0] === hoy
    );

    const clientesUnicosSet = new Set(pagosHoy.map(pago => pago.folioCliente));
    this.clientesUnicos = clientesUnicosSet.size;
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

    // Filtros de fecha
    if (this.filtroFechaInicio) {
      filtered = filtered.filter(pago => {
        if (!pago.fechaVenta) return false;
        const fechaPago = new Date(pago.fechaVenta).toISOString().split('T')[0];
        return fechaPago >= this.filtroFechaInicio;
      });
    }

    if (this.filtroFechaFin) {
      filtered = filtered.filter(pago => {
        if (!pago.fechaVenta) return false;
        const fechaPago = new Date(pago.fechaVenta).toISOString().split('T')[0];
        return fechaPago <= this.filtroFechaFin;
      });
    }

    return filtered;
  }

  // Método para aplicar filtros (compatibilidad con template)
  aplicarFiltros(): void {
    // Los filtros se aplican automáticamente a través del getter pagosFiltrados
    // Este método se mantiene para compatibilidad con el template
  }

  // Limpiar filtro específico de cliente
  limpiarFiltroCliente(): void {
    this.filtroCliente = '';
  }

  // Limpiar todos los filtros
  limpiarFiltros(): void {
    this.filtroCliente = '';
    this.filtroRecepcionista = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
  }

  // Exportar pagos a CSV
  exportarPagos(): void {
    try {
      const csvContent = this.crearCSV();

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `pagos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Exportación completada');
    } catch (error) {
      console.error('Error al exportar pagos:', error);
      this.error = 'Error al exportar los pagos';
    }
  }

  // Crear contenido CSV
  private crearCSV(): string {
    const headers = ['ID Venta', 'Cliente', 'Producto', 'Cantidad', 'Total', 'Fecha', 'Recepcionista'];
    const rows = this.pagosFiltrados.map(pago => [
      pago.idVenta?.toString() || '',
      pago.folioCliente,
      pago.codigoProducto,
      pago.cantidad.toString(),
      this.formatearMoneda(pago.total),
      pago.fechaVenta ? this.formatearFechaParaCSV(pago.fechaVenta) : '',
      pago.idRecepcionista
    ]);

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  // Formatear fecha para CSV (formato simple)
  private formatearFechaParaCSV(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-MX');
  }

  // Descargar recibo individual en PDF
  async descargarRecibo(pago: Pago): Promise<void> {
    try {
      this.error = '';

      // Crear elemento HTML temporal para el recibo
      const reciboElement = this.crearElementoRecibo(pago);
      document.body.appendChild(reciboElement);

      // Convertir a PDF
      const canvas = await html2canvas(reciboElement, {
        scale: 2, // Mejor calidad
        useCORS: true,
        logging: false
      });

      // Crear PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Agregar páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Descargar PDF
      pdf.save(`recibo_${pago.idVenta}_${new Date().toISOString().split('T')[0]}.pdf`);

      // Limpiar elemento temporal
      document.body.removeChild(reciboElement);

      console.log('Recibo PDF generado correctamente');
    } catch (error) {
      console.error('Error al generar recibo PDF:', error);
      this.error = 'Error al generar el recibo PDF';
    }
  }

  // Crear elemento HTML para el recibo
  private crearElementoRecibo(pago: Pago): HTMLDivElement {
    const reciboDiv = document.createElement('div');
    reciboDiv.style.cssText = `
      position: fixed;
      left: -10000px;
      top: -10000px;
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      background: white;
      color: black;
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.4;
    `;

    const fechaEmision = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    reciboDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="color: #E63946; margin: 0; font-size: 24px;">HARMONY GYM</h1>
        <p style="margin: 5px 0; color: #666;">Sistema de Gestión Deportiva</p>
        <h2 style="color: #1D3557; margin: 10px 0; font-size: 18px;">RECIBO DE PAGO</h2>
      </div>

      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <h3 style="color: #1D3557; margin-bottom: 10px;">Información del Pago</h3>
              <p><strong>ID Venta:</strong> #${pago.idVenta || 'N/A'}</p>
              <p><strong>Fecha de Venta:</strong> ${pago.fechaVenta ? this.formatearFecha(pago.fechaVenta) : 'N/A'}</p>
              <p><strong>Fecha de Emisión:</strong> ${fechaEmision}</p>
            </td>
            <td style="width: 50%; vertical-align: top;">
              <h3 style="color: #1D3557; margin-bottom: 10px;">Información del Cliente</h3>
              <p><strong>Folio Cliente:</strong> ${pago.folioCliente}</p>
              <p><strong>Recepcionista:</strong> ${pago.idRecepcionista}</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1D3557; margin-bottom: 15px;">Detalles del Producto/Servicio</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Producto</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: center;">Cantidad</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Precio Unitario</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;">${pago.codigoProducto}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${pago.cantidad}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${this.formatearMoneda(pago.precioUnitario)}</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${this.formatearMoneda(pago.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

<div style="text-align: right; margin-bottom: 40px;">
  <div style="display: inline-block; text-align: left;">
    <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #E63946;">
      <strong>TOTAL:</strong> ${this.formatearMoneda(pago.total)}
    </p>
  </div>
</div>

      <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="text-align: center; color: #666; font-size: 10px;">
          <strong>HARMONY GYM</strong><br>
          Sistema de Gestión Deportiva<br>
          Recibo generado automáticamente - Este documento es válido sin firma
        </p>
      </div>

      <div style="margin-top: 30px; text-align: center;">
        <p style="color: #999; font-size: 9px;">
          Fecha de generación: ${new Date().toLocaleString('es-MX')}
        </p>
      </div>
    `;

    return reciboDiv;
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