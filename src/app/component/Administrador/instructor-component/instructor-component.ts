// instructor.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { 
  Instructor, 
  InstructorEstadisticas, 
  InstructorService, 
  ApiResponse 
} from '../../../services/instructor/instructorService';
import { HeaderAdministradorComponent } from '../header-admin/header-admin'; // Importar el header

@Component({
  selector: 'app-instructor-component',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, HeaderAdministradorComponent],
  templateUrl: './instructor-component.html',
  styleUrls: ['./instructor-component.css']
})
export class InstructorComponent implements OnInit {
  instructores: Instructor[] = [];
  instructoresFiltrados: Instructor[] = [];
  
  instructorSeleccionado: Instructor = this.inicializarInstructor();
  nuevoInstructor: Instructor = this.inicializarInstructor();
  
  // Lista de especialidades predefinidas
  especialidades: string[] = [
    'Yoga',
    'Pilates',
    'CrossFit',
    'Spinning',
    'Boxeo',
    'Musculación',
    'Cardio',
    'Funcional',
    'Danza Fitness',
    'Artes Marciales',
    'Natación',
    'Rehabilitación'
  ];
  
  // Variables para filtros con debounce
  private filtroEspecialidadSubject = new Subject<string>();
  private busquedaNombreSubject = new Subject<string>();
  private busquedaEmailSubject = new Subject<string>();
  
  folioGenerado: string = 'INS001';
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  mostrarEstadisticas: boolean = false;
  cargando: boolean = false;
  nombreInvalido: boolean = false;
  emailInvalido: boolean = false;
  emailExistente: boolean = false;
  
  filtroEstatus: string = '';
  filtroEspecialidad: string = '';
  terminoBusqueda: string = '';
  terminoBusquedaEmail: string = '';
  
  estadisticas: InstructorEstadisticas = {
    totalActividades: 0,
    totalRutinasAsignadas: 0,
    totalClientesActividades: 0,
    totalClientesRutinas: 0,
    promedioCalificacionActividades: 0,
    promedioCalificacionRutinas: 0
  };

  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'warning' = 'success';

  constructor(private instructorService: InstructorService) {}

  ngOnInit(): void {
    this.cargarInstructores();
    
    // Configurar debounce para filtros (300ms)
    this.filtroEspecialidadSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(especialidad => {
      this.aplicarFiltros();
    });

    this.busquedaNombreSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(nombre => {
      this.buscarPorNombre();
    });

    this.busquedaEmailSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(email => {
      this.buscarPorEmail();
    });
  }

  private inicializarInstructor(): Instructor {
    const today = new Date().toISOString().split('T')[0];
    return {
      folioInstructor: '',
      nombre: '',
      app: '',
      apm: '',
      email: '',
      horaEntrada: '',
      horaSalida: '',
      especialidad: '',
      fechaContratacion: today,
      estatus: 'Activo',
      especialidadPersonalizada: ''
    };
  }

  cargarInstructores(): void {
    this.cargando = true;
    
    this.instructorService.obtenerInstructores().subscribe({
      next: (data: Instructor[]) => {
        console.log('✅ Instructores cargados:', data);
        this.instructores = data;
        this.instructoresFiltrados = data;
        this.cargando = false;
       
        // Generar próximo folio basado en los datos existentes
        this.generarProximoFolio();
      },
      error: (error: { status: number; statusText: any; }) => {
        console.error('❌ Error al cargar instructores:', error);
        
        if (error.status === 0) {
          this.mostrarMensaje('No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.', 'error');
        } else {
          this.mostrarMensaje(`Error ${error.status}: ${error.statusText}`, 'error');
        }
        this.cargando = false;
      }
    });
  }

  private generarProximoFolio(): void {
    if (this.instructores.length === 0) {
      this.folioGenerado = 'INS001';
      return;
    }
    
    // Encontrar el folio más alto numéricamente
    const folios = this.instructores
      .map(i => i.folioInstructor)
      .filter(folio => folio.startsWith('INS'))
      .map(folio => {
        const numeroStr = folio.replace('INS', '');
        return parseInt(numeroStr) || 0;
      });
    
    if (folios.length === 0) {
      this.folioGenerado = 'INS001';
      return;
    }
    
    const maxFolio = Math.max(...folios);
    this.folioGenerado = `INS${(maxFolio + 1).toString().padStart(3, '0')}`;
  }

  // MÉTODOS MEJORADOS PARA FILTROS CON DEBOUNCE
  onFiltroEspecialidadChange(): void {
    this.filtroEspecialidadSubject.next(this.filtroEspecialidad);
  }

  onBuscarNombreChange(): void {
    this.busquedaNombreSubject.next(this.terminoBusqueda);
  }

  onBuscarEmailChange(): void {
    this.busquedaEmailSubject.next(this.terminoBusquedaEmail);
  }

  aplicarFiltros(): void {
    this.cargando = true;
    this.instructorService.obtenerInstructoresFiltrados(
      this.filtroEstatus || undefined,
      this.filtroEspecialidad || undefined
    ).subscribe({
      next: (data: Instructor[]) => {
        this.instructoresFiltrados = data;
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al aplicar filtros:', error);
        this.mostrarMensaje('Error al aplicar filtros', 'error');
        this.cargando = false;
      }
    });
  }

  buscarPorNombre(): void {
    if (!this.terminoBusqueda.trim()) {
      this.aplicarFiltros();
      return;
    }

    this.cargando = true;
    this.instructorService.buscarInstructoresPorNombre(this.terminoBusqueda).subscribe({
      next: (data: Instructor[]) => {
        this.instructoresFiltrados = data;
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al buscar:', error);
        this.mostrarMensaje('Error al buscar instructores', 'error');
        this.cargando = false;
      }
    });
  }

  buscarPorEmail(): void {
    if (!this.terminoBusquedaEmail.trim()) {
      this.aplicarFiltros();
      return;
    }

    this.cargando = true;
    this.instructorService.buscarInstructoresPorEmail(this.terminoBusquedaEmail).subscribe({
      next: (data: Instructor[]) => {
        this.instructoresFiltrados = data;
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error al buscar por email:', error);
        this.mostrarMensaje('Error al buscar instructores por email', 'error');
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroEstatus = '';
    this.filtroEspecialidad = '';
    this.terminoBusqueda = '';
    this.terminoBusquedaEmail = '';
    this.instructoresFiltrados = this.instructores;
  }

  prepararNuevoInstructor(): void {
    this.nuevoInstructor = this.inicializarInstructor();
    this.mostrarFormulario = true;
    this.modoEdicion = false;
    this.mostrarEstadisticas = false;
    this.nombreInvalido = false;
    this.emailInvalido = false;
    this.emailExistente = false;
    
    // Generar folio automáticamente
    this.generarProximoFolio();
  }

  validarNombre(): void {
    this.nombreInvalido = !this.nuevoInstructor.nombre.trim();
  }

  validarEmail(): void {
    const email = this.nuevoInstructor.email;
    this.emailInvalido = !this.validarFormatoEmail(email);
    
    // Verificar si el email ya existe
    if (email && this.validarFormatoEmail(email)) {
      this.instructorService.existeInstructorPorEmail(email).subscribe({
        next: (existe: boolean) => {
          this.emailExistente = existe;
        },
        error: (error: any) => {
          console.error('Error al verificar email:', error);
        }
      });
    } else {
      this.emailExistente = false;
    }
  }

  validarEmailEdicion(): void {
    const email = this.instructorSeleccionado.email;
    this.emailInvalido = !this.validarFormatoEmail(email);
  }

  private validarFormatoEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  crearInstructor(): void {
    // Validaciones
    if (!this.nuevoInstructor.nombre.trim()) {
      this.nombreInvalido = true;
      this.mostrarMensaje('El nombre es requerido', 'error');
      return;
    }

    if (!this.nuevoInstructor.email || !this.validarFormatoEmail(this.nuevoInstructor.email)) {
      this.emailInvalido = true;
      this.mostrarMensaje('El email es requerido y debe tener un formato válido', 'error');
      return;
    }

    if (this.emailExistente) {
      this.mostrarMensaje('El email ya está registrado para otro instructor', 'error');
      return;
    }

    // Procesar especialidad si seleccionó "Otra"
    this.procesarEspecialidad(this.nuevoInstructor);

    this.cargando = true;

    // Usar el método que envía credenciales por email
    this.instructorService.crearInstructor(
      this.nuevoInstructor.nombre,
      this.nuevoInstructor.app || '',
      this.nuevoInstructor.apm || '',
      this.nuevoInstructor.email,
      this.nuevoInstructor.horaEntrada || '',
      this.nuevoInstructor.horaSalida || '',
      this.nuevoInstructor.especialidad || '',
      this.nuevoInstructor.fechaContratacion,
      this.nuevoInstructor.estatus
    ).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.mostrarMensaje(response.message, 'success');
          this.cargarInstructores();
          this.cerrarFormulario();
        } else {
          this.mostrarMensaje(response.message, 'error');
        }
        this.cargando = false;
      },
      error: (error: { error: { message: string; }; }) => {
        const errorMessage = error.error?.message || 'Error al crear instructor';
        this.mostrarMensaje(errorMessage, 'error');
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  seleccionarInstructor(instructor: Instructor): void {
    this.instructorSeleccionado = { 
      ...instructor,
      horaEntrada: instructor.horaEntrada ? instructor.horaEntrada.substring(0, 5) : '',
      horaSalida: instructor.horaSalida ? instructor.horaSalida.substring(0, 5) : '',
      fechaContratacion: instructor.fechaContratacion || new Date().toISOString().split('T')[0],
      especialidadPersonalizada: this.especialidades.includes(instructor.especialidad) ? '' : instructor.especialidad
    };
    
    // Si la especialidad no está en la lista predefinida, mostrar como "Otra"
    if (instructor.especialidad && !this.especialidades.includes(instructor.especialidad)) {
      this.instructorSeleccionado.especialidad = 'Otra';
    }
    
    this.mostrarFormulario = true;
    this.modoEdicion = true;
    this.mostrarEstadisticas = false;
    this.emailInvalido = false;
  }

  actualizarInstructor(): void {
    if (!this.instructorSeleccionado.nombre.trim()) {
      this.mostrarMensaje('El nombre es requerido', 'error');
      return;
    }

    if (this.instructorSeleccionado.email && !this.validarFormatoEmail(this.instructorSeleccionado.email)) {
      this.emailInvalido = true;
      this.mostrarMensaje('El email debe tener un formato válido', 'error');
      return;
    }

    // Procesar especialidad si seleccionó "Otra"
    this.procesarEspecialidad(this.instructorSeleccionado);

    this.cargando = true;

    // Usar el método de actualización con parámetros individuales
    this.instructorService.actualizarInstructor(
      this.instructorSeleccionado.folioInstructor,
      this.instructorSeleccionado.nombre,
      this.instructorSeleccionado.app || '',
      this.instructorSeleccionado.apm || '',
      this.instructorSeleccionado.email || '',
      this.instructorSeleccionado.horaEntrada || '',
      this.instructorSeleccionado.horaSalida || '',
      this.instructorSeleccionado.especialidad || '',
      this.instructorSeleccionado.fechaContratacion,
      this.instructorSeleccionado.estatus
    ).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.mostrarMensaje(response.message, 'success');
          this.cargarInstructores();
          this.cerrarFormulario();
        } else {
          this.mostrarMensaje(response.message, 'error');
        }
        this.cargando = false;
      },
      error: (error: { error: { message: string; }; }) => {
        const errorMessage = error.error?.message || 'Error al actualizar instructor';
        this.mostrarMensaje(errorMessage, 'error');
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  private procesarEspecialidad(instructor: Instructor): void {
    // Si seleccionó "Otra" y escribió una especialidad personalizada
    if (instructor.especialidad === 'Otra' && instructor.especialidadPersonalizada) {
      instructor.especialidad = instructor.especialidadPersonalizada;
    }
    // Limpiar el campo personalizado si no se usa
    if (instructor.especialidad !== 'Otra') {
      instructor.especialidadPersonalizada = '';
    }
  }

  eliminarInstructor(folioInstructor: string): void {
    if (confirm('¿Estás seguro de que deseas desactivar este instructor?')) {
      this.cargando = true;
      this.instructorService.eliminarInstructor(folioInstructor).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.mostrarMensaje(response.message, 'success');
            this.cargarInstructores();
          } else {
            this.mostrarMensaje(response.message, 'error');
          }
          this.cargando = false;
        },
        error: (error: { error: { message: string; }; }) => {
          const errorMessage = error.error?.message || 'Error al desactivar instructor';
          this.mostrarMensaje(errorMessage, 'error');
          this.cargando = false;
          console.error('Error:', error);
        }
      });
    }
  }

  activarInstructor(folioInstructor: string): void {
    this.cargando = true;
    this.instructorService.activarInstructor(folioInstructor).subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.mostrarMensaje(response.message, 'success');
          this.cargarInstructores();
        } else {
          this.mostrarMensaje(response.message, 'error');
        }
        this.cargando = false;
      },
      error: (error: { error: { message: string; }; }) => {
        const errorMessage = error.error?.message || 'Error al activar instructor';
        this.mostrarMensaje(errorMessage, 'error');
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  verEstadisticas(instructor: Instructor): void {
    this.instructorSeleccionado = instructor;
    this.mostrarEstadisticas = true;
    this.mostrarFormulario = false;

    this.instructorService.obtenerEstadisticas(instructor.folioInstructor).subscribe({
      next: (estadisticas: any) => {
        this.estadisticas = estadisticas;
      },
      error: (error: any) => {
        this.mostrarMensaje('Error al cargar estadísticas', 'error');
        console.error('Error:', error);
      }
    });
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.mostrarEstadisticas = false;
    this.instructorSeleccionado = this.inicializarInstructor();
    this.nuevoInstructor = this.inicializarInstructor();
    this.nombreInvalido = false;
    this.emailInvalido = false;
    this.emailExistente = false;
  }

  obtenerClaseEstatus(estatus: string): string {
    switch (estatus) {
      case 'Activo': return 'estatus-activo';
      case 'Inactivo': return 'estatus-inactivo';
      default: return 'estatus-desconocido';
    }
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'No asignada';
    try {
      return new Date(fecha).toLocaleDateString('es-ES');
    } catch (e) {
      return 'Fecha inválida';
    }
  }

  formatearHora(hora: string | null): string {
    if (!hora) return 'No definido';
    return hora.substring(0, 5);
  }
}