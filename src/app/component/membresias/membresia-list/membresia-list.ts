import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MembresiaService, Membresia } from '../../../services/membresia/membresia';
import { Chart, registerables } from 'chart.js';
import { HeaderAdministradorComponent } from '../../Administrador/header-admin/header-admin';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-membresia-list',
  imports: [CommonModule, FormsModule, RouterModule,HeaderAdministradorComponent],
  templateUrl: './membresia-list.html',
  styleUrl: './membresia-list.css'
})
export class MembresiaList implements OnInit, AfterViewInit, OnDestroy {
  membresias: Membresia[] = [];
  membresiasFiltradas: Membresia[] = [];
  filtro: string = '';
  estadisticas: any = {};
  loading: boolean = false;
  tiposMembresia: string[] = ['Básica', 'Premium', 'VIP'];
  
  // Variables para almacenar las instancias de los gráficos
  private distribucionChart: Chart | null = null;
  private ingresosChart: Chart | null = null;

  constructor(private membresiaService: MembresiaService) { }

  ngOnInit(): void {
    this.cargarMembresias();
    this.cargarEstadisticas();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  cargarMembresias(): void {
    this.loading = true;
    this.membresiaService.getMembresias().subscribe({
      next: (data) => {
        this.membresias = data;
        this.membresiasFiltradas = data;
        this.loading = false;
        
        // Crear gráficos después de cargar los datos
        setTimeout(() => {
          this.crearGraficoDistribucion();
          this.crearGraficoIngresos();
        }, 100);
      },
      error: (error) => {
        console.error('Error al cargar membresías:', error);
        alert('Error al cargar las membresías');
        this.loading = false;
      }
    });
  }

  cargarEstadisticas(): void {
    this.membresiaService.getEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas = data;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  aplicarFiltro(): void {
    if (!this.filtro) {
      this.membresiasFiltradas = this.membresias;
      return;
    }

    const filtroLower = this.filtro.toLowerCase();
    this.membresiasFiltradas = this.membresias.filter(membresia =>
      membresia.tipo.toLowerCase().includes(filtroLower) ||
      membresia.descripcion.toLowerCase().includes(filtroLower) ||
      membresia.estatus.toLowerCase().includes(filtroLower)
    );
  }

  desactivarMembresia(id: string): void {
    if (confirm('¿Estás seguro de que deseas desactivar esta membresía?')) {
      this.membresiaService.desactivarMembresia(id).subscribe({
        next: () => {
          this.cargarMembresias();
          this.cargarEstadisticas();
          alert('Membresía desactivada exitosamente');
        },
        error: (error) => {
          console.error('Error al desactivar membresía:', error);
          alert('Error al desactivar la membresía');
        }
      });
    }
  }

  activarMembresia(id: string): void {
    this.membresiaService.activarMembresia(id).subscribe({
      next: () => {
        this.cargarMembresias();
        this.cargarEstadisticas();
        alert('Membresía activada exitosamente');
      },
      error: (error) => {
        console.error('Error al activar membresía:', error);
        alert('Error al activar la membresía');
      }
    });
  }

  limpiarFiltro(): void {
    this.filtro = '';
    this.membresiasFiltradas = this.membresias;
  }

  // Método para las clases de los badges
  getEstatusBadgeClass(estatus: string): string {
    return estatus === 'Activa' ? 'badge-activa' : 'badge-inactiva';
  }

  // Método para crear el gráfico de distribución
  private crearGraficoDistribucion(): void {
    // Destruir gráfico anterior si existe
    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }

    const ctx = document.getElementById('distribucionChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Canvas distribucionChart no encontrado');
      return;
    }

    const counts = this.tiposMembresia.map(tipo => this.getCountForTipo(tipo));
    const colors = this.tiposMembresia.map(tipo => this.getColorForTipo(tipo));

    // Verificar si hay datos para mostrar
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) {
      this.mostrarMensajeSinDatos(ctx, 'distribucionChart');
      return;
    }

    try {
      this.distribucionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.tiposMembresia,
          datasets: [{
            data: counts,
            backgroundColor: colors,
            borderColor: colors.map(color => this.adjustBrightness(color, -20)),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#F1FAEE',
                font: {
                  size: 12
                },
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.raw as number;
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al crear gráfico de distribución:', error);
    }
  }

  // Método para crear el gráfico de ingresos
  private crearGraficoIngresos(): void {
    // Destruir gráfico anterior si existe
    if (this.ingresosChart) {
      this.ingresosChart.destroy();
    }

    const ctx = document.getElementById('ingresosChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Canvas ingresosChart no encontrado');
      return;
    }

    const ingresosPorTipo = this.tiposMembresia.map(tipo => {
      const membresiasDelTipo = this.membresias.filter(m => m.tipo === tipo && m.estatus === 'Activa');
      return membresiasDelTipo.reduce((total, m) => total + m.precio, 0);
    });

    const colors = this.tiposMembresia.map(tipo => this.getColorForTipo(tipo));

    // Verificar si hay datos para mostrar
    const totalIngresos = ingresosPorTipo.reduce((a, b) => a + b, 0);
    if (totalIngresos === 0) {
      this.mostrarMensajeSinDatos(ctx, 'ingresosChart');
      return;
    }

    try {
      this.ingresosChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.tiposMembresia,
          datasets: [{
            label: 'Ingresos Mensuales ($)',
            data: ingresosPorTipo,
            backgroundColor: colors.map(color => this.adjustBrightness(color, 20)),
            borderColor: colors,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `Ingresos: $${context.parsed.y}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#F1FAEE',
                callback: function(value) {
                  return '$' + value;
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              ticks: {
                color: '#F1FAEE'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al crear gráfico de ingresos:', error);
    }
  }

  // Método para mostrar mensaje cuando no hay datos
  private mostrarMensajeSinDatos(ctx: HTMLCanvasElement, chartType: string): void {
    const context = ctx.getContext('2d');
    if (!context) return;

    // Limpiar canvas
    context.clearRect(0, 0, ctx.width, ctx.height);
    
    // Mostrar mensaje
    context.fillStyle = '#F1FAEE';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText('No hay datos disponibles', ctx.width / 2, ctx.height / 2);
  }

  // Método auxiliar para ajustar el brillo de los colores
  private adjustBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    
    return "#" + (
      0x1000000 +
      R * 0x10000 +
      G * 0x100 +
      B
    ).toString(16).slice(1);
  }

  // Métodos para las métricas del dashboard
  calcularIngresoMensual(): number {
    const ingresos = this.membresias.reduce((total, membresia) => {
      return total + (membresia.estatus === 'Activa' ? membresia.precio : 0);
    }, 0);
    return ingresos;
  }

  obtenerMembresiaPopular(): string {
    if (this.membresias.length === 0) return 'N/A';
    
    const counts = this.membresias.reduce((acc, membresia) => {
      acc[membresia.tipo] = (acc[membresia.tipo] || 0) + 1;
      return acc;
    }, {} as any);
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  getPorcentajePopular(): number {
    const popular = this.obtenerMembresiaPopular();
    if (popular === 'N/A' || this.membresias.length === 0) return 0;
    const count = this.membresias.filter(m => m.tipo === popular).length;
    return Math.round((count / this.membresias.length) * 100);
  }

  calcularTasaActivas(): number {
    if (this.membresias.length === 0) return 0;
    const activas = this.membresias.filter(m => m.estatus === 'Activa').length;
    return Math.round((activas / this.membresias.length) * 100);
  }

  calcularCrecimiento(): number {
    // Mock data - en un caso real vendría del backend
    return 12; // 12% de crecimiento
  }

  getCountForTipo(tipo: string): number {
    return this.membresias.filter(m => m.tipo === tipo).length;
  }

  getColorForTipo(tipo: string): string {
    const colors: {[key: string]: string} = {
      'Básica': '#E63946',
      'Premium': '#457B9D', 
      'VIP': '#F77F00'
    };
    return colors[tipo] || '#A8DADC';
  }

  // Actualizar gráficos cuando cambien los datos
  actualizarGraficos(): void {
    setTimeout(() => {
      this.crearGraficoDistribucion();
      this.crearGraficoIngresos();
    }, 100);
  }

  // Limpiar gráficos cuando el componente se destruya
  ngOnDestroy(): void {
    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }
    if (this.ingresosChart) {
      this.ingresosChart.destroy();
    }
  }
}