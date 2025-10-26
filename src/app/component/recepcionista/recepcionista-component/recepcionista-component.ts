import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderRecepcionistaComponent } from '../header-recepcionista/header-recepcionista';

@Component({
  selector: 'app-recepcionista',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderRecepcionistaComponent],
  template: `
    <div class="recepcionista-container">
      <!-- Header del recepcionista -->
      <app-header-recepcionista></app-header-recepcionista>
      
      <!-- Contenido principal -->
      <main class="main-content">
        <!-- Header de la página -->
        <section class="page-header">
          <div class="header-content">
            <h1 class="page-title">DASHBOARD RECEPCIÓN</h1>
            <p class="page-subtitle">Gestiona y controla las operaciones diarias del gimnasio</p>
          </div>
        </section>

        <!-- Filtros y controles -->
        <section class="controls-section">
          <div class="filters-container">
            <div class="filter-options">
              <label class="filter-checkbox">
                <input type="checkbox" 
                       [checked]="filters.ventasDia" 
                       (change)="onFilterChange('ventasDia', $event)">
                <span class="checkmark"></span>
                Ventas del Día
              </label>
              <label class="filter-checkbox">
                <input type="checkbox" 
                       [checked]="filters.verReportes" 
                       (change)="onFilterChange('verReportes', $event)">
                <span class="checkmark"></span>
                Ver Reportes
              </label>
              <label class="filter-checkbox">
                <input type="checkbox" 
                       [checked]="filters.activas" 
                       (change)="onFilterChange('activas', $event)">
                <span class="checkmark"></span>
                Activas
              </label>
              <label class="filter-checkbox">
                <input type="checkbox" 
                       [checked]="filters.todas" 
                       (change)="onFilterChange('todas', $event)">
                <span class="checkmark"></span>
                Todas
              </label>
            </div>
            
            <button class="new-activity-btn" (click)="onNuevaTransaccion()">
              <span>+</span>
              Nueva Transacción
            </button>
          </div>
        </section>

        <!-- Separador -->
        <div class="section-divider">
          <div class="divider-line"></div>
        </div>

        <!-- Estadísticas principales -->
        <section class="stats-section">
          <div class="stats-grid">
            <!-- Ventas del Día -->
            <div class="stat-card">
              <div class="stat-header">
                <h3 class="stat-title">VENTAS DEL DÍA</h3>
                <div class="stat-badge today">HOY</div>
              </div>
              <div class="stat-value">{{ formatCurrency(stats.ventasDia) }}</div>
              <div class="stat-trend">
                <span [class]="getTrendClass(trends.ventas.direccion)">
                  {{ getTrendSymbol(trends.ventas.direccion) }}
                </span>
                <span class="trend-text">{{ getTrendText('ventas') }}</span>
              </div>
            </div>

            <!-- Transacciones Hoy -->
            <div class="stat-card">
              <div class="stat-header">
                <h3 class="stat-title">TRANSACCIONES HOY</h3>
                <div class="stat-badge today">HOY</div>
              </div>
              <div class="stat-value">{{ stats.transaccionesHoy }}</div>
              <div class="stat-trend">
                <span [class]="getTrendClass(trends.transacciones.direccion)">
                  {{ getTrendSymbol(trends.transacciones.direccion) }}
                </span>
                <span class="trend-text">{{ getTrendText('transacciones') }}</span>
              </div>
            </div>

            <!-- Clientes Únicos -->
            <div class="stat-card">
              <div class="stat-header">
                <h3 class="stat-title">CLIENTES ÚNICOS</h3>
                <div class="stat-badge today">HOY</div>
              </div>
              <div class="stat-value">{{ stats.clientesUnicos }}</div>
              <div class="stat-trend">
                <span [class]="getTrendClass(trends.clientes.direccion)">
                  {{ getTrendSymbol(trends.clientes.direccion) }}
                </span>
                <span class="trend-text">{{ getTrendText('clientes') }}</span>
              </div>
            </div>

            <!-- Membresías Activas -->
            <div class="stat-card">
              <div class="stat-header">
                <h3 class="stat-title">MEMBRESÍAS ACTIVAS</h3>
                <div class="stat-badge total">TOTAL</div>
              </div>
              <div class="stat-value">{{ stats.membresiasActivas }}</div>
              <div class="stat-trend">
                <span [class]="getTrendClass(trends.membresias.direccion)">
                  {{ getTrendSymbol(trends.membresias.direccion) }}
                </span>
                <span class="trend-text">{{ getTrendText('membresias') }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Separador -->
        <div class="section-divider">
          <div class="divider-line"></div>
        </div>

        <!-- Lista de actividades recientes -->
        <section class="activities-section">
          <div class="section-header">
            <h2 class="section-title">OPERACIONES RECIENTES</h2>
            <button class="refresh-btn" (click)="actualizarEstadisticas()">
              🔄 Actualizar
            </button>
          </div>
          <div class="activities-list">
            <div *ngIf="!hasOperacionesRecientes" class="empty-state">
              <div class="empty-icon">📊</div>
              <h3>No hay operaciones recientes</h3>
              <p>Las transacciones y actividades aparecerán aquí</p>
            </div>
            
            <div *ngIf="hasOperacionesRecientes" class="operations-grid">
              <div *ngFor="let operacion of operacionesRecientes" class="operation-item">
                <div class="operation-type">{{ operacion.tipo }}</div>
                <div class="operation-client">{{ operacion.cliente }}</div>
                <div class="operation-amount">{{ formatCurrency(operacion.monto) }}</div>
                <div class="operation-status">{{ operacion.estado }}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .recepcionista-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: white;
    }

    .main-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Page Header */
    .page-header {
      margin-bottom: 2rem;
    }

    .header-content {
      text-align: center;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #FF073A, #00F0FF);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-family: 'Roboto Condensed', sans-serif;
    }

    .page-subtitle {
      font-size: 1.1rem;
      color: #888;
      margin: 0;
      font-weight: 500;
    }

    /* Controls Section */
    .controls-section {
      margin-bottom: 2rem;
    }

    .filters-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .filter-options {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .filter-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #ccc;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .filter-checkbox:hover {
      color: white;
    }

    .filter-checkbox input {
      display: none;
    }

    .checkmark {
      width: 18px;
      height: 18px;
      border: 2px solid #555;
      border-radius: 3px;
      position: relative;
      transition: all 0.3s ease;
    }

    .filter-checkbox input:checked + .checkmark {
      background: #FF073A;
      border-color: #FF073A;
    }

    .filter-checkbox input:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .new-activity-btn {
      background: linear-gradient(135deg, #FF073A, #0066FF);
      border: none;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(255, 7, 58, 0.3);
    }

    .new-activity-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 7, 58, 0.4);
    }

    .new-activity-btn span {
      font-size: 1.2rem;
    }

    /* Section Divider */
    .section-divider {
      margin: 2rem 0;
    }

    .divider-line {
      height: 2px;
      background: linear-gradient(90deg, transparent, #555, transparent);
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid #333;
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      border-color: #FF073A;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 7, 58, 0.2);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .stat-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #888;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      flex: 1;
    }

    .stat-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .stat-badge.today {
      background: rgba(255, 7, 58, 0.2);
      color: #FF073A;
      border: 1px solid #FF073A;
    }

    .stat-badge.total {
      background: rgba(0, 240, 255, 0.2);
      color: #00F0FF;
      border: 1px solid #00F0FF;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0.5rem 0;
      background: linear-gradient(135deg, #FFFFFF, #CCCCCC);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
    }

    .trend-indicator {
      font-weight: bold;
    }

    .trend-indicator.up {
      color: #00FF88;
    }

    .trend-indicator.down {
      color: #FF073A;
    }

    .trend-indicator.neutral {
      color: #888;
    }

    .trend-text {
      color: #888;
    }

    /* Activities Section */
    .activities-section {
      margin-top: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      color: white;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .refresh-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid #555;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .refresh-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .activities-list {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid #333;
      border-radius: 12px;
      padding: 2rem;
      min-height: 200px;
    }

    .empty-state {
      text-align: center;
      color: #888;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #ccc;
    }

    .empty-state p {
      margin: 0;
    }

    .operations-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .operation-item {
      display: grid;
      grid-template-columns: 1fr 2fr 1fr 1fr;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px solid #333;
    }

    .operation-type {
      font-weight: 600;
      color: #00F0FF;
    }

    .operation-client {
      color: #ccc;
    }

    .operation-amount {
      font-weight: 600;
      color: #00FF88;
    }

    .operation-status {
      padding: 0.25rem 0.5rem;
      background: rgba(0, 255, 136, 0.2);
      color: #00FF88;
      border-radius: 4px;
      font-size: 0.8rem;
      text-align: center;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .main-content {
        padding: 1rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .filters-container {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-options {
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .operation-item {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
    }
  `]
})
export class RecepcionistaComponent {
  // Estadísticas del dashboard
  stats = {
    ventasDia: 0.00,
    transaccionesHoy: 0,
    clientesUnicos: 0,
    membresiasActivas: 3
  };

  // Filtros activos
  filters = {
    ventasDia: true,
    verReportes: false,
    activas: true,
    todas: false
  };

  // Datos de tendencias
  trends = {
    ventas: { valor: 0, direccion: 'neutral' as 'up' | 'down' | 'neutral' },
    transacciones: { valor: 0, direccion: 'neutral' as 'up' | 'down' | 'neutral' },
    clientes: { valor: 0, direccion: 'down' as 'up' | 'down' | 'neutral' },
    membresias: { valor: 12, direccion: 'up' as 'up' | 'down' | 'neutral' }
  };

  // Operaciones recientes
  operacionesRecientes: any[] = [];

  constructor() {
    this.inicializarDatos();
  }

  /**
   * Inicializa los datos del componente
   */
  private inicializarDatos(): void {
    // Simular carga de datos
    this.cargarEstadisticas();
    this.cargarOperacionesRecientes();
  }

  /**
   * Carga las estadísticas del dashboard
   */
  private cargarEstadisticas(): void {
    // En una aplicación real, aquí harías una llamada HTTP
    setTimeout(() => {
      this.stats = {
        ventasDia: 1250.75,
        transaccionesHoy: 15,
        clientesUnicos: 8,
        membresiasActivas: 3
      };

      this.trends = {
        ventas: { valor: 15, direccion: 'up' },
        transacciones: { valor: 0, direccion: 'neutral' },
        clientes: { valor: 5, direccion: 'down' },
        membresias: { valor: 12, direccion: 'up' }
      };
    }, 1000);
  }

  /**
   * Carga las operaciones recientes
   */
  private cargarOperacionesRecientes(): void {
    // En una aplicación real, aquí harías una llamada HTTP
    setTimeout(() => {
      this.operacionesRecientes = [
        {
          id: 1,
          tipo: 'Venta',
          cliente: 'Juan Pérez',
          monto: 150.00,
          fecha: new Date(),
          estado: 'Completado'
        },
        {
          id: 2,
          tipo: 'Renovación',
          cliente: 'María García',
          monto: 89.99,
          fecha: new Date(),
          estado: 'Completado'
        }
      ];
    }, 1500);
  }

  /**
   * Maneja el cambio en los filtros
   */
  onFilterChange(filterName: keyof typeof this.filters, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filters[filterName] = input.checked;
    
    // Lógica adicional cuando cambian los filtros
    this.aplicarFiltros();
  }

  /**
   * Aplica los filtros seleccionados
   */
  private aplicarFiltros(): void {
    console.log('Filtros aplicados:', this.filters);
    // Aquí iría la lógica para filtrar los datos
    // Por ejemplo, recargar estadísticas basadas en los filtros
  }

  /**
   * Maneja el clic en el botón de nueva transacción
   */
  onNuevaTransaccion(): void {
    console.log('Iniciando nueva transacción...');
    // Aquí iría la lógica para abrir un modal o navegar a la página de nueva transacción
    alert('Funcionalidad de nueva transacción - En desarrollo');
  }

  /**
   * Obtiene el texto de tendencia formateado
   */
  getTrendText(tipo: keyof typeof this.trends): string {
    const trend = this.trends[tipo];
    
    switch (tipo) {
      case 'ventas':
        return trend.direccion === 'neutral' ? 'Sin cambios' : `${trend.valor}% vs ayer`;
      
      case 'transacciones':
        return trend.direccion === 'neutral' ? 'Sin cambios' : `${trend.valor}% vs ayer`;
      
      case 'clientes':
        return trend.direccion === 'neutral' ? 'Sin cambios' : `${trend.valor}% vs ayer`;
      
      case 'membresias':
        return `${trend.valor}% este mes`;
      
      default:
        return '';
    }
  }

  /**
   * Formatea el valor monetario
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }

  /**
   * Verifica si hay operaciones recientes
   */
  get hasOperacionesRecientes(): boolean {
    return this.operacionesRecientes && this.operacionesRecientes.length > 0;
  }

  /**
   * Actualiza las estadísticas manualmente
   */
  actualizarEstadisticas(): void {
    this.stats = {
      ventasDia: 0.00,
      transaccionesHoy: 0,
      clientesUnicos: 0,
      membresiasActivas: 3
    };

    this.trends = {
      ventas: { valor: 0, direccion: 'neutral' },
      transacciones: { valor: 0, direccion: 'neutral' },
      clientes: { valor: 0, direccion: 'down' },
      membresias: { valor: 12, direccion: 'up' }
    };

    this.operacionesRecientes = [];
    
    // Recargar datos
    this.cargarEstadisticas();
    this.cargarOperacionesRecientes();
  }

  /**
   * Obtiene la clase CSS para el indicador de tendencia
   */
  getTrendClass(direccion: 'up' | 'down' | 'neutral'): string {
    return `trend-indicator ${direccion}`;
  }

  /**
   * Obtiene el símbolo para el indicador de tendencia
   */
  getTrendSymbol(direccion: 'up' | 'down' | 'neutral'): string {
    switch (direccion) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'neutral': return '→';
      default: return '→';
    }
  }
}