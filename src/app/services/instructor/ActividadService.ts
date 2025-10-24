import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Actividad {
  idActividad: string;
  nombreActividad: string;
  fechaActividad: string; 
  horaInicio: string;
  horaFin: string;
  descripcion: string;
  cupo: number;
  lugar: string;
  imagenUrl?: string;
  folioInstructor: string; 
  estatus: string;
  fechaCreacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  private apiUrl = 'http://localhost:8081/api/actividades'; 

  constructor(private http: HttpClient) { }

  // Obtener todas las actividades activas
  obtenerActividadesActivas(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/listar-activas`);
  }

  // Obtener todas las actividades (incluyendo inactivas)
  obtenerTodasActividades(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/listar`);
  }
  //Obtener Actividades por Instructor
 obtenerActividadesPorInstructor(folioInstructor: string): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/buscar-por-instructor/${folioInstructor}`);
  }
  // Obtener actividades futuras
  obtenerActividadesFuturas(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/listar-futuras`);
  }

  // Obtener actividad por ID
  obtenerActividadPorId(id: string): Observable<Actividad> {
    return this.http.get<Actividad>(`${this.apiUrl}/buscar/${id}`);
  }

  // Crear nueva actividad
  crearActividad(actividad: Actividad): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar`, actividad);
  }

  // Actualizar actividad existente
  actualizarActividad(id: string, actividad: Actividad): Observable<any> {
    return this.http.put(`${this.apiUrl}/editar/${id}`, actividad);
  }

  // Eliminar actividad (cambiar estatus a inactiva)
  eliminarActividad(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
// Activar actividad
  activarActividad(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/activar/${id}`, {});
  }
 // Desactivar actividad
  desactivarActividad(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/desactivar/${id}`, {});
  }
  // Buscar actividades por nombre
  buscarActividadesPorNombre(nombre: string): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/buscar-por-nombre?nombre=${encodeURIComponent(nombre)}`);
  }

  // Verificar cupo disponible
  verificarCupoDisponible(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/verificar-cupo/${id}`);
  }

  // Contar actividades activas
  contarActividadesActivas(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/contar-activas`);
  }
verificarConflictoHorarioExcluyendo(
  lugar: string, 
  fecha: string, 
  horaInicio: string, 
  horaFin: string, 
  excludeId: string
): Observable<boolean> {
  return this.http.get<boolean>(
    `${this.apiUrl}/verificar-conflicto-excluyendo?lugar=${lugar}&fecha=${fecha}&horaInicio=${horaInicio}&horaFin=${horaFin}&excludeId=${excludeId}`
  );
}
  // Verificar conflicto de horarios
  verificarConflictoHorario(lugar: string, fecha: string, horaInicio: string, horaFin: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/verificar-conflicto?lugar=${lugar}&fecha=${fecha}&horaInicio=${horaInicio}&horaFin=${horaFin}`
    );
  }
}