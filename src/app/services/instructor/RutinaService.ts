import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Rutina {
  folioRutina: string;
  nombre: string;
  descripcion: string;
  nivel: string;
  objetivo: string;
  duracionEstimada: number;
  estatus: string;
  fechaCreacion: string;
  folioInstructor: string;
  ejercicios?: EjercicioRutina[];
  instructor?: any; // Para cuando se cargue con instructor
}

export interface CrearRutinaRequest {
  nombre: string;
  descripcion?: string;
  nivel?: string;
  objetivo?: string;
  duracionEstimada?: number;
  estatus?: string;
  folioInstructor: string;
  ejercicios?: EjercicioRutina[];
}

export interface ActualizarRutinaRequest {
  nombre: string;
  descripcion?: string;
  nivel?: string;
  objetivo?: string;
  duracionEstimada?: number;
  estatus?: string;
  folioInstructor: string;
  ejercicios?: EjercicioRutina[];
}

export interface EjercicioRutina {
  idEjercicio: string;
  orden: number;
  seriesEjercicio: number;
  repeticionesEjercicio: number;
  descansoEjercicio: number;
  instrucciones?: string;
}

// ===== INTERFACES PARA EJERCICIOS =====
export interface Ejercicio {
  idEjercicio: string;
  nombre: string;
  tiempo: number | null;
  series: number | null;
  repeticiones: number | null;
  descanso: number | null;
  equipoNecesario: string;
  grupoMuscular: string;
  instrucciones: string;
  estatus: string;
  fechaCreacion: string;
}

export interface CrearEjercicioRequest {
  nombre: string;
  tiempo: number | null;
  series: number | null;
  repeticiones: number | null;
  descanso: number | null;
  equipoNecesario: string;
  grupoMuscular: string;
  instrucciones: string;
}

export interface ActualizarEjercicioRequest {
  nombre: string;
  tiempo: number | null;
  series: number | null;
  repeticiones: number | null;
  descanso: number | null;
  equipoNecesario: string;
  grupoMuscular: string;
  instrucciones: string;
  estatus: string;
}

export interface EjercicioSimple {
  idEjercicio: string;
  nombre: string;
  tiempo: number | null;
  series: number | null;
  repeticiones: number | null;
  descanso: number | null;
  equipoNecesario: string;
  grupoMuscular: string;
  instrucciones: string;
}

export interface Cliente {
  folioCliente: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  genero: string;
  fechaRegistro: string;
  estatus: string;
  edad?: number;
}

export interface EstadisticasEjercicios {
  total: number;
  activos: number;
  inactivos: number;
}

// ===== INTERFACES PARA ASIGNACIÓN MÚLTIPLE =====
export interface AsignacionMultiplesClientesRequest {
  foliosClientes: string[];
  folioInstructor: string;
}

export interface ResultadoAsignacionMultiple {
  asignacionesExitosas: string[];
  errores: string[];
  totalExitosas: number;
  totalErrores: number;
}

export interface AsignacionResponse {
  success: boolean;
  message: string;
  resultado?: ResultadoAsignacionMultiple;
}

@Injectable({
  providedIn: 'root'
})
export class RutinaService {
  private apiUrl = 'http://localhost:8081/api';
  private rutinasUrl = `${this.apiUrl}/rutinas`;
  private ejerciciosUrl = `${this.apiUrl}/ejercicios`;

  constructor(private http: HttpClient) { }

  obtenerTodosLosClientes(): Observable<Cliente[]> {
  return this.http.get<Cliente[]>(`${this.apiUrl}/clientes`)
    .pipe(catchError(this.manejarError));
}

obtenerClientesActivos(): Observable<Cliente[]> {
  return this.http.get<Cliente[]>(`${this.apiUrl}/clientes/activos`)
    .pipe(catchError(this.manejarError));
}



// Obtener clientes no asignados a una rutina específica
obtenerClientesNoAsignadosARutina(folioRutina: string): Observable<Cliente[]> {
  return this.http.get<Cliente[]>(`${this.apiUrl}/clientes/no-asignados/${folioRutina}`)
    .pipe(catchError(this.manejarError));
}
  // ===== MÉTODOS BÁSICOS DE RUTINAS =====

  obtenerTodasLasRutinas(): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(this.rutinasUrl)
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinaPorId(folioRutina: string): Observable<Rutina> {
    return this.http.get<Rutina>(`${this.rutinasUrl}/instructor/${folioRutina}`)
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinaConInstructor(folioRutina: string): Observable<Rutina> {
    return this.http.get<Rutina>(`${this.rutinasUrl}/${folioRutina}/with-instructor`)
      .pipe(catchError(this.manejarError));
  }

  crearRutina(rutina: CrearRutinaRequest): Observable<Rutina> {
    return this.http.post<Rutina>(this.rutinasUrl, rutina)
      .pipe(catchError(this.manejarError));
  }

  actualizarRutina(folioRutina: string, rutina: ActualizarRutinaRequest): Observable<Rutina> {
    return this.http.put<Rutina>(`${this.rutinasUrl}/${folioRutina}`, rutina)
      .pipe(catchError(this.manejarError));
  }

  eliminarRutina(folioRutina: string): Observable<any> {
    return this.http.delete(`${this.rutinasUrl}/${folioRutina}`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS PARA INSTRUCTORES =====

  obtenerRutinasPorInstructor(folioInstructor: string): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.rutinasUrl}/instructor/${folioInstructor}`)
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinasPorInstructorConInstructor(folioInstructor: string): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.rutinasUrl}/instructor/${folioInstructor}/with-instructor`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE ESTATUS DE RUTINAS =====

  cambiarEstatusRutina(folioRutina: string, nuevoEstatus: string): Observable<any> {
    return this.http.patch(`${this.rutinasUrl}/${folioRutina}/estatus`, { estatus: nuevoEstatus })
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE BÚSQUEDA Y FILTRADO DE RUTINAS =====

  buscarRutinasPorNombre(nombre: string): Observable<Rutina[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Rutina[]>(`${this.rutinasUrl}/buscar/nombre`, { params })
      .pipe(catchError(this.manejarError));
  }

  buscarRutinasPorNivel(nivel: string): Observable<Rutina[]> {
    const params = new HttpParams().set('nivel', nivel);
    return this.http.get<Rutina[]>(`${this.rutinasUrl}/buscar/nivel`, { params })
      .pipe(catchError(this.manejarError));
  }

  buscarRutinasPorObjetivo(objetivo: string): Observable<Rutina[]> {
    const params = new HttpParams().set('objetivo', objetivo);
    return this.http.get<Rutina[]>(`${this.rutinasUrl}/buscar/objetivo`, { params })
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinasPorEstatus(estatus: string): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.rutinasUrl}/estatus/${estatus}`)
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinasActivas(): Observable<Rutina[]> {
    return this.obtenerRutinasPorEstatus('Activa');
  }

  // ===== MÉTODOS DE ASIGNACIÓN A CLIENTES (ACTUALIZADOS) =====

  asignarRutinaACliente(folioRutina: string, folioCliente: string, folioInstructor: string): Observable<AsignacionResponse> {
    const params = new HttpParams().set('folioInstructor', folioInstructor);
    return this.http.post<AsignacionResponse>(
      `${this.rutinasUrl}/${folioRutina}/asignar-cliente/${folioCliente}`, 
      {},
      { params }
    ).pipe(catchError(this.manejarError));
  }

  asignarRutinaAMultiplesClientes(folioRutina: string, request: AsignacionMultiplesClientesRequest): Observable<AsignacionResponse> {
    return this.http.post<AsignacionResponse>(
      `${this.rutinasUrl}/${folioRutina}/asignar-multiples-clientes`,
      request
    ).pipe(catchError(this.manejarError));
  }

  desasignarRutinaDeCliente(folioRutina: string, folioCliente: string): Observable<AsignacionResponse> {
    return this.http.delete<AsignacionResponse>(
      `${this.rutinasUrl}/${folioRutina}/desasignar-cliente/${folioCliente}`
    ).pipe(catchError(this.manejarError));
  }

  desasignarRutinaDeMultiplesClientes(folioRutina: string, foliosClientes: string[]): Observable<AsignacionResponse> {
    return this.http.post<AsignacionResponse>(
      `${this.rutinasUrl}/${folioRutina}/desasignar-multiples-clientes`,
      foliosClientes
    ).pipe(catchError(this.manejarError));
  }

  obtenerClientesAsignadosARutina(folioRutina: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.rutinasUrl}/${folioRutina}/clientes-asignados`)
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinasAsignadasACliente(folioCliente: string): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.rutinasUrl}/cliente/${folioCliente}`)
      .pipe(catchError(this.manejarError));
  }

  verificarAsignacionRutina(folioRutina: string, folioCliente: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.rutinasUrl}/${folioRutina}/asignada-a-cliente/${folioCliente}`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE EJERCICIOS EN RUTINAS (ACTUALIZADOS) =====

  obtenerEjerciciosDeRutina(folioRutina: string): Observable<EjercicioRutina[]> {
    return this.http.get<EjercicioRutina[]>(`${this.rutinasUrl}/${folioRutina}/ejercicios`)
      .pipe(catchError(this.manejarError));
  }

  agregarEjercicioARutina(folioRutina: string, ejercicio: EjercicioRutina): Observable<Rutina> {
    return this.http.post<Rutina>(
      `${this.rutinasUrl}/${folioRutina}/ejercicios`,
      ejercicio
    ).pipe(catchError(this.manejarError));
  }

  eliminarEjercicioDeRutina(folioRutina: string, idEjercicio: string): Observable<Rutina> {
    return this.http.delete<Rutina>(
      `${this.rutinasUrl}/${folioRutina}/ejercicios/${idEjercicio}`
    ).pipe(catchError(this.manejarError));
  }

  actualizarOrdenEjercicios(folioRutina: string, ejercicios: EjercicioRutina[]): Observable<any> {
    return this.http.put(
      `${this.rutinasUrl}/${folioRutina}/ejercicios/orden`,
      ejercicios
    ).pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE EJERCICIOS INDEPENDIENTES =====

  obtenerTodosLosEjercicios(): Observable<Ejercicio[]> {
    return this.http.get<Ejercicio[]>(this.ejerciciosUrl)
      .pipe(catchError(this.manejarError));
  }

  obtenerEjerciciosActivos(): Observable<Ejercicio[]> {
    return this.http.get<Ejercicio[]>(`${this.ejerciciosUrl}/activos`)
      .pipe(catchError(this.manejarError));
  }

  obtenerEjercicioPorId(idEjercicio: string): Observable<Ejercicio> {
    return this.http.get<Ejercicio>(`${this.ejerciciosUrl}/${idEjercicio}`)
      .pipe(catchError(this.manejarError));
  }

  crearEjercicio(ejercicio: CrearEjercicioRequest): Observable<Ejercicio> {
    return this.http.post<Ejercicio>(this.ejerciciosUrl, ejercicio)
      .pipe(catchError(this.manejarError));
  }

  actualizarEjercicio(idEjercicio: string, ejercicio: ActualizarEjercicioRequest): Observable<Ejercicio> {
    return this.http.put<Ejercicio>(`${this.ejerciciosUrl}/${idEjercicio}`, ejercicio)
      .pipe(catchError(this.manejarError));
  }

  eliminarEjercicio(idEjercicio: string): Observable<any> {
    return this.http.delete(`${this.ejerciciosUrl}/${idEjercicio}`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE ESTATUS DE EJERCICIOS =====

  cambiarEstatusEjercicio(idEjercicio: string, nuevoEstatus: string): Observable<any> {
    return this.http.patch(`${this.ejerciciosUrl}/${idEjercicio}/estatus`, { estatus: nuevoEstatus })
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE BÚSQUEDA DE EJERCICIOS =====

  buscarEjerciciosPorNombre(nombre: string): Observable<Ejercicio[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Ejercicio[]>(`${this.ejerciciosUrl}/buscar/nombre`, { params })
      .pipe(catchError(this.manejarError));
  }

  buscarEjerciciosPorGrupoMuscular(grupoMuscular: string): Observable<Ejercicio[]> {
    const params = new HttpParams().set('grupoMuscular', grupoMuscular);
    return this.http.get<Ejercicio[]>(`${this.ejerciciosUrl}/buscar/grupo-muscular`, { params })
      .pipe(catchError(this.manejarError));
  }

  buscarEjerciciosPorEquipo(equipo: string): Observable<Ejercicio[]> {
    const params = new HttpParams().set('equipo', equipo);
    return this.http.get<Ejercicio[]>(`${this.ejerciciosUrl}/buscar/equipo`, { params })
      .pipe(catchError(this.manejarError));
  }

  buscarEjercicios(nombre?: string, grupoMuscular?: string, equipo?: string): Observable<Ejercicio[]> {
    let params = new HttpParams();
    if (nombre) params = params.set('nombre', nombre);
    if (grupoMuscular) params = params.set('grupoMuscular', grupoMuscular);
    if (equipo) params = params.set('equipo', equipo);
    
    return this.http.get<Ejercicio[]>(`${this.ejerciciosUrl}/buscar`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE VERIFICACIÓN =====

  verificarRutinaExiste(folioRutina: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.rutinasUrl}/existe/${folioRutina}`)
      .pipe(catchError(this.manejarError));
  }

  verificarEjercicioExiste(idEjercicio: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.ejerciciosUrl}/existe/${idEjercicio}`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE ESTADÍSTICAS =====

  obtenerTotalRutinasActivas(): Observable<number> {
    return this.http.get<number>(`${this.rutinasUrl}/estadisticas/total-activas`)
      .pipe(catchError(this.manejarError));
  }

  contarRutinasPorInstructor(folioInstructor: string): Observable<number> {
    return this.http.get<number>(`${this.rutinasUrl}/estadisticas/instructor/${folioInstructor}/total`)
      .pipe(catchError(this.manejarError));
  }

  calcularTiempoTotalRutina(folioRutina: string): Observable<number> {
    return this.http.get<number>(`${this.rutinasUrl}/${folioRutina}/tiempo-total`)
      .pipe(catchError(this.manejarError));
  }

  contarTotalEjercicios(): Observable<number> {
    return this.http.get<number>(`${this.ejerciciosUrl}/estadisticas/total`)
      .pipe(catchError(this.manejarError));
  }

  contarEjerciciosActivos(): Observable<number> {
    return this.http.get<number>(`${this.ejerciciosUrl}/estadisticas/activos`)
      .pipe(catchError(this.manejarError));
  }

  obtenerResumenEstadisticasEjercicios(): Observable<EstadisticasEjercicios> {
    return this.http.get<EstadisticasEjercicios>(`${this.ejerciciosUrl}/estadisticas/resumen`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Generar un folio de rutina automático (para uso en frontend antes de crear)
   */
  generarFolioRutinaSugerido(): Observable<string> {
    return new Observable(observer => {
      this.obtenerTodasLasRutinas().subscribe({
        next: (rutinas) => {
          const numeros = rutinas
            .map(r => r.folioRutina)
            .filter(folio => folio.startsWith('RUT'))
            .map(folio => {
              const numero = folio.replace('RUT', '');
              return parseInt(numero, 10);
            })
            .filter(num => !isNaN(num));
          
          const siguienteNumero = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;
          const folioSugerido = `RUT${siguienteNumero.toString().padStart(3, '0')}`;
          observer.next(folioSugerido);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Calcular duración estimada basada en ejercicios
   */
  calcularDuracionEstimada(ejercicios: EjercicioRutina[]): number {
  if (!ejercicios || ejercicios.length === 0) {
    return 0;
  }

  let duracionTotal = 0; // en minutos
  
  ejercicios.forEach(ejercicio => {
    // Estimación: 0.75 minutos por serie + tiempo de descanso en minutos
    const tiempoPorSerie = 0.75; // 45 segundos = 0.75 minutos
    const series = ejercicio.seriesEjercicio || 3;
    const descansoPorSerie = (ejercicio.descansoEjercicio || 60) / 60; // convertir segundos a minutos
    
    duracionTotal += (tiempoPorSerie * series) + (descansoPorSerie * (series - 1));
  });

  // Ya está en minutos, redondear hacia arriba
  return Math.ceil(duracionTotal);
}
// Método para formatear tiempo en formato legible
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
  /**
   * Validar datos de rutina antes de enviar al backend
   */
  validarRutina(rutina: CrearRutinaRequest | ActualizarRutinaRequest): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!rutina.nombre || rutina.nombre.trim().length === 0) {
      errores.push('El nombre de la rutina es requerido');
    }

    if (!rutina.folioInstructor || rutina.folioInstructor.trim().length === 0) {
      errores.push('El instructor es requerido');
    }

    if (rutina.nombre && rutina.nombre.length > 100) {
      errores.push('El nombre de la rutina no puede exceder 100 caracteres');
    }

    if (rutina.descripcion && rutina.descripcion.length > 500) {
      errores.push('La descripción no puede exceder 500 caracteres');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Validar datos de ejercicio de rutina
   */
  validarEjercicioRutina(ejercicio: EjercicioRutina): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!ejercicio.idEjercicio || ejercicio.idEjercicio.trim().length === 0) {
      errores.push('El ID del ejercicio es requerido');
    }

    if (!ejercicio.orden || ejercicio.orden < 1) {
      errores.push('El orden del ejercicio debe ser mayor a 0');
    }

    if (!ejercicio.seriesEjercicio || ejercicio.seriesEjercicio < 1) {
      errores.push('El número de series debe ser mayor a 0');
    }

    if (!ejercicio.repeticionesEjercicio || ejercicio.repeticionesEjercicio < 1) {
      errores.push('El número de repeticiones debe ser mayor a 0');
    }

    if (ejercicio.descansoEjercicio && ejercicio.descansoEjercicio < 0) {
      errores.push('El tiempo de descanso no puede ser negativo');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  // ===== MANEJO DE ERRORES MEJORADO =====

  private manejarError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en RutinaService:', error);
    
    let mensajeError = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      mensajeError = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (typeof error.error === 'string') {
        mensajeError = error.error;
      } else if (error.error?.mensaje) {
        mensajeError = error.error.mensaje;
      } else if (error.error?.message) {
        mensajeError = error.error.message;
      } else if (error.error?.error) {
        mensajeError = error.error.error;
      } else if (error.status === 404) {
        mensajeError = 'Recurso no encontrado';
      } else if (error.status === 400) {
        mensajeError = 'Solicitud incorrecta';
      } else if (error.status === 409) {
        mensajeError = 'Conflicto: El recurso ya existe';
      } else if (error.status === 500) {
        mensajeError = 'Error interno del servidor';
      } else {
        mensajeError = `${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(mensajeError));
  }

  
// Método específico para inactivar
inactivarRutina(folioRutina: string): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${folioRutina}/inactivar`, {});
}

// Método específico para activar
activarRutina(folioRutina: string): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${folioRutina}/activar`, {});
}

// Método para obtener rutinas por estatus
getRutinasPorEstatus(estatus: string): Observable<Rutina[]> {
  return this.http.get<Rutina[]>(`${this.apiUrl}/estatus/${estatus}`);
}
}