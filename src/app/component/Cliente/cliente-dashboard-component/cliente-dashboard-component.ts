import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/Auth/AuthService';
import { ActividadService, Actividad } from '../../../services/instructor/ActividadService';
import { RutinaService, Rutina } from '../../../services/instructor/RutinaService';

@Component({
  selector: 'app-cliente-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente-dashboard-component.html',
  styleUrls: ['./cliente-dashboard-component.css']
})
export class ClienteDashboardComponent implements OnInit {
  // Datos del usuario
  currentUser: any;
  
  // Actividades
  actividades: Actividad[] = [];
  actividadesProximas: Actividad[] = [];
  actividadesHoy: Actividad[] = [];
  
  // Rutinas
  rutinas: Rutina[] = [];
  rutinaActiva: Rutina | null = null;
  
  // Estados
  isLoading = true;
  
  // Fechas
  hoy = new Date();
  semana: Date[] = [];

  constructor(
    private authService: AuthService,
    private actividadService: ActividadService,
    private rutinaService: RutinaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario actual:', this.currentUser);
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.cargarDatosCliente();
    this.generarSemana();
  }

  cargarDatosCliente(): void {
    this.isLoading = true;
    
    // Cargar actividades y rutinas en paralelo
    this.cargarActividadesCliente();
    this.cargarRutinasCliente();
  }

  cargarActividadesCliente(): void {
    this.actividadService.obtenerActividadesActivas().subscribe({
      next: (actividades) => {
        this.actividades = actividades;
        this.filtrarActividades();
        console.log('✅ Actividades cargadas:', this.actividades.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar actividades activas:', error);
        // Fallback: cargar todas las actividades
        this.actividadService.obtenerTodasActividades().subscribe({
          next: (todasActividades) => {
            this.actividades = todasActividades.filter(actividad => 
              actividad.estatus === 'Activa'
            );
            this.filtrarActividades();
            console.log('🔄 Actividades cargadas con fallback:', this.actividades.length);
          },
          error: (fallbackError) => {
            console.error('❌ Error en fallback:', fallbackError);
            this.actividades = [];
            this.filtrarActividades();
          }
        });
      }
    });
  }

  cargarRutinasCliente(): void {
    if (this.currentUser?.idPersona) {
      this.rutinaService.obtenerRutinasAsignadasACliente(this.currentUser.idPersona).subscribe({
        next: (rutinas) => {
          this.rutinas = rutinas;
          this.rutinaActiva = rutinas.find(r => r.estatus === 'Activa') || null;
          this.verificarLoadingCompleto();
          console.log('✅ Rutinas cargadas:', this.rutinas.length);
        },
        error: (error) => {
          console.error('❌ Error al cargar rutinas:', error);
          this.rutinas = [];
          this.verificarLoadingCompleto();
        }
      });
    } else {
      this.verificarLoadingCompleto();
    }
  }

  verificarLoadingCompleto(): void {
    // Ambas cargas (actividades y rutinas) han terminado
    this.isLoading = false;
  }

  filtrarActividades(): void {
    const hoyStr = this.hoy.toISOString().split('T')[0];
    const unaSemanaDespues = new Date();
    unaSemanaDespues.setDate(this.hoy.getDate() + 7);
    const unaSemanaDespuesStr = unaSemanaDespues.toISOString().split('T')[0];
    
    // Actividades de hoy
    this.actividadesHoy = this.actividades.filter(actividad => 
      actividad.fechaActividad === hoyStr
    );
    
    // Actividades próximas (próximos 7 días)
    this.actividadesProximas = this.actividades.filter(actividad => {
      const fechaActividad = actividad.fechaActividad;
      return fechaActividad > hoyStr && fechaActividad <= unaSemanaDespuesStr;
    }).sort((a, b) => new Date(a.fechaActividad).getTime() - new Date(b.fechaActividad).getTime());
    
    console.log('📊 Actividades hoy:', this.actividadesHoy.length);
    console.log('📊 Actividades próximas:', this.actividadesProximas.length);
  }

  generarSemana(): void {
    this.semana = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date();
      fecha.setDate(this.hoy.getDate() + i);
      this.semana.push(fecha);
    }
  }

  // MÉTODOS DE UTILIDAD PARA ACTIVIDADES
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatearHora(hora: string): string {
    if (!hora) return '';
    
    const horaSinSegundos = hora.substring(0, 5);
    const [horas, minutos] = horaSinSegundos.split(':').map(Number);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas % 12 || 12;
    
    return `${horas12}:${minutos.toString().padStart(2, '0')} ${ampm}`;
  }

  getDiaSemana(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', { weekday: 'short' });
  }

  getDiaMes(fecha: Date): string {
    return fecha.getDate().toString();
  }

  getDiaMesFromString(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return this.getDiaMes(fecha);
  }

  getDiaSemanaFromString(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return this.getDiaSemana(fecha);
  }

  esHoy(fecha: Date): boolean {
    return fecha.toDateString() === this.hoy.toDateString();
  }

  tieneActividadesDia(fecha: Date): boolean {
    const fechaStr = fecha.toISOString().split('T')[0];
    return this.actividades.some(actividad => actividad.fechaActividad === fechaStr);
  }

  getActividadesDia(fecha: Date): Actividad[] {
    const fechaStr = fecha.toISOString().split('T')[0];
    return this.actividades.filter(actividad => actividad.fechaActividad === fechaStr);
  }

  getImagenActividad(actividad: Actividad): string {
    return actividad.imagenUrl || this.getImagenPorDefecto(actividad.nombreActividad);
  }

  getImagenPorDefecto(nombreActividad: string): string {
    const imagenes = [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', // Yoga
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', // Pesas
      'https://images.unsplash.com/photo-1549060279-7e168fce7090?w=400', // Cardio
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', // Spinning
      'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400', // Natación
    ];
    
    const actividadLower = nombreActividad.toLowerCase();
    if (actividadLower.includes('yoga')) return imagenes[0];
    if (actividadLower.includes('pesas') || actividadLower.includes('fuerza')) return imagenes[1];
    if (actividadLower.includes('cardio')) return imagenes[2];
    if (actividadLower.includes('spinning') || actividadLower.includes('ciclo')) return imagenes[3];
    if (actividadLower.includes('natación') || actividadLower.includes('piscina')) return imagenes[4];
    
    return imagenes[Math.floor(Math.random() * imagenes.length)];
  }

  // MÉTODOS PARA RUTINAS
  getNivelRutina(nivel: string): string {
    switch (nivel) {
      case 'Principiante': return 'principiante';
      case 'Intermedio': return 'intermedio';
      case 'Avanzado': return 'avanzado';
      default: return 'principiante';
    }
  }

  getColorNivel(nivel: string): string {
    switch (nivel) {
      case 'Principiante': return '#4CAF50';
      case 'Intermedio': return '#FF9800';
      case 'Avanzado': return '#F44336';
      default: return '#757575';
    }
  }

  contarEjerciciosRutina(rutina: Rutina): number {
    return rutina.ejercicios?.length || 0;
  }

  calcularDuracionRutina(rutina: Rutina): number {
    if (!rutina.ejercicios) return 0;
    
    return rutina.ejercicios.reduce((total, ejercicio) => {
      const ejercicioInfo = this.getEjercicioInfo(ejercicio.idEjercicio);
      const tiempoPorSerie = ejercicioInfo?.tiempo || 45;
      const series = ejercicio.seriesEjercicio || 3;
      const descanso = ejercicio.descansoEjercicio || 60;
      
      return total + (tiempoPorSerie * series) + (descanso * (series - 1));
    }, 0);
  }

  getEjercicioInfo(idEjercicio: string): any {
    const ejerciciosCatalogo = [
      { idEjercicio: 'EJ001', nombre: 'Press de Banca', tiempo: 45 },
      { idEjercicio: 'EJ002', nombre: 'Sentadillas', tiempo: 60 },
      { idEjercicio: 'EJ003', nombre: 'Dominadas', tiempo: 50 },
      { idEjercicio: 'EJ004', nombre: 'Peso Muerto', tiempo: 70 },
      { idEjercicio: 'EJ005', nombre: 'Press Militar', tiempo: 40 },
    ];
    
    const ejercicio = ejerciciosCatalogo.find(e => e.idEjercicio === idEjercicio);
    return ejercicio || { nombre: 'Ejercicio', tiempo: 45 };
  }

  getNombreEjercicio(idEjercicio: string): string {
    return this.getEjercicioInfo(idEjercicio).nombre;
  }

  formatearDuracion(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatearDuracionRutina(rutina: Rutina): string {
    const duracionMinutos = this.calcularDuracionRutina(rutina);
    return this.formatearDuracion(duracionMinutos);
  }

  // MÉTODOS DE VERIFICACIÓN
  get tieneActividadesHoy(): boolean {
    return this.actividadesHoy.length > 0;
  }

  get tieneActividadesProximas(): boolean {
    return this.actividadesProximas.length > 0;
  }

  get tieneRutinaActiva(): boolean {
    return !!this.rutinaActiva;
  }

  get tieneRutinas(): boolean {
    return this.rutinas.length > 0;
  }

  get tieneActividades(): boolean {
    return this.actividades.length > 0;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}