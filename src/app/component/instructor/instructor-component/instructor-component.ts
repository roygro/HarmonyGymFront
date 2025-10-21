import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Instructor, InstructorEstadisticas, InstructorService } from '../../../services/instructor/instructorService';

@Component({
  selector: 'app-instructor-component',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
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
  
  folioGenerado: string = 'INS001';
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  mostrarEstadisticas: boolean = false;
  cargando: boolean = false;
  nombreInvalido: boolean = false;
  
  filtroEstatus: string = '';
  filtroEspecialidad: string = '';
  terminoBusqueda: string = '';
  
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

  // NUEVAS PROPIEDADES PARA FOTOS
  fotoPrevia: string | ArrayBuffer | null = null;
  archivoFoto: File | null = null;
  eliminandoFoto: boolean = false;
  cargandoFoto: boolean = false;

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
  }

  private inicializarInstructor(): Instructor {
    const today = new Date().toISOString().split('T')[0];
    return {
      folioInstructor: '',
      nombre: '',
      app: '',
      apm: '',
      horaEntrada: '',
      horaSalida: '',
      especialidad: '',
      fechaContratacion: today,
      estatus: 'Activo',
      especialidadPersonalizada: '',
      nombreArchivoFoto: ''
    };
  }

  cargarInstructores(): void {
    this.cargando = true;
    
    this.instructorService.obtenerInstructores().subscribe({
      next: (data) => {
        console.log('✅ Instructores cargados:', data);
        this.instructores = data;
        this.instructoresFiltrados = data;
        this.cargando = false;
       
        // Generar próximo folio basado en los datos existentes
        this.generarProximoFolio();
      },
      error: (error) => {
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

  aplicarFiltros(): void {
    this.cargando = true;
    this.instructorService.obtenerInstructoresFiltrados(
      this.filtroEstatus || undefined,
      this.filtroEspecialidad || undefined
    ).subscribe({
      next: (data) => {
        this.instructoresFiltrados = data;
        this.cargando = false;
      },
      error: (error) => {
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
      next: (data) => {
        this.instructoresFiltrados = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar:', error);
        this.mostrarMensaje('Error al buscar instructores', 'error');
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroEstatus = '';
    this.filtroEspecialidad = '';
    this.terminoBusqueda = '';
    this.instructoresFiltrados = this.instructores;
  }

  prepararNuevoInstructor(): void {
    this.nuevoInstructor = this.inicializarInstructor();
    this.mostrarFormulario = true;
    this.modoEdicion = false;
    this.mostrarEstadisticas = false;
    this.nombreInvalido = false;
    
    // Limpiar foto
    this.fotoPrevia = null;
    this.archivoFoto = null;
    this.eliminandoFoto = false;
    
    // Generar folio automáticamente
    this.generarProximoFolio();
  }

  validarNombre(): void {
    this.nombreInvalido = !this.nuevoInstructor.nombre.trim();
  }

  // NUEVO MÉTODO: Manejar selección de archivo
  onFileSelected(event: any, esEdicion: boolean = false): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.mostrarMensaje('Por favor selecciona un archivo de imagen válido', 'error');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarMensaje('La imagen no debe superar los 5MB', 'error');
        return;
      }

      this.archivoFoto = file;
      this.eliminandoFoto = false;

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPrevia = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // NUEVO MÉTODO: Eliminar foto seleccionada
  eliminarFotoSeleccionada(esEdicion: boolean = false): void {
    this.fotoPrevia = null;
    this.archivoFoto = null;
    
    if (esEdicion && this.instructorSeleccionado.nombreArchivoFoto) {
      this.eliminandoFoto = true;
    }
  }

  // NUEVO MÉTODO: Cargar foto existente
  cargarFotoExistente(folioInstructor: string): void {
    this.cargandoFoto = true;
    this.instructorService.obtenerFotoInstructor(folioInstructor).subscribe({
      next: (blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.fotoPrevia = reader.result;
          this.cargandoFoto = false;
        };
        reader.readAsDataURL(blob);
      },
      error: (error) => {
        console.error('Error al cargar foto:', error);
        this.cargandoFoto = false;
        // No mostrar error si no hay foto
      }
    });
  }

  crearInstructor(): void {
    if (!this.nuevoInstructor.nombre.trim()) {
      this.nombreInvalido = true;
      this.mostrarMensaje('El nombre es requerido', 'error');
      return;
    }

    // Procesar especialidad si seleccionó "Otra"
    this.procesarEspecialidad(this.nuevoInstructor);

    // Asignar el folio generado automáticamente
    this.nuevoInstructor.folioInstructor = this.folioGenerado;

    this.cargando = true;
    
    // Preparar datos para enviar
    const instructorData = {
      nombre: this.nuevoInstructor.nombre,
      app: this.nuevoInstructor.app || '',
      apm: this.nuevoInstructor.apm || '',
      horaEntrada: this.nuevoInstructor.horaEntrada || '',
      horaSalida: this.nuevoInstructor.horaSalida || '',
      especialidad: this.nuevoInstructor.especialidad || '',
      fechaContratacion: this.nuevoInstructor.fechaContratacion,
      estatus: this.nuevoInstructor.estatus
    };

    // Usar el método con foto si hay archivo seleccionado
    if (this.archivoFoto) {
      this.instructorService.crearInstructorConFoto(instructorData, this.archivoFoto).subscribe({
        next: (instructor) => {
          this.mostrarMensaje(`Instructor ${instructor.folioInstructor} creado exitosamente`, 'success');
          this.cargarInstructores();
          this.cerrarFormulario();
          this.cargando = false;
        },
        error: (error) => {
          const errorMessage = error.error?.error || 'Error al crear instructor';
          this.mostrarMensaje(errorMessage, 'error');
          this.cargando = false;
          console.error('Error:', error);
        }
      });
    } else {
      // Usar método original si no hay foto
      this.instructorService.crearInstructor(this.nuevoInstructor).subscribe({
        next: (instructor) => {
          this.mostrarMensaje(`Instructor ${instructor.folioInstructor} creado exitosamente`, 'success');
          this.cargarInstructores();
          this.cerrarFormulario();
          this.cargando = false;
        },
        error: (error) => {
          const errorMessage = error.error?.error || 'Error al crear instructor';
          this.mostrarMensaje(errorMessage, 'error');
          this.cargando = false;
          console.error('Error:', error);
        }
      });
    }
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
    
    // Cargar foto si existe
    this.fotoPrevia = null;
    this.archivoFoto = null;
    this.eliminandoFoto = false;
    
    if (instructor.nombreArchivoFoto) {
      this.cargarFotoExistente(instructor.folioInstructor);
    }
    
    this.mostrarFormulario = true;
    this.modoEdicion = true;
    this.mostrarEstadisticas = false;
  }

  actualizarInstructor(): void {
    if (!this.instructorSeleccionado.nombre.trim()) {
      this.mostrarMensaje('El nombre es requerido', 'error');
      return;
    }

    // Procesar especialidad si seleccionó "Otra"
    this.procesarEspecialidad(this.instructorSeleccionado);

    this.cargando = true;

    // Preparar datos para enviar
    const instructorData = {
      nombre: this.instructorSeleccionado.nombre,
      app: this.instructorSeleccionado.app || '',
      apm: this.instructorSeleccionado.apm || '',
      horaEntrada: this.instructorSeleccionado.horaEntrada || '',
      horaSalida: this.instructorSeleccionado.horaSalida || '',
      especialidad: this.instructorSeleccionado.especialidad || '',
      fechaContratacion: this.instructorSeleccionado.fechaContratacion,
      estatus: this.instructorSeleccionado.estatus
    };

    // Usar el método con foto si hay cambios en la foto
    if (this.archivoFoto || this.eliminandoFoto) {
      this.instructorService.actualizarInstructorConFoto(
        this.instructorSeleccionado.folioInstructor,
        instructorData,
        this.archivoFoto || undefined,
        this.eliminandoFoto
      ).subscribe({
        next: (instructor) => {
          this.mostrarMensaje(`Instructor ${instructor.folioInstructor} actualizado exitosamente`, 'success');
          this.cargarInstructores();
          this.cerrarFormulario();
          this.cargando = false;
        },
        error: (error) => {
          const errorMessage = error.error?.error || 'Error al actualizar instructor';
          this.mostrarMensaje(errorMessage, 'error');
          this.cargando = false;
          console.error('Error:', error);
        }
      });
    } else {
      // Usar método original si no hay cambios en la foto
      this.instructorService.actualizarInstructor(
        this.instructorSeleccionado.folioInstructor,
        this.instructorSeleccionado
      ).subscribe({
        next: (instructor) => {
          this.mostrarMensaje(`Instructor ${instructor.folioInstructor} actualizado exitosamente`, 'success');
          this.cargarInstructores();
          this.cerrarFormulario();
          this.cargando = false;
        },
        error: (error) => {
          const errorMessage = error.error?.error || 'Error al actualizar instructor';
          this.mostrarMensaje(errorMessage, 'error');
          this.cargando = false;
          console.error('Error:', error);
        }
      });
    }
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
        next: () => {
          this.mostrarMensaje('Instructor desactivado exitosamente', 'success');
          this.cargarInstructores();
          this.cargando = false;
        },
        error: (error) => {
          const errorMessage = error.error?.error || 'Error al desactivar instructor';
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
      next: () => {
        this.mostrarMensaje('Instructor activado exitosamente', 'success');
        this.cargarInstructores();
        this.cargando = false;
      },
      error: (error) => {
        const errorMessage = error.error?.error || 'Error al activar instructor';
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
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
      },
      error: (error) => {
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
    
    // Limpiar foto
    this.fotoPrevia = null;
    this.archivoFoto = null;
    this.eliminandoFoto = false;
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
  handleImageError(event: any): void {
    const img = event.target;
    img.style.display = 'none';
    
    // Buscar el contenedor padre y mostrar el placeholder
    const container = img.closest('.instructor-avatar');
    if (container) {
      container.innerHTML = '<i class="fas fa-user-tie"></i>';
      container.classList.add('no-photo');
    }
  }

  formatearHora(hora: string | null): string {
    if (!hora) return 'No definido';
    return hora.substring(0, 5);
  }
}