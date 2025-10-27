import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-administrador-dashboard-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './administrador-dashboard-component.html',
  styleUrls: ['./administrador-dashboard-component.css']
})
export class AdministradorDashboardComponent implements OnInit {
  // Estadísticas generales
  estadisticas = {
    totalClientes: 1250,
    clientesNuevosMes: 45,
    totalInstructores: 25,
    totalRecepcionistas: 8,
    ventasMes: 125000,
    membresiasActivas: 980,
    productosStock: 150,
    ingresosTotales: 450000
  };

  // Datos para gráficos
  ventasMensuales = [
    { mes: 'Ene', ventas: 120000 },
    { mes: 'Feb', ventas: 115000 },
    { mes: 'Mar', ventas: 135000 },
    { mes: 'Abr', ventas: 125000 },
    { mes: 'May', ventas: 140000 },
    { mes: 'Jun', ventas: 130000 }
  ];

  tiposMembresias = [
    { tipo: 'Básica', cantidad: 450 },
    { tipo: 'Premium', cantidad: 350 },
    { tipo: 'VIP', cantidad: 180 }
  ];

  actividadesPopulares = [
    { actividad: 'Yoga', participantes: 320 },
    { actividad: 'CrossFit', participantes: 280 },
    { actividad: 'Spinning', participantes: 250 },
    { actividad: 'Pilates', participantes: 180 }
  ];

  // Notificaciones recientes
  notificaciones = [
    { 
      tipo: 'venta', 
      mensaje: 'Nueva venta de membresía Premium', 
      tiempo: 'Hace 5 min',
      icono: 'fas fa-shopping-cart'
    },
    { 
      tipo: 'cliente', 
      mensaje: 'Cliente nuevo registrado', 
      tiempo: 'Hace 15 min',
      icono: 'fas fa-user-plus'
    },
    { 
      tipo: 'alerta', 
      mensaje: 'Stock bajo en proteínas', 
      tiempo: 'Hace 1 hora',
      icono: 'fas fa-exclamation-triangle'
    }
  ];

  // Módulos del dashboard
  modulos = [
    {
      titulo: 'Gestión de Clientes',
      descripcion: 'Administrar clientes, membresías y registros',
      icono: 'fas fa-users',
      ruta: '/admin/clientes',
      color: 'primary',
      estadistica: '1,250 clientes'
    },
    {
      titulo: 'Gestión de Instructores',
      descripcion: 'Gestionar personal instructor y actividades',
      icono: 'fas fa-user-tie',
      ruta: '/admin/instructores',
      color: 'success',
      estadistica: '25 instructores'
    },
    {
      titulo: 'Gestión de Recepcionistas',
      descripcion: 'Administrar personal de recepción',
      icono: 'fas fa-user-headset',
      ruta: '/admin/recepcionistas',
      color: 'info',
      estadistica: '8 recepcionistas'
    },
    {
      titulo: 'Membresías',
      descripcion: 'Gestionar planes y tipos de membresía',
      icono: 'fas fa-id-card',
      ruta: '/admin/membresias',
      color: 'warning',
      estadistica: '980 activas'
    },
    {
      titulo: 'Ventas',
      descripcion: 'Control de ventas y transacciones',
      icono: 'fas fa-chart-line',
      ruta: '/admin/ventas',
      color: 'danger',
      estadistica: '$125K mes'
    },
    {
      titulo: 'Productos',
      descripcion: 'Inventario y gestión de productos',
      icono: 'fas fa-box',
      ruta: '/admin/productos',
      color: 'secondary',
      estadistica: '150 productos'
    },
    {
      titulo: 'Estadísticas',
      descripcion: 'Reportes y análisis detallados',
      icono: 'fas fa-chart-bar',
      ruta: '/admin/estadisticas',
      color: 'dark',
      estadistica: 'Ver reportes'
    },
    {
      titulo: 'Configuración',
      descripcion: 'Configuración del sistema',
      icono: 'fas fa-cogs',
      ruta: '/admin/configuracion',
      color: 'light',
      estadistica: 'Ajustes'
    }
  ];

  // Colores para gráficos
  coloresGraficos = ['#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#e74c3c'];

  constructor() {}

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    // Simular carga de datos desde API
    setTimeout(() => {
      console.log('Estadísticas cargadas');
    }, 1000);
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor);
  }

  formatearNumero(valor: number): string {
    return valor.toLocaleString('es-MX');
  }

  // Método para obtener colores de gráficos
  getColorForIndex(index: number): string {
    return this.coloresGraficos[index % this.coloresGraficos.length];
  }

  // Método para calcular porcentajes del gráfico de pie
  calcularPorcentajePie(index: number): number {
    const total = this.tiposMembresias.reduce((sum, item) => sum + item.cantidad, 0);
    const porcentajeAcumulado = this.tiposMembresias
      .slice(0, index)
      .reduce((sum, item) => sum + (item.cantidad / total) * 100, 0);
    
    return porcentajeAcumulado;
  }

  // Método para obtener el estilo del segmento del pie
  getPieSegmentStyle(index: number): any {
    const total = this.tiposMembresias.reduce((sum, item) => sum + item.cantidad, 0);
    const porcentaje = (this.tiposMembresias[index].cantidad / total) * 100;
    const porcentajeAcumulado = this.calcularPorcentajePie(index);
    
    return {
      'background': `conic-gradient(
        from 0deg at 50% 50%, 
        ${this.getColorForIndex(index)} ${porcentajeAcumulado}%, 
        ${this.getColorForIndex(index)} ${porcentajeAcumulado + porcentaje}%
      )`
    };
  }

  // Calcular altura de barras normalizada
  calcularAlturaBarra(venta: number): string {
    const maxVenta = Math.max(...this.ventasMensuales.map(v => v.ventas));
    return (venta / maxVenta * 100) + '%';
  }

  // Calcular porcentaje de actividades
  calcularPorcentajeActividad(participantes: number): string {
    const maxParticipantes = Math.max(...this.actividadesPopulares.map(a => a.participantes));
    return (participantes / maxParticipantes * 100) + '%';
  }
}