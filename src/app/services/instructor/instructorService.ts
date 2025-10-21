import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Instructor {
  folioInstructor: string;
  nombre: string;
  app: string;
  apm: string;
  horaEntrada: string;
  horaSalida: string;
  especialidad: string;
  fechaContratacion: string;
  estatus: string;
  especialidadPersonalizada?: string;
  nombreArchivoFoto?: string;
  fotoFile?: File;
}

export interface InstructorEstadisticas {
  totalActividades: number;
  totalRutinasAsignadas: number;
  totalClientesActividades: number;
  totalClientesRutinas: number;
  promedioCalificacionActividades: number;
  promedioCalificacionRutinas: number;
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

  // CREAR instructor con foto (usa el endpoint principal)
  crearInstructorConFoto(instructorData: any, fotoFile?: File): Observable<any> {
    const formData = new FormData();
    
    // Agregar todos los campos del instructor
    Object.keys(instructorData).forEach(key => {
      if (instructorData[key] !== null && instructorData[key] !== undefined) {
        formData.append(key, instructorData[key]);
      }
    });
    
    // Agregar archivo de foto si existe
    if (fotoFile) {
      formData.append('foto', fotoFile);
    }
    
    return this.http.post<any>(this.apiUrl, formData);
  }

  // ACTUALIZAR instructor con foto (usa el endpoint principal)
  actualizarInstructorConFoto(folioInstructor: string, instructorData: any, fotoFile?: File, eliminarFoto: boolean = false): Observable<any> {
    const formData = new FormData();
    
    // Agregar todos los campos del instructor
    Object.keys(instructorData).forEach(key => {
      if (instructorData[key] !== null && instructorData[key] !== undefined) {
        formData.append(key, instructorData[key]);
      }
    });
    
    // Agregar archivo de foto si existe
    if (fotoFile) {
      formData.append('foto', fotoFile);
    }
    
    // Indicar si se debe eliminar la foto
    formData.append('eliminarFoto', eliminarFoto.toString());
    
    return this.http.put<any>(`${this.apiUrl}/${folioInstructor}`, formData);
  }

  // Método original para crear instructor (sin foto)
  crearInstructor(instructor: Instructor): Observable<Instructor> {
    // Para mantener compatibilidad, pero recomiendo usar crearInstructorConFoto
    const formData = new FormData();
    Object.keys(instructor).forEach(key => {
      if (instructor[key as keyof Instructor] !== null && instructor[key as keyof Instructor] !== undefined) {
        formData.append(key, instructor[key as keyof Instructor] as string);
      }
    });
    
    return this.http.post<Instructor>(this.apiUrl, formData);
  }

  // Método original para actualizar instructor (sin foto)
  actualizarInstructor(folioInstructor: string, instructor: Instructor): Observable<Instructor> {
    const formData = new FormData();
    Object.keys(instructor).forEach(key => {
      if (instructor[key as keyof Instructor] !== null && instructor[key as keyof Instructor] !== undefined) {
        formData.append(key, instructor[key as keyof Instructor] as string);
      }
    });
    
    return this.http.put<Instructor>(`${this.apiUrl}/${folioInstructor}`, formData);
  }

  // Eliminar instructor (desactivar)
  eliminarInstructor(folioInstructor: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${folioInstructor}`);
  }

  // Cambiar estatus
  cambiarEstatusInstructor(folioInstructor: string, estatus: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${folioInstructor}/estatus`, null, {
      params: { estatus }
    });
  }

  // Activar instructor
  activarInstructor(folioInstructor: string): Observable<any> {
    return this.cambiarEstatusInstructor(folioInstructor, 'Activo');
  }

  // Desactivar instructor
  desactivarInstructor(folioInstructor: string): Observable<any> {
    return this.cambiarEstatusInstructor(folioInstructor, 'Inactivo');
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

  // Verificar existencia
  verificarInstructor(folioInstructor: string): Observable<{existe: boolean}> {
    return this.http.get<{existe: boolean}>(`${this.apiUrl}/verificar/${folioInstructor}`);
  }

  // Contar instructores activos
  contarInstructoresActivos(): Observable<{totalInstructoresActivos: number}> {
    return this.http.get<{totalInstructoresActivos: number}>(`${this.apiUrl}/conteo/activos`);
  }

  // Obtener foto del instructor
  obtenerFotoInstructor(folioInstructor: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${folioInstructor}/foto`, { responseType: 'blob' });
  }
}