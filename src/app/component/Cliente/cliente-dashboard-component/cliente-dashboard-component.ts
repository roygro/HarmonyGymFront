import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/Auth/AuthService';
import { ActividadService, Actividad } from '../../../services/instructor/ActividadService';
import { RutinaService, Rutina } from '../../../services/instructor/RutinaService';

// Angular Material imports
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Componente de diálogo para confirmaciones
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">{{ data.title }}</h2>
      <p class="mb-6">{{ data.message }}</p>
      <div class="flex justify-end gap-2">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button 
          mat-raised-button 
          [color]="data.confirmColor || 'primary'" 
          (click)="onConfirm()"
        >
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

// Componente de diálogo para alertas simples
@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-4">
      <div class="flex items-center mb-4">
        <mat-icon [color]="data.iconColor" class="mr-2">{{ data.icon }}</mat-icon>
        <h2 class="text-xl font-bold">{{ data.title }}</h2>
      </div>
      <p class="mb-6">{{ data.message }}</p>
      <div class="flex justify-end">
        <button 
          mat-raised-button 
          [color]="data.buttonColor || 'primary'" 
          (click)="onClose()"
        >
          {{ data.buttonText || 'Aceptar' }}
        </button>
      </div>
    </div>
  `
})
export class AlertDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AlertDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-cliente-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
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
  actividadesFiltradas: Actividad[] = [];
  
  // Rutinas
  rutinas: Rutina[] = [];
  rutinaActiva: Rutina | null = null;
  
  // Estados
  isLoading = true;
  searchTerm = '';
  
  // Fechas
  hoy = new Date();
  semana: Date[] = [];

  // NUEVAS PROPIEDADES PARA EL CALENDARIO MODAL
  mostrarCalendarioModal: boolean = false;
  mesActual: Date = new Date();
  diaSeleccionado: Date | null = null;
  diasDelMes: any[] = [];
  diasSemana: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  mostrarSelectorRapido: boolean = false;
  
  // PROPIEDADES PARA SELECTOR DE AÑO Y MES
  anosDisponibles: number[] = [];
  anoSeleccionado: number = new Date().getFullYear();
  mesesDelAno: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  mesSeleccionadoRapido: number = new Date().getMonth();

  // Imágenes por defecto para actividades
  defaultImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    'https://images.unsplash.com/photo-1549060279-7e168fce7090?w=400',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400',
  ];

  constructor(
    private authService: AuthService,
    private actividadService: ActividadService,
    private rutinaService: RutinaService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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
    this.inicializarAnosDisponibles();
    this.generarCalendario();
  }

  // ===== MÉTODOS DE CARGA DE DATOS =====
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
        this.actividadesFiltradas = [...actividades];
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
            this.actividadesFiltradas = [...this.actividades];
            this.filtrarActividades();
            console.log('🔄 Actividades cargadas con fallback:', this.actividades.length);
          },
          error: (fallbackError) => {
            console.error('❌ Error en fallback:', fallbackError);
            this.actividades = [];
            this.actividadesFiltradas = [];
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
    this.isLoading = false;
  }

  // ===== MÉTODOS DE FILTRADO Y BÚSQUEDA =====
  filtrarActividades(): void {
    const hoyStr = this.hoy.toISOString().split('T')[0];
    const unaSemanaDespues = new Date();
    unaSemanaDespues.setDate(this.hoy.getDate() + 7);
    const unaSemanaDespuesStr = unaSemanaDespues.toISOString().split('T')[0];
    
    // Actividades de hoy
    this.actividadesHoy = this.actividadesFiltradas.filter(actividad => 
      actividad.fechaActividad === hoyStr
    );
    
    // Actividades próximas (próximos 7 días)
    this.actividadesProximas = this.actividadesFiltradas.filter(actividad => {
      const fechaActividad = actividad.fechaActividad;
      return fechaActividad > hoyStr && fechaActividad <= unaSemanaDespuesStr;
    }).sort((a, b) => new Date(a.fechaActividad).getTime() - new Date(b.fechaActividad).getTime());
    
    console.log('📊 Actividades hoy:', this.actividadesHoy.length);
    console.log('📊 Actividades próximas:', this.actividadesProximas.length);
  }

  buscarActividades(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.actividadesFiltradas = this.actividades.filter(actividad =>
        actividad.nombreActividad?.toLowerCase().includes(term) ||
        actividad.lugar?.toLowerCase().includes(term) ||
        (actividad.descripcion && actividad.descripcion.toLowerCase().includes(term))
      );
      
      if (this.actividadesFiltradas.length === 0) {
        this.mostrarInfo('Búsqueda Sin Resultados', 'No se encontraron actividades que coincidan con tu búsqueda.');
      }
    } else {
      this.actividadesFiltradas = [...this.actividades];
    }
    
    this.filtrarActividades();
    console.log('🔍 Resultados de búsqueda:', this.actividadesFiltradas.length);
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.actividadesFiltradas = [...this.actividades];
    this.filtrarActividades();
  }

  mostrarTodasActividades(): void {
    this.actividadesFiltradas = [...this.actividades];
    this.filtrarActividades();
    this.mostrarExito('Filtro Aplicado', 'Mostrando todas las actividades disponibles');
  }

  mostrarActividadesHoy(): void {
    const hoyStr = this.hoy.toISOString().split('T')[0];
    this.actividadesFiltradas = this.actividades.filter(actividad => 
      actividad.fechaActividad === hoyStr
    );
    this.filtrarActividades();
    this.mostrarExito('Filtro Aplicado', 'Mostrando actividades de hoy');
  }

  mostrarProximasActividades(): void {
    const hoyStr = this.hoy.toISOString().split('T')[0];
    const unaSemanaDespues = new Date();
    unaSemanaDespues.setDate(this.hoy.getDate() + 7);
    const unaSemanaDespuesStr = unaSemanaDespues.toISOString().split('T')[0];
    
    this.actividadesFiltradas = this.actividades.filter(actividad => {
      const fechaActividad = actividad.fechaActividad;
      return fechaActividad > hoyStr && fechaActividad <= unaSemanaDespuesStr;
    });
    
    this.filtrarActividades();
    this.mostrarExito('Filtro Aplicado', 'Mostrando actividades de la próxima semana');
  }

  // ===== MÉTODOS DEL CALENDARIO =====
  generarSemana(): void {
    this.semana = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date();
      fecha.setDate(this.hoy.getDate() + i);
      this.semana.push(fecha);
    }
  }

  inicializarAnosDisponibles(): void {
    const anoActual = new Date().getFullYear();
    this.anosDisponibles = [];
    for (let i = 2020; i <= anoActual + 25; i++) {
      this.anosDisponibles.push(i);
    }
    this.anoSeleccionado = anoActual;
    this.mesSeleccionadoRapido = new Date().getMonth();
  }

  seleccionarAno(ano: number): void {
    this.anoSeleccionado = ano;
    console.log('📅 Año seleccionado:', ano);
  }

  seleccionarMes(mes: number): void {
    this.mesSeleccionadoRapido = mes;
    console.log('📅 Mes seleccionado:', this.mesesDelAno[mes]);
  }

  aplicarAnioMesSeleccionado(): void {
    this.mesActual = new Date(this.anoSeleccionado, this.mesSeleccionadoRapido, 1);
    this.diaSeleccionado = null;
    this.generarCalendario();
    this.mostrarSelectorRapido = false;
    console.log('📅 Cambiando a:', this.mesesDelAno[this.mesSeleccionadoRapido], this.anoSeleccionado);
  }

  toggleSelectorAnioMes(): void {
    if (!this.mostrarSelectorRapido) {
      this.anoSeleccionado = this.mesActual.getFullYear();
      this.mesSeleccionadoRapido = this.mesActual.getMonth();
    }
    this.mostrarSelectorRapido = !this.mostrarSelectorRapido;
  }

  abrirCalendarioModal(): void {
    this.mostrarCalendarioModal = true;
    console.log('📅 Modal del calendario abierto');
    this.generarCalendario();
  }

  cerrarCalendarioModal(event?: any): void {
    if (event && event.target.classList.contains('calendar-modal-overlay')) {
      this.mostrarCalendarioModal = false;
    } else if (!event) {
      this.mostrarCalendarioModal = false;
    }
  }

  generarCalendario(): void {
    this.diasDelMes = [];
    
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth();
    
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    
    const primerDiaSemana = primerDia.getDay();
    
    for (let i = 0; i < primerDiaSemana; i++) {
      this.diasDelMes.push(null);
    }
    
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      const actividadesDelDia = this.contarActividadesPorDia(fecha);
      const esHoy = this.esHoy(fecha);
      const esSeleccionado = this.diaSeleccionado && this.esMismoDia(fecha, this.diaSeleccionado);
      
      this.diasDelMes.push({
        fecha: fecha,
        actividades: actividadesDelDia,
        esHoy: esHoy,
        esSeleccionado: esSeleccionado
      });
    }
  }

  contarActividadesPorDia(fecha: Date): number {
    if (!this.actividades.length) return 0;
    
    const fechaStr = fecha.toISOString().split('T')[0];
    return this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividad = new Date(actividad.fechaActividad).toISOString().split('T')[0];
      return fechaActividad === fechaStr && actividad.estatus === 'Activa';
    }).length;
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  }

  esMismoDia(fecha1: Date, fecha2: Date): boolean {
    return fecha1.getDate() === fecha2.getDate() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getFullYear() === fecha2.getFullYear();
  }

  getClaseDia(dia: any): string {
    if (!dia) return 'calendar-day empty';
    
    let clases = 'calendar-day';
    
    if (dia.esHoy) clases += ' today';
    if (dia.esSeleccionado) clases += ' selected';
    if (dia.actividades > 0) clases += ' has-activities';
    if (this.esFinDeSemana(dia.fecha)) clases += ' weekend';
    
    return clases;
  }

  getClaseContador(cantidad: number): string {
    if (cantidad >= 5) return 'count-high';
    if (cantidad >= 3) return 'count-medium';
    return 'count-low';
  }

  esFinDeSemana(fecha: Date): boolean {
    const diaSemana = fecha.getDay();
    return diaSemana === 0 || diaSemana === 6;
  }

  getTooltipDia(dia: any): string {
    if (!dia) return '';
    
    if (dia.actividades === 0) {
      return `${dia.fecha.toLocaleDateString('es-ES')} - Sin actividades`;
    } else {
      return `${dia.fecha.toLocaleDateString('es-ES')} - ${dia.actividades} actividad${dia.actividades !== 1 ? 'es' : ''}`;
    }
  }

  seleccionarDia(dia: any): void {
    if (!dia) return;
    
    this.diaSeleccionado = dia.fecha;
    
    const fechaStr = dia.fecha.toISOString().split('T')[0];
    this.actividadesFiltradas = this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividad = new Date(actividad.fechaActividad).toISOString().split('T')[0];
      return fechaActividad === fechaStr;
    });
    
    this.filtrarActividades();
    this.generarCalendario();
    
    console.log(`📅 Día seleccionado: ${dia.fecha.toLocaleDateString('es-ES')}, actividades: ${dia.actividades}`);
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.diaSeleccionado = null;
    this.generarCalendario();
  }

  mesSiguiente(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.diaSeleccionado = null;
    this.generarCalendario();
  }

  irAHoy(): void {
    this.mesActual = new Date();
    this.diaSeleccionado = new Date();
    this.seleccionarDia({ fecha: this.diaSeleccionado });
  }

  // ===== MÉTODOS DE UTILIDAD =====
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
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      'https://images.unsplash.com/photo-1549060279-7e168fce7090?w=400',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
      'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400',
    ];
    
    const actividadLower = nombreActividad.toLowerCase();
    if (actividadLower.includes('yoga')) return imagenes[0];
    if (actividadLower.includes('pesas') || actividadLower.includes('fuerza')) return imagenes[1];
    if (actividadLower.includes('cardio')) return imagenes[2];
    if (actividadLower.includes('spinning') || actividadLower.includes('ciclo')) return imagenes[3];
    if (actividadLower.includes('natación') || actividadLower.includes('piscina')) return imagenes[4];
    
    return imagenes[Math.floor(Math.random() * imagenes.length)];
  }

  // ===== MÉTODOS PARA RUTINAS =====
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

  // ===== MÉTODOS DE ACCIÓN =====
  registrarmeEnActividad(actividad: Actividad): void {
    this.mostrarConfirmacion(
      '¿Registrarse en Actividad?',
      `¿Estás seguro de que quieres registrarte en "${actividad.nombreActividad}"?`,
      'question',
      'Sí, registrarme',
      'Cancelar'
    ).then((result) => {
      if (result) {
        // Aquí iría la lógica para registrar al cliente en la actividad
        this.mostrarExito('¡Registro Exitoso!', `Te has registrado en "${actividad.nombreActividad}"`);
        console.log('📝 Registrando en actividad:', actividad.nombreActividad);
      }
    });
  }

  iniciarRutina(): void {
    if (this.rutinaActiva) {
      this.mostrarExito('¡Rutina Iniciada!', `Iniciando rutina: ${this.rutinaActiva.nombre}`);
      console.log('💪 Iniciando rutina:', this.rutinaActiva.nombre);
    }
  }

  contactarInstructor(): void {
    this.mostrarInfo('Contactar Instructor', 'Esta funcionalidad estará disponible pronto');
  }

  obtenerEstadisticas(): void {
    this.mostrarInfo('Estadísticas', 'Las estadísticas detalladas estarán disponibles pronto');
  }

  actualizarDatos(): void {
    this.isLoading = true;
    this.cargarDatosCliente();
    this.mostrarExito('Datos Actualizados', 'La información se ha actualizado correctamente');
  }

  // ===== MÉTODOS DE VERIFICACIÓN =====
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

  // ===== MÉTODOS ANGULAR MATERIAL =====
  private mostrarExito(titulo: string, mensaje: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '400px',
      data: {
        title: titulo,
        message: mensaje,
        icon: 'check_circle',
        iconColor: 'primary',
        buttonColor: 'primary'
      }
    });
  }

  private mostrarError(titulo: string, mensaje: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '400px',
      data: {
        title: titulo,
        message: mensaje,
        icon: 'error',
        iconColor: 'warn',
        buttonColor: 'warn'
      }
    });
  }

  private mostrarAdvertencia(titulo: string, mensaje: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '400px',
      data: {
        title: titulo,
        message: mensaje,
        icon: 'warning',
        iconColor: 'accent',
        buttonColor: 'accent'
      }
    });
  }

  private mostrarInfo(titulo: string, mensaje: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '400px',
      data: {
        title: titulo,
        message: mensaje,
        icon: 'info',
        iconColor: 'primary',
        buttonColor: 'primary'
      }
    });
  }

  private mostrarSnackbar(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'success'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: [`snackbar-${tipo}`],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private mostrarConfirmacion(
    titulo: string, 
    mensaje: string, 
    icon: 'warning' | 'question' | 'info' | 'success' | 'error' = 'question',
    confirmButtonText: string = 'Confirmar',
    cancelButtonText: string = 'Cancelar'
  ): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: titulo,
        message: mensaje,
        confirmText: confirmButtonText,
        cancelText: cancelButtonText,
        confirmColor: this.getConfirmColor(icon)
      }
    });

    return dialogRef.afterClosed().toPromise() || Promise.resolve(false);
  }

  private getConfirmColor(icon: string): string {
    switch (icon) {
      case 'warning':
      case 'error':
        return 'warn';
      case 'success':
        return 'primary';
      default:
        return 'primary';
    }
  }
}