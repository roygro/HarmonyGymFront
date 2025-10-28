// instructor.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Instructor {
  folioInstructor: string;
  nombre: string;
  app: string;
  apm: string;
  email: string;
  horaEntrada: string;
  horaSalida: string;
  especialidad: string;
  fechaContratacion: string;
  estatus: string;
  especialidadPersonalizada?: string;
}

export interface InstructorEstadisticas {
  totalActividades: number;
  totalRutinasAsignadas: number;
  totalClientesActividades: number;
  totalClientesRutinas: number;
  promedioCalificacionActividades: number;
  promedioCalificacionRutinas: number;
}

// Interface para la respuesta del API
export interface ApiResponse {
  success: boolean;
  message: string;
  instructor?: Instructor;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private apiUrl = 'http://localhost:8081/api/instructores';

  constructor(private http: HttpClient) { }

  // Obtener todos los instructores
  obtenerInstructores(): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(this.apiUrl);
  }

  // Obtener instructores con filtros
  obtenerInstructoresFiltrados(estatus?: string, especialidad?: string): Observable<Instructor[]> {
    let params = new HttpParams();
    if (estatus) params = params.set('estatus', estatus);
    if (especialidad) params = params.set('especialidad', especialidad);
    
    return this.http.get<Instructor[]>(`${this.apiUrl}/filtros`, { params });
  }

  // Obtener instructor por ID
  obtenerInstructorPorId(folioInstructor: string): Observable<Instructor> {
    return this.http.get<Instructor>(`${this.apiUrl}/${folioInstructor}`);
  }

  // Crear instructor con parámetros individuales (para envío de credenciales)
  crearInstructor(
    nombre: string,
    app: string,
    apm: string,
    email: string,
    horaEntrada: string,
    horaSalida: string,
    especialidad: string,
    fechaContratacion: string,
    estatus: string
  ): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('nombre', nombre)
      .set('app', app || '')
      .set('apm', apm || '')
      .set('email', email || '')
      .set('horaEntrada', horaEntrada || '')
      .set('horaSalida', horaSalida || '')
      .set('especialidad', especialidad || '')
      .set('fechaContratacion', fechaContratacion || '')
      .set('estatus', estatus || 'Activo');

    return this.http.post<ApiResponse>(this.apiUrl, params);
  }

  // Crear instructor con objeto (alternativo)
  crearInstructorConObjeto(instructor: Instructor): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/crear`, instructor);
  }

  // Actualizar instructor con parámetros individuales
  actualizarInstructor(
    folioInstructor: string,
    nombre?: string,
    app?: string,
    apm?: string,
    email?: string,
    horaEntrada?: string,
    horaSalida?: string,
    especialidad?: string,
    fechaContratacion?: string,
    estatus?: string
  ): Observable<ApiResponse> {
    let params = new HttpParams();
    if (nombre) params = params.set('nombre', nombre);
    if (app) params = params.set('app', app);
    if (apm) params = params.set('apm', apm);
    if (email) params = params.set('email', email);
    if (horaEntrada) params = params.set('horaEntrada', horaEntrada);
    if (horaSalida) params = params.set('horaSalida', horaSalida);
    if (especialidad) params = params.set('especialidad', especialidad);
    if (fechaContratacion) params = params.set('fechaContratacion', fechaContratacion);
    if (estatus) params = params.set('estatus', estatus);

    return this.http.put<ApiResponse>(`${this.apiUrl}/${folioInstructor}`, params);
  }

  // Actualizar instructor con objeto (alternativo)
  actualizarInstructorConObjeto(folioInstructor: string, instructor: Instructor): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/actualizar/${folioInstructor}`, instructor);
  }

  // Eliminar instructor (desactivar)
  eliminarInstructor(folioInstructor: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${folioInstructor}`);
  }

  // Cambiar estatus
  cambiarEstatusInstructor(folioInstructor: string, estatus: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${folioInstructor}/estatus`, null, {
      params: { estatus }
    });
  }

  // Activar instructor
  activarInstructor(folioInstructor: string): Observable<ApiResponse> {
    return this.cambiarEstatusInstructor(folioInstructor, 'Activo');
  }

  // Obtener estadísticas
  obtenerEstadisticas(folioInstructor: string): Observable<InstructorEstadisticas> {
    return this.http.get<InstructorEstadisticas>(`${this.apiUrl}/${folioInstructor}/estadisticas`);
  }

  // Obtener instructores activos
  obtenerInstructoresActivos(): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(`${this.apiUrl}/activos`);
  }

  // Buscar por nombre
  buscarInstructoresPorNombre(nombre: string): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(`${this.apiUrl}/buscar`, {
      params: { nombre }
    });
  }

  // Buscar por email
  buscarInstructoresPorEmail(email: string): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(`${this.apiUrl}/buscar-email`, {
      params: { email }
    });
  }

  // Verificar si existe instructor por email
  existeInstructorPorEmail(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/existe-email/${email}`);
  }

  // Contar instructores activos
  contarInstructoresActivos(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/contar-activos`);
  }

  // Obtener instructores por especialidad
  obtenerInstructoresPorEspecialidad(especialidad: string): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(`${this.apiUrl}/especialidad/${especialidad}`);
  }

  // Eliminar instructor completamente
  eliminarInstructorCompleto(folioInstructor: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/eliminar/${folioInstructor}`);
  }
}