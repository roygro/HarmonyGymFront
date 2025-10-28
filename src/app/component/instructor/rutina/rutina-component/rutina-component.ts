import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Rutina, Ejercicio, EjercicioRutina, RutinaService, Cliente, CrearEjercicioRequest } from '../../../../services/instructor/RutinaService';
import { HeaderInstructorComponent } from "../../header-instructor/header-instructor";

// Importaciones de Angular Material
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AuthService } from '../../../../services/Auth/AuthService';
import { AlertDialogComponent, ConfirmDialogComponent } from '../../actividades-component/actividades-component';

// Importar componentes de diálogo (debes crear estos componentes o ajustar las rutas)

// Definir tipos para los iconos
type IconType = 'warning' | 'error' | 'success' | 'info' | 'question';

@Component({
  selector: 'app-rutina',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    HttpClientModule, 
    HeaderInstructorComponent,
    // Angular Material Modules
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './rutina-component.html',
  styleUrls: ['./rutina-component.css']
})
export class RutinaComponent implements OnInit {
  // Estados del componente
  rutinas: Rutina[] = [];
  filteredRutinas: Rutina[] = [];
  selectedRutina: Rutina | null = null;
  isCreating = false;
  isEditing = false;
  clientesDisponibles: Cliente[] = [];
  clientesSeleccionados: string[] = [];
  clientesFiltrados: Cliente[] = [];
  filtroCliente: string = '';
  asignando = false;
  equiposSeleccionados: string[] = [];
  vistaActual: 'lista' | 'detalle' | 'formulario' = 'lista';
  
  // REEMPLAZADO: clientesAsignados por clientesPorRutina
  clientesPorRutina: Map<string, Cliente[]> = new Map();
  showVerClientesModal: boolean = false;
  mostrarClientesAsignados = false;
  
  // Búsqueda y filtros
  searchTerm = '';
  filterStatus = '';
  
  // Ejercicios
  ejerciciosDisponibles: Ejercicio[] = [];
  ejerciciosFiltrados: Ejercicio[] = [];
  ejercicioSeleccionado: string = '';
  nuevoEjercicio: Partial<EjercicioRutina> = {
    seriesEjercicio: 3,
    repeticionesEjercicio: 10,
    descansoEjercicio: 60,
    instrucciones: ''
  };
  

  // Filtros para ejercicios
  filtroEjercicioNombre: string = '';
  filtroGrupoMuscular: string = '';
  
  // NUEVO: Estado para el modal de configuración de ejercicio
  showConfigurarEjercicioModal = false;
  
  // Opciones para selects
  gruposMusculares: string[] = [
    'Pecho', 'Espalda', 'Hombros', 'Piernas', 'Brazos', 
    'Abdominales', 'Glúteos', 'Cardio', 'Full Body'
  ];
  
  equiposDisponibles: string[] = [
    'Mancuernas', 'Barra', 'Máquina', 'Peso Corporal', 
    'Bandas de Resistencia', 'Kettlebell', 'Balón Medicinal',
    'TRX', 'Polea', 'Press', 'Bicicleta', 'Cinta de Correr',
    'Elíptica', 'Step', 'Bosu', 'Ninguno', 'Otro'
  ];
  
  // Modales
  showEjercicioModal = false;
  showAsignarModal = false;
  showCrearEjercicioModal = false;
  creandoEjercicio = false;
  
  // REEMPLAZADO: Instructor temporal por instructor autenticado
  private instructorActual: string = '';

  // Formularios
  rutinaForm: FormGroup;
  ejercicioForm: FormGroup;
  
  // CORREGIDO: Inicializar clientesAsignados como array vacío
  clientesAsignados: Cliente[] = [];

  // Servicios de Angular Material
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private rutinaService: RutinaService,
    // Inyectar AuthService
    private authService: AuthService
  ) {
    // Inicializar instructor antes de crear formularios
    this.inicializarInstructor();
    this.rutinaForm = this.createRutinaForm();
    this.ejercicioForm = this.createEjercicioForm();
  }

  ngOnInit() {
    this.cargarRutinas();
    this.cargarEjerciciosDisponibles();
  }

  // NUEVO MÉTODO: Inicializar instructor desde AuthService
  private inicializarInstructor(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.idPersona) {
      this.instructorActual = currentUser.idPersona;
      console.log('👤 Instructor autenticado:', this.instructorActual);
    } else {
      console.error('❌ No se pudo obtener el instructor autenticado');
      this.mostrarError('Error de Autenticación', 'No se pudo identificar al instructor. Por favor, inicie sesión nuevamente.');
    }
  }

  // ===== SISTEMA DE ALERTAS ESTANDARIZADO =====

  private mostrarExito(titulo: string, mensaje: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '420px',
      data: {
        title: titulo,
        message: mensaje,
        icon: 'check_circle',
        iconType: 'success',
        buttonText: 'Aceptar'
      }
    });
  }

  private mostrarError(titulo: string, mensaje: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '420px',
      data: {
        title: titulo,
        message: mensaje,
        icon: 'error',
        iconType: 'error',
        buttonText: 'Entendido'
      }
    });
  }

  private mostrarAdvertencia(titulo: string, mensaje: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '420px',
      data: {
        title: titulo,
        message: mensaje,
        icon: 'warning',
        iconType: 'warning',
        buttonText: 'Entendido'
      }
    });
  }

  private mostrarInfo(titulo: string, mensaje: string): void {
    this.dialog.open(AlertDialogComponent, {
      width: '420px',
      data: {
        title: titulo,
        message: mensaje,
        icon: 'info',
        iconType: 'info',
        buttonText: 'Aceptar'
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
    iconType: IconType = 'question',
    confirmButtonText: string = 'Confirmar',
    cancelButtonText: string = 'Cancelar'
  ): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: titulo,
        message: mensaje,
        confirmText: confirmButtonText,
        cancelText: cancelButtonText,
        iconType: iconType
      }
    });

    return dialogRef.afterClosed().toPromise() || Promise.resolve(false);
  }

  // Método de compatibilidad (para no romper el código existente)
  private showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    const typeMap = {
      'success': 'success',
      'danger': 'error',
      'warning': 'warning',
      'info': 'info'
    };
    
    const mappedType = typeMap[type];
    
    if (mappedType === 'success') {
      this.mostrarExito('Éxito', message);
    } else if (mappedType === 'error') {
      this.mostrarError('Error', message);
    } else if (mappedType === 'warning') {
      this.mostrarAdvertencia('Advertencia', message);
    } else {
      this.mostrarInfo('Información', message);
    }
  }

  // Método para alertas de acción con botones de confirmación
  private mostrarAlertaAccion(mensaje: string, accion: string, callback: () => void): void {
    const snackBarRef = this.snackBar.open(mensaje, accion, {
      duration: 8000,
      panelClass: ['snackbar-warning'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });

    snackBarRef.onAction().subscribe(() => {
      callback();
    });
  }

  // ===== MÉTODOS EXISTENTES ACTUALIZADOS CON NUEVAS ALERTAS =====

 getEquiposByCategory(categoria: 'basico' | 'maquinas' | 'accesorios'): string[] {
  const equiposCategorizados = {
    'basico': [
      'Mancuernas', 
      'Barra', 
      'Pesas', 
      'Kettlebell',
      'Bodyweight'
    ],
    'maquinas': [
      'Máquina', 
      'Press de Banca', 
      'Leg Press', 
      'Pull-up Bar',
      'Bench'
    ],
    'accesorios': [
      'Banda Elástica', 
      'Resistance Bands', 
      'Cuerda', 
      'Balón Medicinal',
      'Step', 
      'TRX', 
      'Ninguno'
    ]
  };
  
  return equiposCategorizados[categoria];
}

getEquipoIcon(equipo: string): string {
  const iconMap: { [key: string]: string } = {
    'Mancuernas': 'fas fa-dumbbell',
    'Barra': 'fas fa-weight-hanging',
    'Máquina': 'fas fa-cogs',
    'Pesas': 'fas fa-weight',
    'Banda Elástica': 'fas fa-expand-alt',
    'Cuerda': 'fas fa-rope',
    'Balón Medicinal': 'fas fa-basketball-ball',
    'Step': 'fas fa-stairs',
    'TRX': 'fas fa-hands',
    'Kettlebell': 'fas fa-dumbbell',
    'Ninguno': 'fas fa-ban',
    'Bodyweight': 'fas fa-user',
    'Resistance Bands': 'fas fa-expand-arrows-alt',
    'Pull-up Bar': 'fas fa-grip-lines',
    'Bench': 'fas fa-couch',
    'Press de Banca': 'fas fa-bed',
    'Leg Press': 'fas fa-shoe-prints'
  };
  
  return iconMap[equipo] || 'fas fa-dumbbell';
}

  // ===== NUEVOS MÉTODOS PARA EL SISTEMA DE MODALES =====

  /**
   * Selecciona un ejercicio y abre el modal de configuración
   */
  selectEjercicioForModal(idEjercicio: string): void {
    if (this.isEjercicioEnRutina(idEjercicio)) {
      this.mostrarAdvertencia('Ejercicio Duplicado', 'Este ejercicio ya está en la rutina');
      return;
    }
    
    this.ejercicioSeleccionado = idEjercicio;
    
    // Inicializar los valores por defecto para el nuevo ejercicio
    this.nuevoEjercicio = {
      seriesEjercicio: 3,
      repeticionesEjercicio: 10,
      descansoEjercicio: 60,
      orden: (this.selectedRutina?.ejercicios?.length || 0) + 1,
      instrucciones: this.getEjercicioInstrucciones(idEjercicio) || ''
    };
    
    // Cerrar el modal de selección y abrir el de configuración
    this.showEjercicioModal = false;
    this.showConfigurarEjercicioModal = true;
  }

  /**
   * Cierra el modal de configuración de ejercicio
   */
  closeConfigurarEjercicioModal(): void {
    this.showConfigurarEjercicioModal = false;
    this.ejercicioSeleccionado = '';
    this.nuevoEjercicio = {
      seriesEjercicio: 3,
      repeticionesEjercicio: 10,
      descansoEjercicio: 60,
      instrucciones: ''
    };
  }

  /**
   * Obtiene el nombre del ejercicio seleccionado para mostrar en el modal
   */
  getEjercicioNombreModal(): string {
    return this.getEjercicioNombre(this.ejercicioSeleccionado);
  }

  /**
   * Obtiene el grupo muscular del ejercicio seleccionado
   */
  getEjercicioGrupoMuscular(idEjercicio: string): string {
    const ejercicio = this.getEjercicioInfo(idEjercicio);
    return ejercicio?.grupoMuscular || 'No especificado';
  }

  /**
   * Obtiene el equipo necesario del ejercicio seleccionado
   */
  getEjercicioEquipo(idEjercicio: string): string {
    const ejercicio = this.getEjercicioInfo(idEjercicio);
    return ejercicio?.equipoNecesario || 'Sin equipo específico';
  }

  /**
   * Obtiene las instrucciones del ejercicio seleccionado
   */
  getEjercicioInstrucciones(idEjercicio: string): string {
    const ejercicio = this.getEjercicioInfo(idEjercicio);
    return ejercicio?.instrucciones || 'Sin instrucciones específicas';
  }

  /**
   * Maneja el cambio en las series desde el modal de configuración
   */
  onSeriesChangeModal(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 3;
    this.nuevoEjercicio.seriesEjercicio = value;
  }

  /**
   * Maneja el cambio en las repeticiones desde el modal de configuración
   */
  onRepeticionesChangeModal(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 10;
    this.nuevoEjercicio.repeticionesEjercicio = value;
  }

  /**
   * Maneja el cambio en el descanso desde el modal de configuración
   */
  onDescansoChangeModal(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 60;
    this.nuevoEjercicio.descansoEjercicio = value;
  }

  /**
   * Maneja el cambio en el orden desde el modal de configuración
   */
  onOrdenChangeModal(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 1;
    this.nuevoEjercicio.orden = value;
  }

  /**
   * Maneja el cambio en las instrucciones desde el modal de configuración
   */
  onInstruccionesChangeModal(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.nuevoEjercicio.instrucciones = value;
  }

  /**
   * Verifica si el ejercicio es válido para agregar
   */
  esEjercicioValidoModal(): boolean {
    return !!this.ejercicioSeleccionado && 
           !!this.nuevoEjercicio.seriesEjercicio && 
           this.nuevoEjercicio.seriesEjercicio > 0 &&
           !!this.nuevoEjercicio.repeticionesEjercicio && 
           this.nuevoEjercicio.repeticionesEjercicio > 0 &&
           !!this.nuevoEjercicio.descansoEjercicio && 
           this.nuevoEjercicio.descansoEjercicio >= 0 &&
           !!this.nuevoEjercicio.orden && 
           this.nuevoEjercicio.orden > 0;
  }

  /**
   * Agrega el ejercicio desde el modal de configuración
   */
  agregarEjercicioDesdeModal(): void {
    if (!this.selectedRutina || !this.ejercicioSeleccionado) {
      this.mostrarAdvertencia('Datos Incompletos', 'No hay rutina seleccionada o ejercicio no válido');
      return;
    }

    if (this.isEjercicioEnRutina(this.ejercicioSeleccionado)) {
      this.mostrarAdvertencia('Ejercicio Duplicado', 'Este ejercicio ya está en la rutina. No se pueden agregar duplicados.');
      return;
    }

    if (!this.esEjercicioValidoModal()) {
      this.mostrarAdvertencia('Formulario Incompleto', 'Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    const ejercicioRutina: EjercicioRutina = {
      idEjercicio: this.ejercicioSeleccionado,
      orden: this.nuevoEjercicio.orden || (this.selectedRutina.ejercicios?.length || 0) + 1,
      seriesEjercicio: this.nuevoEjercicio.seriesEjercicio || 3,
      repeticionesEjercicio: this.nuevoEjercicio.repeticionesEjercicio || 10,
      descansoEjercicio: this.nuevoEjercicio.descansoEjercicio || 60,
      instrucciones: this.nuevoEjercicio.instrucciones || this.getEjercicioInstrucciones(this.ejercicioSeleccionado)
    };

    this.rutinaService.agregarEjercicioARutina(this.selectedRutina.folioRutina, ejercicioRutina).subscribe({
      next: (rutinaActualizada) => {
        this.selectedRutina = rutinaActualizada;
        this.showConfigurarEjercicioModal = false;
        this.mostrarExito('¡Éxito!', 'Ejercicio agregado exitosamente');
        
        // Actualizar la lista de rutinas
        const index = this.rutinas.findIndex(r => r.folioRutina === rutinaActualizada.folioRutina);
        if (index !== -1) {
          this.rutinas[index] = rutinaActualizada;
        }
        
        // Limpiar selección
        this.ejercicioSeleccionado = '';
        this.nuevoEjercicio = {
          seriesEjercicio: 3,
          repeticionesEjercicio: 10,
          descansoEjercicio: 60,
          instrucciones: ''
        };
      },
      error: (error) => {
        if (error.message.includes('duplicate key') || error.message.includes('ya existe')) {
          this.mostrarAdvertencia('Ejercicio Duplicado', 'Este ejercicio ya está en la rutina. No se pueden agregar duplicados.');
        } else {
          this.mostrarError('Error', 'Error al agregar el ejercicio: ' + error.message);
        }
      }
    });
  }

  /**
   * Muestra el modal de agregar ejercicio (versión mejorada)
   */
  showAgregarEjercicioMejorado(): void {
    if (!this.selectedRutina) {
      this.mostrarAdvertencia('Selección Requerida', 'Selecciona una rutina primero');
      return;
    }
    
    this.showEjercicioModal = true;
    this.ejercicioSeleccionado = '';
    this.nuevoEjercicio = {
      seriesEjercicio: 3,
      repeticionesEjercicio: 10,
      descansoEjercicio: 60,
      orden: (this.selectedRutina.ejercicios?.length || 0) + 1,
      instrucciones: ''
    };
    this.filtroEjercicioNombre = '';
    this.filtroGrupoMuscular = '';
    this.filtrarEjercicios();
  }

  // ===== MÉTODOS MODIFICADOS EXISTENTES =====

  /**
   * Método showAgregarEjercicio actualizado para usar el nuevo sistema
   */
  showAgregarEjercicio(): void {
    this.showAgregarEjercicioMejorado();
  }

  /**
   * Método selectEjercicioCard actualizado para usar el nuevo sistema
   */
  selectEjercicioCard(idEjercicio: string): void {
    this.selectEjercicioForModal(idEjercicio);
  }

  /**
   * Método agregarEjercicio actualizado para redirigir al nuevo sistema
   */
  agregarEjercicio(): void {
    this.agregarEjercicioDesdeModal();
  }

  /**
   * Método esEjercicioValido actualizado
   */
  esEjercicioValido(): boolean {
    return this.esEjercicioValidoModal();
  }

  // ===== MÉTODOS CON ALERTAS DE ACCIÓN ACTUALIZADAS =====

  desasignarCliente(folioCliente: string): void {
    if (!this.selectedRutina) return;

    this.mostrarConfirmacion(
      '¿Desasignar Cliente?',
      '¿Estás seguro de que deseas desasignar este cliente de la rutina?',
      'warning',
      'Sí, desasignar',
      'Cancelar'
    ).then((result) => {
      if (result) {
        this.rutinaService.desasignarRutinaDeCliente(this.selectedRutina!.folioRutina, folioCliente)
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.mostrarExito('¡Éxito!', 'Cliente desasignado exitosamente');
                this.cargarClientesAsignadosParaRutina(this.selectedRutina!.folioRutina);
                this.cargarClientesAsignadosParaModal();
              } else {
                this.mostrarError('Error', 'Error al desasignar cliente: ' + response.message);
              }
            },
            error: (error) => {
              this.mostrarError('Error', 'Error al desasignar cliente: ' + error.message);
            }
          });
      }
    });
  }

  deleteRutina(): void {
    if (!this.selectedRutina) return;

    this.mostrarConfirmacion(
      '¿Eliminar Rutina?',
      `¿Estás seguro de que deseas eliminar la rutina "${this.selectedRutina.nombre}"? Esta acción no se puede deshacer.`,
      'warning',
      'Sí, eliminar',
      'Cancelar'
    ).then((result) => {
      if (result) {
        this.rutinaService.eliminarRutina(this.selectedRutina!.folioRutina).subscribe({
          next: () => {
            this.clientesPorRutina.delete(this.selectedRutina!.folioRutina);
            this.rutinas = this.rutinas.filter(r => r.folioRutina !== this.selectedRutina!.folioRutina);
            this.selectedRutina = null;
            this.mostrarExito('¡Eliminada!', 'Rutina eliminada exitosamente');
            this.filterRutinas();
          },
          error: (error) => {
            this.mostrarError('Error', 'Error al eliminar la rutina: ' + error.message);
          }
        });
      }
    });
  }

  eliminarEjercicio(idEjercicio: string): void {
    if (!this.selectedRutina) return;

    this.mostrarConfirmacion(
      '¿Eliminar Ejercicio?',
      '¿Estás seguro de que deseas eliminar este ejercicio de la rutina?',
      'warning',
      'Sí, eliminar',
      'Cancelar'
    ).then((result) => {
      if (result) {
        this.rutinaService.eliminarEjercicioDeRutina(this.selectedRutina!.folioRutina, idEjercicio).subscribe({
          next: (rutinaActualizada) => {
            this.selectedRutina = rutinaActualizada;
            this.mostrarExito('¡Éxito!', 'Ejercicio eliminado exitosamente');
            
            const index = this.rutinas.findIndex(r => r.folioRutina === rutinaActualizada.folioRutina);
            if (index !== -1) {
              this.rutinas[index] = rutinaActualizada;
            }
          },
          error: (error) => {
            this.mostrarError('Error', 'Error al eliminar el ejercicio: ' + error.message);
          }
        });
      }
    });
  }

  cambiarEstatusRutina(rutina: Rutina, nuevoEstatus: string): void {
    const actionText = nuevoEstatus === 'Inactiva' ? 'inactivar' : 'activar';
    
    this.mostrarConfirmacion(
      `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Rutina?`,
      `¿Estás seguro de que quieres ${actionText} la rutina "${rutina.nombre}"?`,
      'question',
      `Sí, ${actionText}`,
      'Cancelar'
    ).then((result) => {
      if (result) {
        this.rutinaService.cambiarEstatusRutina(rutina.folioRutina, nuevoEstatus)
          .subscribe({
            next: (response: any) => {
              const actionText = nuevoEstatus === 'Inactiva' ? 'desactivada' : 'activada';
              this.mostrarExito('¡Éxito!', `Rutina ${actionText} exitosamente`);
              
              const index = this.rutinas.findIndex(r => r.folioRutina === rutina.folioRutina);
              if (index !== -1) {
                this.rutinas[index].estatus = nuevoEstatus;
              }
              
              if (this.selectedRutina && this.selectedRutina.folioRutina === rutina.folioRutina) {
                this.selectedRutina.estatus = nuevoEstatus;
              }
              
              this.filterRutinas();
            },
            error: (error) => {
              console.error('Error al cambiar estatus:', error);
              this.mostrarError('Error', 'Error al cambiar el estatus de la rutina');
            }
          });
      }
    });
  }

  // Método específico para inactivar
  inactivarRutina(rutina: Rutina): void {
    this.cambiarEstatusRutina(rutina, 'Inactiva');
  }

  // Método específico para activar
  activarRutina(rutina: Rutina): void {
    this.cambiarEstatusRutina(rutina, 'Activa');
  }

  // FORMULARIOS
  createRutinaForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      nivel: [''],
      objetivo: [''],
      estatus: ['Activa'],
      // USAR instructorActual en lugar del valor fijo
      folioInstructor: [this.instructorActual, Validators.required]
    });
  }

  createEjercicioForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      tiempo: [null],
      series: [null],
      repeticiones: [null],
      descanso: [null],
      equipoNecesario: [[], Validators.required],
      grupoMuscular: ['', Validators.required],
      instrucciones: ['', Validators.required],
      estatus: ['Activo']
    });
  }

  // NUEVOS MÉTODOS PARA MANEJAR CLIENTES POR RUTINA
  async showVerClientesAsignados(): Promise<void> {
    if (!this.selectedRutina) {
      this.mostrarAdvertencia('Selección Requerida', 'No hay rutina seleccionada');
      return;
    }
    
    this.mostrarSnackbar('Cargando clientes asignados...', 'info');
    
    try {
      await this.cargarClientesAsignadosParaModal();
      
      if (this.clientesAsignados.length === 0) {
        this.mostrarInfo('Sin Clientes', 'No hay clientes asignados para mostrar');
        this.showVerClientesModal = true;
      } else {
        this.showVerClientesModal = true;
      }
    } catch (error) {
      this.mostrarError('Error', 'Error al cargar clientes asignados');
      console.error('Error:', error);
    }
  }

  // Modificar el método para que retorne una Promise
  cargarClientesAsignadosParaModal(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedRutina) {
        this.clientesAsignados = [];
        resolve();
        return;
      }
      
      this.rutinaService.obtenerClientesAsignadosARutina(this.selectedRutina.folioRutina).subscribe({
        next: (clientes) => {
          this.clientesAsignados = clientes || [];
          this.clientesPorRutina.set(this.selectedRutina!.folioRutina, this.clientesAsignados);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar clientes asignados para modal:', error);
          this.clientesAsignados = [];
          this.clientesPorRutina.set(this.selectedRutina!.folioRutina, []);
          reject(error);
        }
      });
    });
  }

  closeVerClientesModal(): void {
    this.showVerClientesModal = false;
  }

  getClientesAsignados(folioRutina: string): Cliente[] {
    if (!folioRutina) return [];
    return this.clientesPorRutina.get(folioRutina) || [];
  }

  getClientesAsignadosCount(folioRutina: string): number {
    if (!folioRutina) return 0;
    return this.getClientesAsignados(folioRutina).length;
  }

  // Método para precargar clientes de todas las rutinas
  precargarClientesDeTodasLasRutinas() {
    this.rutinas.forEach(rutina => {
      this.cargarClientesAsignadosParaRutina(rutina.folioRutina);
    });
  }

  // Método modificado para cargar clientes para una rutina específica
  cargarClientesAsignadosParaRutina(folioRutina: string) {
    this.rutinaService.obtenerClientesAsignadosARutina(folioRutina).subscribe({
      next: (clientes) => {
        this.clientesPorRutina.set(folioRutina, clientes);
      },
      error: (error) => {
        console.error('Error al cargar clientes asignados para rutina:', folioRutina, error);
        this.clientesPorRutina.set(folioRutina, []);
      }
    });
  }

  // MÉTODOS PARA EQUIPOS MÚLTIPLES
  toggleEquipo(equipo: string) {
    const equiposActuales: string[] = this.ejercicioForm.get('equipoNecesario')?.value || [];
    const index = equiposActuales.indexOf(equipo);
    
    if (index > -1) {
      equiposActuales.splice(index, 1);
    } else {
      equiposActuales.push(equipo);
    }
    
    this.ejercicioForm.patchValue({
      equipoNecesario: [...equiposActuales]
    });
  }

  isEquipoSeleccionado(equipo: string): boolean {
    const equiposActuales: string[] = this.ejercicioForm.get('equipoNecesario')?.value || [];
    return equiposActuales.includes(equipo);
  }

  getEquiposSeleccionadosTexto(): string {
    const equipos: string[] = this.ejercicioForm.get('equipoNecesario')?.value || [];
    return equipos.length > 0 ? equipos.join(', ') : 'Ningún equipo seleccionado';
  }

  // FILTRADO DE EJERCICIOS
  filtrarEjercicios() {
    let ejerciciosFiltrados = this.ejerciciosDisponibles;

    if (this.filtroEjercicioNombre) {
      const termino = this.filtroEjercicioNombre.toLowerCase();
      ejerciciosFiltrados = ejerciciosFiltrados.filter(ejercicio =>
        ejercicio.nombre.toLowerCase().includes(termino)
      );
    }

    if (this.filtroGrupoMuscular) {
      ejerciciosFiltrados = ejerciciosFiltrados.filter(ejercicio =>
        ejercicio.grupoMuscular === this.filtroGrupoMuscular
      );
    }

    this.ejerciciosFiltrados = ejerciciosFiltrados;
  }

  onFiltroEjercicioNombreChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filtroEjercicioNombre = value;
    this.filtrarEjercicios();
  }

  onFiltroGrupoMuscularChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filtroGrupoMuscular = value;
    this.filtrarEjercicios();
  }

  limpiarFiltrosEjercicios() {
    this.filtroEjercicioNombre = '';
    this.filtroGrupoMuscular = '';
    this.filtrarEjercicios();
  }

  // ===== MÉTODOS PARA FORMATO DE TIEMPO =====
  
  formatTiempo(tiempo: number | null | undefined): string {
    if (!tiempo && tiempo !== 0) return 'N/A';
    
    if (tiempo < 60) {
      return `${tiempo}s`;
    } else {
      const minutos = Math.floor(tiempo / 60);
      const segundos = tiempo % 60;
      if (segundos === 0) {
        return `${minutos}m`;
      } else {
        return `${minutos}m ${segundos}s`;
      }
    }
  }

  getTiempoClass(tiempo: number | null | undefined): string {
    if (!tiempo && tiempo !== 0) return '';
    return tiempo < 60 ? 'time-seconds' : 'time-minutes';
  }

  formatTiempoCompleto(tiempo: number | null | undefined): string {
    if (!tiempo && tiempo !== 0) return 'No especificado';
    
    if (tiempo < 60) {
      return `${tiempo} segundos`;
    } else {
      const minutos = Math.floor(tiempo / 60);
      const segundos = tiempo % 60;
      if (segundos === 0) {
        return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
      } else {
        return `${minutos} minuto${minutos !== 1 ? 's' : ''} y ${segundos} segundo${segundos !== 1 ? 's' : ''}`;
      }
    }
  }

  // CONVERSIÓN DE TIEMPO
  convertirMinutosASegundos(minutos: number | null): number | null {
    return minutos !== null ? minutos * 60 : null;
  }

  convertirSegundosAMinutos(segundos: number | null): number | null {
    return segundos !== null ? Math.round(segundos / 60) : null;
  }

  // CÁLCULO CORREGIDO DEL TIEMPO
  calcularTiempoEjercicio(): number {
    if (!this.ejercicioSeleccionado || !this.nuevoEjercicio.seriesEjercicio) return 0;
    
    const ejercicio = this.getEjercicioInfo(this.ejercicioSeleccionado);
    
    let tiempoPorSerieSegundos = 45;
    if (ejercicio?.tiempo) {
      tiempoPorSerieSegundos = ejercicio.tiempo;
    }
    
    let descansoPorSerieSegundos = 60;
    if (this.nuevoEjercicio.descansoEjercicio) {
      descansoPorSerieSegundos = this.nuevoEjercicio.descansoEjercicio;
    }
    
    const series = this.nuevoEjercicio.seriesEjercicio;
    const tiempoTotalSegundos = (tiempoPorSerieSegundos * series) + (descansoPorSerieSegundos * (series - 1));
    const tiempoTotalMinutos = tiempoTotalSegundos / 60;
    
    return Math.ceil(tiempoTotalMinutos);
  }

  getTiempoEjercicioDesglose(): string {
    if (!this.ejercicioSeleccionado || !this.nuevoEjercicio.seriesEjercicio) return '';
    
    const ejercicio = this.getEjercicioInfo(this.ejercicioSeleccionado);
    const tiempoPorSerieSegundos = ejercicio?.tiempo || 45;
    const descansoPorSerieSegundos = this.nuevoEjercicio.descansoEjercicio || 60;
    const series = this.nuevoEjercicio.seriesEjercicio;
    
    const tiempoPorSerieFormateado = this.formatTiempo(tiempoPorSerieSegundos);
    const descansoPorSerieFormateado = this.formatTiempo(descansoPorSerieSegundos);
    
    return `${series} series × ${tiempoPorSerieFormateado} + ${(series - 1)} descansos × ${descansoPorSerieFormateado}`;
  }

  formatearTiempo(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const minsRestantes = minutos % 60;
      if (minsRestantes === 0) {
        return `${horas} h`;
      } else {
        return `${horas} h ${minsRestantes} min`;
      }
    }
  }

  calcularTiempoTotalRutina(): number {
    if (!this.selectedRutina?.ejercicios) return 0;
    
    return this.selectedRutina.ejercicios.reduce((total, ejercicio) => {
      return total + this.calcularTiempoEjercicioIndividual(ejercicio);
    }, 0);
  }

  calcularTiempoEjercicioIndividual(ejercicio: any): number {
    const tiempoPorSerie = 2;
    const descansoPorSerie = ejercicio.descansoEjercicio / 60;
    
    return ejercicio.seriesEjercicio * (tiempoPorSerie + descansoPorSerie);
  }

  getCompatibilityClass(cliente: any, rutina: any): string {
    const nivelCliente = this.getNivelCliente(cliente);
    const nivelRutina = rutina.nivel;
    
    if (nivelCliente === nivelRutina) return 'compatibility-high';
    if (this.isNivelCompatible(nivelCliente, nivelRutina)) return 'compatibility-medium';
    return 'compatibility-low';
  }

  getCompatibilityIcon(cliente: any, rutina: any): string {
    const compatibilityClass = this.getCompatibilityClass(cliente, rutina);
    switch (compatibilityClass) {
      case 'compatibility-high': return 'fa-check-circle';
      case 'compatibility-medium': return 'fa-exclamation-circle';
      case 'compatibility-low': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  getCompatibilityText(cliente: any, rutina: any): string {
    const compatibilityClass = this.getCompatibilityClass(cliente, rutina);
    switch (compatibilityClass) {
      case 'compatibility-high': return 'Alta';
      case 'compatibility-medium': return 'Media';
      case 'compatibility-low': return 'Baja';
      default: return 'No evaluada';
    }
  }

  getNivelCliente(cliente: any): string {
    return cliente.nivel || 'Principiante';
  }

  isNivelCompatible(nivelCliente: string, nivelRutina: string): boolean {
    const niveles = ['Principiante', 'Intermedio', 'Avanzado'];
    const indexCliente = niveles.indexOf(nivelCliente);
    const indexRutina = niveles.indexOf(nivelRutina);
    
    return indexCliente >= indexRutina - 1 && indexCliente <= indexRutina + 1;
  }

  getClienteEmail(folioCliente: string): string {
    const cliente = this.clientesDisponibles.find(c => c.folioCliente === folioCliente);
    return cliente ? cliente.email : 'Email no encontrado';
  }

  showAsignarClientes() {
    if (!this.selectedRutina) return;
    
    this.showAsignarModal = true;
    this.clientesSeleccionados = [];
    this.filtroCliente = '';
    
    this.cargarClientesAsignados();
  }

  cargarClientesAsignados() {
    if (!this.selectedRutina) return;
    
    this.rutinaService.obtenerClientesAsignadosARutina(this.selectedRutina.folioRutina).subscribe({
      next: (clientes) => {
        this.clientesPorRutina.set(this.selectedRutina!.folioRutina, clientes);
        this.cargarTodosLosClientesYFiltrar();
      },
      error: (error) => {
        console.error('Error al cargar clientes asignados:', error);
        this.cargarTodosLosClientesComoDisponibles();
      }
    });
  }

  cargarTodosLosClientesYFiltrar() {
    this.rutinaService.obtenerTodosLosClientes().subscribe({
      next: (todosLosClientes) => {
        const clientesAsignadosActuales = this.getClientesAsignados(this.selectedRutina!.folioRutina);
        this.clientesDisponibles = todosLosClientes.filter(cliente => 
          !clientesAsignadosActuales.some(asignado => asignado.folioCliente === cliente.folioCliente)
        );
        this.clientesFiltrados = this.clientesDisponibles;
      },
      error: (error) => {
        console.error('Error al cargar todos los clientes:', error);
        this.mostrarError('Error', 'Error al cargar la lista de clientes: ' + error.message);
      }
    });
  }

  cargarTodosLosClientesComoDisponibles() {
    this.rutinaService.obtenerTodosLosClientes().subscribe({
      next: (clientes) => {
        this.clientesDisponibles = clientes;
        this.clientesFiltrados = clientes;
      },
      error: (error) => {
        console.error('Error al cargar todos los clientes:', error);
        this.mostrarError('Error', 'Error al cargar la lista de clientes: ' + error.message);
      }
    });
  }

  isClienteAsignado(folioCliente: string): boolean {
    if (!this.selectedRutina) return false;
    const clientesAsignados = this.getClientesAsignados(this.selectedRutina.folioRutina);
    return clientesAsignados.some(cliente => cliente.folioCliente === folioCliente);
  }

  asignarRutinaAClientes() {
    if (!this.selectedRutina || this.clientesSeleccionados.length === 0) {
      this.mostrarAdvertencia('Selección Requerida', 'Selecciona al menos un cliente para asignar la rutina');
      return;
    }

    this.asignando = true;

    const request = {
      foliosClientes: this.clientesSeleccionados,
      // USAR instructorActual en lugar del valor fijo
      folioInstructor: this.instructorActual
    };

    this.rutinaService.asignarRutinaAMultiplesClientes(this.selectedRutina.folioRutina, request)
      .subscribe({
        next: (response) => {
          this.asignando = false;
          
          if (response.success) {
            this.mostrarExito('¡Éxito!', `Rutina asignada exitosamente a ${response.resultado?.totalExitosas || 0} clientes`);
            
            if (response.resultado && response.resultado.errores.length > 0) {
              const errores = response.resultado.errores.join(', ');
              this.mostrarAdvertencia('Asignación Parcial', `Algunos clientes no pudieron ser asignados: ${errores}`);
            }
            
            this.cargarClientesAsignadosParaRutina(this.selectedRutina!.folioRutina);
            this.cargarClientesAsignadosParaModal();
            this.closeAsignarModal();
          } else {
            this.mostrarError('Error', 'Error al asignar la rutina: ' + response.message);
          }
        },
        error: (error) => {
          this.asignando = false;
          this.mostrarError('Error', 'Error al asignar la rutina: ' + error.message);
        }
      });
  }

  toggleMostrarClientesAsignados() {
    this.mostrarClientesAsignados = !this.mostrarClientesAsignados;
  }

  // MANEJADORES DE EVENTOS PARA FORMULARIOS
  onSearchTermChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    this.filterRutinas();
  }

  onFilterStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterStatus = value;
    this.filterRutinas();
  }

  onEjercicioSeleccionadoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.ejercicioSeleccionado = value;
  }

  onSeriesChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 3;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      seriesEjercicio: value
    };
  }

  onRepeticionesChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 10;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      repeticionesEjercicio: value
    };
  }

  onDescansoChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 60;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      descansoEjercicio: value
    };
  }

  onInstruccionesChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      instrucciones: value
    };
  }

  onOrdenChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 1;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      orden: value
    };
  }

  // CARGA DE DATOS MODIFICADA
  cargarRutinas() {
    // Verificar que tenemos un instructor autenticado
    if (!this.instructorActual) {
      console.error('❌ No hay instructor autenticado para cargar rutinas');
      this.mostrarError('Error de Autenticación', 'No se pudo identificar al instructor');
      return;
    }

    console.log('👤 Cargando rutinas para el instructor:', this.instructorActual);

    // Cargar solo las rutinas del instructor autenticado
    this.rutinaService.obtenerRutinasPorInstructor(this.instructorActual).subscribe({
      next: (rutinas) => {
        this.rutinas = rutinas || [];
        this.filteredRutinas = [...this.rutinas];
        this.precargarClientesDeTodasLasRutinas();
        console.log('✅ Rutinas del instructor cargadas:', this.rutinas.length);
        
        // Mostrar mensaje si no hay rutinas
        if (this.rutinas.length === 0) {
          this.mostrarInfo('Sin Rutinas', 'No tienes rutinas creadas. ¡Crea tu primera rutina!');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar rutinas del instructor:', error);
        // Fallback: cargar todas las rutinas y filtrar localmente
        this.cargarTodasLasRutinasYFiltrar();
      }
    });
  }

  // Método fallback
  private cargarTodasLasRutinasYFiltrar(): void {
    console.log('🔄 Intentando cargar todas las rutinas y filtrar...');
    
    this.rutinaService.obtenerTodasLasRutinas().subscribe({
      next: (rutinas) => {
        // Filtrar localmente por el instructor autenticado
        this.rutinas = (rutinas || []).filter(rutina => 
          rutina.folioInstructor === this.instructorActual
        );
        this.filteredRutinas = [...this.rutinas];
        this.precargarClientesDeTodasLasRutinas();
        console.log('✅ Rutinas filtradas localmente:', this.rutinas.length);
        
        if (this.rutinas.length === 0) {
          this.mostrarInfo('Sin Rutinas', 'No tienes rutinas creadas. ¡Crea tu primera rutina!');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar todas las rutinas:', error);
        this.rutinas = [];
        this.filteredRutinas = [];
        this.mostrarError('Error', 'No se pudieron cargar las rutinas. Por favor, intente nuevamente.');
      }
    });
  }

  cargarEjerciciosDisponibles() {
    this.rutinaService.obtenerTodosLosEjercicios().subscribe({
      next: (ejercicios) => {
        this.ejerciciosDisponibles = ejercicios;
        this.ejerciciosFiltrados = ejercicios;
      },
      error: (error) => {
        console.error('Error al cargar ejercicios:', error);
        this.mostrarAdvertencia('Advertencia', 'Error al cargar ejercicios disponibles: ' + error.message);
      }
    });
  }

  // MÉTODOS PARA ASIGNACIÓN DE CLIENTES
  closeAsignarModal() {
    this.showAsignarModal = false;
    this.clientesSeleccionados = [];
    this.filtroCliente = '';
  }

  // FILTRADO DE CLIENTES
  filtrarClientes() {
    if (!this.filtroCliente) {
      this.clientesFiltrados = this.clientesDisponibles;
      return;
    }

    const termino = this.filtroCliente.toLowerCase();
    this.clientesFiltrados = this.clientesDisponibles.filter(cliente =>
      cliente.nombre.toLowerCase().includes(termino) ||
      cliente.folioCliente.toLowerCase().includes(termino) ||
      cliente.email.toLowerCase().includes(termino)
    );
  }

  onFiltroClienteChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filtroCliente = value;
    this.filtrarClientes();
  }

  // SELECCIÓN DE CLIENTES
  toggleClienteSeleccionado(folioCliente: string) {
    const index = this.clientesSeleccionados.indexOf(folioCliente);
    if (index > -1) {
      this.clientesSeleccionados.splice(index, 1);
    } else {
      this.clientesSeleccionados.push(folioCliente);
    }
  }

  isClienteSeleccionado(folioCliente: string): boolean {
    return this.clientesSeleccionados.includes(folioCliente);
  }

  seleccionarTodosClientes() {
    if (this.clientesSeleccionados.length === this.clientesFiltrados.length) {
      this.clientesSeleccionados = [];
    } else {
      this.clientesSeleccionados = this.clientesFiltrados.map(cliente => cliente.folioCliente);
    }
  }

  // MÉTODOS DE UTILIDAD PARA CLIENTES
  getClientesSeleccionadosCount(): number {
    return this.clientesSeleccionados.length;
  }

  getClienteNombre(folioCliente: string): string {
    const cliente = this.clientesDisponibles.find(c => c.folioCliente === folioCliente);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  }

  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth();
    const dia = hoy.getDate();
    
    if (mes < nacimiento.getMonth() || 
        (mes === nacimiento.getMonth() && dia < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  // FILTRADO Y BÚSQUEDA
  filterRutinas() {
    this.filteredRutinas = this.rutinas.filter(rutina => {
      const matchesSearch = rutina.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           rutina.descripcion?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.filterStatus || rutina.estatus === this.filterStatus;
      return matchesSearch && matchesStatus;
    });
  }

  // SELECCIÓN Y NAVEGACIÓN
  selectRutina(rutina: Rutina) {
    this.selectedRutina = rutina;
    this.vistaActual = 'formulario';
    this.isCreating = false;
    this.isEditing = false;
    this.mostrarClientesAsignados = false;
    
    this.cargarClientesAsignados();
  }

  showCreateRutinaForm() {
    this.selectedRutina = null;
    this.vistaActual = 'formulario';
    this.isCreating = true;
    this.isEditing = false;
    this.rutinaForm.reset({
      estatus: 'Activa',
      // USAR instructorActual en lugar del valor fijo
      folioInstructor: this.instructorActual
    });
  }

  editRutina() {
    if (this.selectedRutina) {
      this.isEditing = true;
      this.isCreating = false;
      this.rutinaForm.patchValue(this.selectedRutina);
       this.vistaActual = 'formulario';
    }
  }

 cancelEdit() {
  this.isCreating = false;
  this.isEditing = false;
  
  if (this.selectedRutina) {
    this.vistaActual = 'detalle'; // Mostrar la vista de detalle
    // Opcional: recargar los detalles si es necesario
    this.cargarRutinaDetalle(this.selectedRutina.folioRutina);
  } else {
    this.vistaActual = 'lista'; // Volver a la lista si no hay rutina seleccionada
  }
}


  // OPERACIONES CRUD
  saveRutina() {
    if (this.rutinaForm.invalid) {
      this.mostrarAdvertencia('Formulario Incompleto', 'Por favor complete todos los campos requeridos');
      return;
    }

    const rutinaData = {
      ...this.rutinaForm.value,
      // USAR instructorActual en lugar del valor fijo
      folioInstructor: this.instructorActual
    };

    if (this.isCreating) {
      this.rutinaService.crearRutina(rutinaData).subscribe({
        next: (nuevaRutina) => {
          this.rutinas.push(nuevaRutina);
          this.clientesPorRutina.set(nuevaRutina.folioRutina, []);
          this.selectRutina(nuevaRutina);
          this.isCreating = false;
          this.mostrarExito('¡Éxito!', 'Rutina creada exitosamente');
          this.filterRutinas();
        },
        error: (error) => {
          this.mostrarError('Error', 'Error al crear la rutina: ' + error.message);
        }
      });
    } else if (this.isEditing && this.selectedRutina) {
      this.rutinaService.actualizarRutina(this.selectedRutina.folioRutina, rutinaData).subscribe({
        next: (rutinaActualizada) => {
          const index = this.rutinas.findIndex(r => r.folioRutina === rutinaActualizada.folioRutina);
          if (index !== -1) {
            this.rutinas[index] = rutinaActualizada;
          }
          this.selectedRutina = rutinaActualizada;
          this.isEditing = false;
          this.mostrarExito('¡Éxito!', 'Rutina actualizada exitosamente');
          this.filterRutinas();
        },
        error: (error) => {
          this.mostrarError('Error', 'Error al actualizar la rutina: ' + error.message);
        }
      });
    }
  }

  // GESTIÓN DE EJERCICIOS
  closeEjercicioModal() {
    this.showEjercicioModal = false;
  }

  // MÉTODOS PARA CREAR NUEVOS EJERCICIOS
  showCrearEjercicioModalFromAgregar() {
    this.showEjercicioModal = false;
    this.showCrearEjercicioModal = true;
  }

  showCrearEjercicio() {
    this.showCrearEjercicioModal = true;
  }

  closeCrearEjercicioModal() {
    this.showCrearEjercicioModal = false;
    this.ejercicioForm.reset({
      estatus: 'Activo',
      equipoNecesario: []
    });
  }

  crearEjercicio() {
    if (this.ejercicioForm.invalid) {
      this.mostrarAdvertencia('Formulario Incompleto', 'Por favor complete todos los campos requeridos');
      return;
    }

    this.creandoEjercicio = true;
    
    const formData = this.ejercicioForm.value;
    const ejercicioData: CrearEjercicioRequest = {
      ...formData,
      tiempo: this.convertirMinutosASegundos(formData.tiempo),
      descanso: this.convertirMinutosASegundos(formData.descanso),
      equipoNecesario: Array.isArray(formData.equipoNecesario) ? 
        formData.equipoNecesario.join(', ') : formData.equipoNecesario
    };

    this.rutinaService.crearEjercicio(ejercicioData).subscribe({
      next: (nuevoEjercicio) => {
        this.creandoEjercicio = false;
        this.showCrearEjercicioModal = false;
        
        this.ejerciciosDisponibles.push(nuevoEjercicio);
        this.filtrarEjercicios();
        
        if (this.showEjercicioModal) {
          this.ejercicioSeleccionado = nuevoEjercicio.idEjercicio;
          this.showEjercicioModal = true;
        }
        
        this.mostrarExito('¡Éxito!', 'Ejercicio creado exitosamente');
        this.ejercicioForm.reset({
          estatus: 'Activo',
          equipoNecesario: []
        });
      },
      error: (error) => {
        this.creandoEjercicio = false;
        this.mostrarError('Error', 'Error al crear el ejercicio: ' + error.message);
      }
    });
  }

  isEjercicioEnRutina(idEjercicio: string): boolean {
    if (!this.selectedRutina?.ejercicios) return false;
    return this.selectedRutina.ejercicios.some(ej => ej.idEjercicio === idEjercicio);
  }

  getEjercicioInfo(idEjercicio: string): Ejercicio | null {
    return this.ejerciciosDisponibles.find(e => e.idEjercicio === idEjercicio) || null;
  }

  getEjercicioNombre(idEjercicio: string): string {
    const ejercicio = this.ejerciciosDisponibles.find(e => e.idEjercicio === idEjercicio);
    return ejercicio ? ejercicio.nombre : 'Ejercicio no encontrado';
  }

cargarRutinaDetalle(folioRutina: string) {
  this.rutinaService.obtenerRutinaPorId(folioRutina).subscribe({
    next: (rutina) => {
      this.selectedRutina = rutina;
      this.vistaActual = 'detalle'; // Asegurar que muestre el detalle
    },
    error: (error) => {
      this.mostrarError('Error', 'Error al cargar los detalles de la rutina: ' + error.message);
      this.vistaActual = 'lista'; // En caso de error, volver a la lista
    }
  });
}

  getStatusBadgeClass(estatus: string): string {
    switch (estatus) {
      case 'Activa': return 'bg-success';
      case 'Inactiva': return 'bg-secondary';
      default: return 'bg-info';
    }
  }

  getNivelBadgeClass(nivel: string): string {
    switch (nivel) {
      case 'Principiante': return 'bg-success';
      case 'Intermedio': return 'bg-warning';
      case 'Avanzado': return 'bg-danger';
      default: return 'bg-info';
    }
  }

  // MÉTODOS ADICIONALES
  duplicarRutina(rutina: Rutina): void {
    if (!rutina) return;

    const rutinaDuplicada = {
      nombre: `${rutina.nombre} (Copia)`,
      descripcion: rutina.descripcion,
      nivel: rutina.nivel,
      objetivo: rutina.objetivo,
      estatus: 'Activa',
      // USAR instructorActual en lugar del valor fijo
      folioInstructor: this.instructorActual,
      ejercicios: rutina.ejercicios ? [...rutina.ejercicios] : []
    };

    this.rutinaService.crearRutina(rutinaDuplicada).subscribe({
      next: (nuevaRutina) => {
        this.rutinas.push(nuevaRutina);
        this.clientesPorRutina.set(nuevaRutina.folioRutina, []);
        this.selectRutina(nuevaRutina);
        this.mostrarExito('¡Éxito!', 'Rutina duplicada exitosamente');
        this.filterRutinas();
      },
      error: (error) => {
        this.mostrarError('Error', 'Error al duplicar la rutina: ' + error.message);
      }
    });
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterRutinas();
  }

  // TrackBy functions para mejor rendimiento
  trackByRutina(index: number, rutina: Rutina): string {
    return rutina.folioRutina;
  }

  trackByEjercicio(index: number, ejercicio: EjercicioRutina): string {
    return `${ejercicio.idEjercicio}-${ejercicio.orden}`;
  }

  trackByEjercicioDisponible(index: number, ejercicio: Ejercicio): string {
    return ejercicio.idEjercicio;
  }

  trackByCliente(index: number, cliente: Cliente): string {
    return cliente.folioCliente;
  }

  // Método para obtener rutinas por estatus (para filtros)
  filtrarPorEstatus(estatus: string): void {
    this.rutinaService.getRutinasPorEstatus(estatus).subscribe({
      next: (rutinas) => {
        this.rutinas = rutinas;
        this.filterRutinas();
      },
      error: (error) => {
        console.error('Error al filtrar rutinas por estatus:', error);
        this.mostrarError('Error', 'Error al filtrar rutinas por estatus');
      }
    });
  }
}