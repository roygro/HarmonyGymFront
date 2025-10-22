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
}

export interface EjercicioRutina {
  idEjercicio: string;
  nombre: string;
  tiempo: number;
  series: number;
  repeticiones: number;
  descanso: number;
  equipoNecesario: string;
  grupoMuscular: string;
  instrucciones: string;
  orden: number;
  seriesEjercicio: number;
  repeticionesEjercicio: number;
  descansoEjercicio: number;
  observaciones: string;
}

export interface EjercicioSimple {
  idEjercicio: string;
  nombre: string;
  tiempo: number;
  series: number;
  repeticiones: number;
  descanso: number;
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
}

@Injectable({
  providedIn: 'root'
})
export class RutinaService {
  private apiUrl = 'http://localhost:8081/api/rutinas';

  constructor(private http: HttpClient) { }

  // ===== MÉTODOS BÁSICOS DE RUTINAS =====

  obtenerTodasLasRutinas(): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(this.apiUrl)
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinaPorId(folioRutina: string): Observable<Rutina> {
    return this.http.get<Rutina>(`${this.apiUrl}/${folioRutina}`)
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinaConEjercicios(folioRutina: string): Observable<Rutina> {
    return this.http.get<Rutina>(`${this.apiUrl}/${folioRutina}/completa`)
      .pipe(catchError(this.manejarError));
  }

  crearRutina(rutina: Rutina): Observable<Rutina> {
    return this.http.post<Rutina>(this.apiUrl, rutina)
      .pipe(catchError(this.manejarError));
  }

  actualizarRutina(folioRutina: string, rutina: Rutina): Observable<Rutina> {
    return this.http.put<Rutina>(`${this.apiUrl}/${folioRutina}`, rutina)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE ESTATUS (CORREGIDOS) =====

  activarRutina(folioRutina: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${folioRutina}/activar`, {})
      .pipe(catchError(this.manejarError));
  }

  desactivarRutina(folioRutina: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${folioRutina}/desactivar`, {})
      .pipe(catchError(this.manejarError));
  }

  cambiarEstatusRutina(folioRutina: string, nuevoEstatus: string): Observable<any> {
    // Usar endpoints específicos para mayor confiabilidad
    if (nuevoEstatus === 'Activa') {
      return this.activarRutina(folioRutina);
    } else if (nuevoEstatus === 'Inactiva') {
      return this.desactivarRutina(folioRutina);
    } else {
      // Fallback al endpoint genérico
      return this.http.patch(`${this.apiUrl}/${folioRutina}/estatus`, { estatus: nuevoEstatus })
        .pipe(catchError(this.manejarError));
    }
  }

  verificarRutinaActiva(folioRutina: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${folioRutina}/activa`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE BÚSQUEDA Y FILTRADO =====

  buscarRutinasPorNombre(nombre: string): Observable<Rutina[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Rutina[]>(`${this.apiUrl}/buscar/nombre`, { params })
      .pipe(catchError(this.manejarError));
  }

  buscarRutinasPorNivel(nivel: string): Observable<Rutina[]> {
    const params = new HttpParams().set('nivel', nivel);
    return this.http.get<Rutina[]>(`${this.apiUrl}/buscar/nivel`, { params })
      .pipe(catchError(this.manejarError));
  }

  buscarRutinasPorObjetivo(objetivo: string): Observable<Rutina[]> {
    const params = new HttpParams().set('objetivo', objetivo);
    return this.http.get<Rutina[]>(`${this.apiUrl}/buscar/objetivo`, { params })
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinasActivas(): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.apiUrl}/activas`)
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinasDisponibles(): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.apiUrl}/disponibles`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE ASIGNACIÓN A CLIENTES =====

  asignarRutinaACliente(folioRutina: string, folioCliente: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${folioRutina}/asignar-cliente/${folioCliente}`, {})
      .pipe(catchError(this.manejarError));
  }

  asignarRutinaAMultiplesClientes(folioRutina: string, foliosClientes: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${folioRutina}/asignar-multiples-clientes`, foliosClientes)
      .pipe(catchError(this.manejarError));
  }

  removerAsignacionRutina(folioRutina: string, folioCliente: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${folioRutina}/desasignar-cliente/${folioCliente}`)
      .pipe(catchError(this.manejarError));
  }

  obtenerClientesDeRutina(folioRutina: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/${folioRutina}/clientes`)
      .pipe(catchError(this.manejarError));
  }

  obtenerClientesActivosDeRutina(folioRutina: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/${folioRutina}/clientes/activos`)
      .pipe(catchError(this.manejarError));
  }

  verificarAsignacionRutina(folioRutina: string, folioCliente: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${folioRutina}/asignada-a-cliente/${folioCliente}`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE EJERCICIOS EN RUTINAS =====

  obtenerEjerciciosDeRutina(folioRutina: string): Observable<EjercicioRutina[]> {
    return this.http.get<EjercicioRutina[]>(`${this.apiUrl}/${folioRutina}/ejercicios`)
      .pipe(catchError(this.manejarError));
  }

  agregarEjercicioARutina(folioRutina: string, ejercicio: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${folioRutina}/ejercicios`, ejercicio)
      .pipe(catchError(this.manejarError));
  }

  removerEjercicioDeRutina(folioRutina: string, idEjercicio: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${folioRutina}/ejercicios/${idEjercicio}`)
      .pipe(catchError(this.manejarError));
  }

  actualizarOrdenEjercicios(folioRutina: string, idsEjercicios: string[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/${folioRutina}/ejercicios/orden`, idsEjercicios)
      .pipe(catchError(this.manejarError));
  }

  actualizarParametrosEjercicio(folioRutina: string, idEjercicio: string, parametros: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${folioRutina}/ejercicios/${idEjercicio}`, parametros)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE EJERCICIOS INDEPENDIENTES =====

  obtenerTodosLosEjercicios(): Observable<EjercicioSimple[]> {
    return this.http.get<EjercicioSimple[]>(`${this.apiUrl}/ejercicios`)
      .pipe(catchError(this.manejarError));
  }

  obtenerEjercicioPorId(idEjercicio: string): Observable<EjercicioSimple> {
    return this.http.get<EjercicioSimple>(`${this.apiUrl}/ejercicios/${idEjercicio}`)
      .pipe(catchError(this.manejarError));
  }

  buscarEjerciciosPorNombre(nombre: string): Observable<EjercicioSimple[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<EjercicioSimple[]>(`${this.apiUrl}/ejercicios/buscar/nombre`, { params })
      .pipe(catchError(this.manejarError));
  }

  buscarEjerciciosPorGrupoMuscular(grupoMuscular: string): Observable<EjercicioSimple[]> {
    const params = new HttpParams().set('grupoMuscular', grupoMuscular);
    return this.http.get<EjercicioSimple[]>(`${this.apiUrl}/ejercicios/buscar/grupo-muscular`, { params })
      .pipe(catchError(this.manejarError));
  }

  verificarEjercicioExiste(idEjercicio: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/ejercicios/existe/${idEjercicio}`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE CLIENTES =====

  obtenerRutinasPorCliente(folioCliente: string): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.apiUrl}/cliente/${folioCliente}`)
      .pipe(catchError(this.manejarError));
  }

  obtenerRutinasActivasPorCliente(folioCliente: string): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.apiUrl}/cliente/${folioCliente}/activas`)
      .pipe(catchError(this.manejarError));
  }

  verificarClienteTieneRutinasActivas(folioCliente: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/cliente/${folioCliente}/tiene-activas`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE ESTADÍSTICAS =====

  obtenerTotalRutinasActivas(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estadisticas/total-activas`)
      .pipe(catchError(this.manejarError));
  }

  contarRutinasPorInstructor(folioInstructor: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estadisticas/instructor/${folioInstructor}/total`)
      .pipe(catchError(this.manejarError));
  }

  contarRutinasActivasPorCliente(folioCliente: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/estadisticas/cliente/${folioCliente}/activas`)
      .pipe(catchError(this.manejarError));
  }

  calcularTiempoTotalRutina(folioRutina: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${folioRutina}/tiempo-total`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MÉTODOS DE VERIFICACIÓN =====

  verificarRutinaExiste(folioRutina: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/existe/${folioRutina}`)
      .pipe(catchError(this.manejarError));
  }

  // ===== MANEJO DE ERRORES MEJORADO =====

  private manejarError(error: HttpErrorResponse): Observable<never> {
    console.error('Error completo en RutinaService:', error);
    
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
      } else if (error.status === 500) {
        mensajeError = 'Error interno del servidor';
      } else {
        mensajeError = `${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(mensajeError));
  }
}