import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface RealizaActividad {
  idRegistro: number;
  folioCliente: string;
  idActividad: string;
  fechaInscripcion: string;
  fechaParticipacion: string;
  estatus: string;
  asistio: boolean;
  calificacion?: number;
  comentarios?: string;
  actividad?: Actividad;
}

export interface ActividadConCupo {
  actividad: Actividad;
  cuposDisponibles: number;
  tieneCupo: boolean;
  inscripcionesActuales: number;
  cupoMaximoOriginal: number;
}

export interface InscripcionResponse {
  success: boolean;
  message: string;
  data?: RealizaActividad;
  cuposDisponibles?: number;
}

export interface EstadisticasActividades {
  totalActividades: number;
  actividadesCompletadas: number;
  actividadesInscritas: number;
  promedioCalificacion: number;
  porcentajeAsistencia: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActividadService {
  private apiUrl = 'http://localhost:8081/api/actividades'; 
  private clienteActividadesUrl = 'http://localhost:8081/api/cliente-actividades';

  constructor(private http: HttpClient) { }

  // ==================== MÉTODOS EXISTENTES ====================

  obtenerActividadesActivas(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/listar-activas`);
  }

  obtenerTodasActividades(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/listar`);
  }

  obtenerActividadesPorInstructor(folioInstructor: string): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/buscar-por-instructor/${folioInstructor}`);
  }

  obtenerActividadesFuturas(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/listar-futuras`);
  }

  obtenerActividadPorId(id: string): Observable<Actividad> {
    return this.http.get<Actividad>(`${this.apiUrl}/buscar/${id}`);
  }

  crearActividad(actividad: Actividad): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar`, actividad);
  }

  actualizarActividad(id: string, actividad: Actividad): Observable<any> {
    return this.http.put(`${this.apiUrl}/editar/${id}`, actividad);
  }

  eliminarActividad(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }

  activarActividad(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/activar/${id}`, {});
  }

  desactivarActividad(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/desactivar/${id}`, {});
  }

  buscarActividadesPorNombre(nombre: string): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(`${this.apiUrl}/buscar-por-nombre?nombre=${encodeURIComponent(nombre)}`);
  }

  verificarCupoDisponible(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/verificar-cupo/${id}`);
  }

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

  verificarConflictoHorario(lugar: string, fecha: string, horaInicio: string, horaFin: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.apiUrl}/verificar-conflicto?lugar=${lugar}&fecha=${fecha}&horaInicio=${horaInicio}&horaFin=${horaFin}`
    );
  }

  // ==================== MÉTODOS PARA INSCRIPCIÓN DE CLIENTES ====================

  inscribirClienteEnActividad(folioCliente: string, idActividad: string): Observable<InscripcionResponse> {
    const params = new HttpParams()
      .set('folioCliente', folioCliente)
      .set('idActividad', idActividad);

    return this.http.post<InscripcionResponse>(
      `${this.clienteActividadesUrl}/inscribir`, 
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
  }

  cancelarInscripcion(folioCliente: string, idActividad: string, motivo?: string): Observable<InscripcionResponse> {
    let params = new HttpParams()
      .set('folioCliente', folioCliente)
      .set('idActividad', idActividad);

    if (motivo) {
      params = params.set('motivo', motivo);
    }

    return this.http.put<InscripcionResponse>(
      `${this.clienteActividadesUrl}/cancelar`, 
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
  }

  obtenerActividadesDisponiblesConCupo(): Observable<{success: boolean, data: ActividadConCupo[], total: number}> {
    return this.http.get<{success: boolean, data: ActividadConCupo[], total: number}>(
      `${this.clienteActividadesUrl}/disponibles-con-cupo`
    );
  }

  obtenerActividadesDisponibles(): Observable<{success: boolean, data: Actividad[], total: number}> {
    return this.http.get<{success: boolean, data: Actividad[], total: number}>(
      `${this.clienteActividadesUrl}/disponibles`
    );
  }

  obtenerActividadesInscritas(folioCliente: string): Observable<{success: boolean, data: RealizaActividad[], total: number}> {
    return this.http.get<{success: boolean, data: RealizaActividad[], total: number}>(
      `${this.clienteActividadesUrl}/${folioCliente}/inscritas`
    );
  }

  obtenerHistorialActividades(folioCliente: string): Observable<{success: boolean, data: RealizaActividad[], total: number}> {
    return this.http.get<{success: boolean, data: RealizaActividad[], total: number}>(
      `${this.clienteActividadesUrl}/${folioCliente}/historial`
    );
  }

  verificarInscripcion(folioCliente: string, idActividad: string): Observable<{success: boolean, estaInscrito: boolean}> {
    const params = new HttpParams()
      .set('folioCliente', folioCliente)
      .set('idActividad', idActividad);

    return this.http.get<{success: boolean, estaInscrito: boolean}>(
      `${this.clienteActividadesUrl}/verificar-inscripcion`,
      { params }
    );
  }

  obtenerCuposDisponibles(idActividad: string): Observable<{success: boolean, cuposDisponibles: number}> {
    return this.http.get<{success: boolean, cuposDisponibles: number}>(
      `${this.clienteActividadesUrl}/${idActividad}/cupos-disponibles`
    );
  }

  obtenerInformacionCupo(idActividad: string): Observable<{success: boolean, data: any}> {
    return this.http.get<{success: boolean, data: any}>(
      `${this.clienteActividadesUrl}/${idActividad}/informacion-cupo`
    );
  }

  calificarActividad(folioCliente: string, idActividad: string, calificacion: number, comentario?: string): Observable<any> {
    let params = new HttpParams()
      .set('folioCliente', folioCliente)
      .set('idActividad', idActividad)
      .set('calificacion', calificacion.toString());

    if (comentario) {
      params = params.set('comentario', comentario);
    }

    return this.http.put(
      `${this.clienteActividadesUrl}/calificar`, 
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
  }

  obtenerEstadisticasCliente(folioCliente: string): Observable<{success: boolean, data: EstadisticasActividades}> {
    return this.http.get<{success: boolean, data: EstadisticasActividades}>(
      `${this.clienteActividadesUrl}/${folioCliente}/estadisticas`
    );
  }

  // ==================== MÉTODOS DE UTILIDAD (CORREGIDOS) ====================

  esActividadDisponible(actividad: Actividad): boolean {
    if (actividad.estatus !== 'Activa') return false;
    
    const fechaActividad = new Date(actividad.fechaActividad);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return fechaActividad >= hoy && actividad.cupo > 0;
  }

  formatearFechaParaMostrar(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatearHoraParaMostrar(hora: string): string {
    if (!hora) return '';
    
    const horaSinSegundos = hora.substring(0, 5);
    const [horas, minutos] = horaSinSegundos.split(':').map(Number);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas % 12 || 12;
    
    return `${horas12}:${minutos.toString().padStart(2, '0')} ${ampm}`;
  }

  // ==================== MÉTODOS FALTANTES AGREGADOS ====================

  obtenerEstadoActividad(actividad: Actividad): { texto: string, clase: string } {
    const fechaActividad = new Date(actividad.fechaActividad);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (actividad.estatus !== 'Activa') {
      return { texto: 'Inactiva', clase: 'badge-inactiva' };
    }

    if (fechaActividad < hoy) {
      return { texto: 'Pasada', clase: 'badge-pasada' };
    }

    if (actividad.cupo <= 0) {
      return { texto: 'Sin cupo', clase: 'badge-sin-cupo' };
    }

    if (actividad.cupo <= 3) {
      return { texto: 'Últimos cupos', clase: 'badge-ultimos-cupos' };
    }

    return { texto: 'Disponible', clase: 'badge-disponible' };
  }

  obtenerEstadoInscripcion(inscripcion: RealizaActividad): { texto: string, clase: string } {
    switch (inscripcion.estatus) {
      case 'Inscrito':
        return { texto: 'Inscrito', clase: 'badge-inscrito' };
      case 'Completado':
        return { texto: 'Completado', clase: 'badge-completado' };
      case 'Cancelado':
        return { texto: 'Cancelado', clase: 'badge-cancelado' };
      case 'NoShow':
        return { texto: 'No asistió', clase: 'badge-no-show' };
      default:
        return { texto: inscripcion.estatus, clase: 'badge-info' };
    }
  }

  sePuedeCancelarInscripcion(inscripcion: RealizaActividad): boolean {
    if (inscripcion.estatus !== 'Inscrito') return false;
    
    const fechaActividad = new Date(inscripcion.fechaParticipacion);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return fechaActividad > hoy;
  }

  sePuedeCalificarActividad(inscripcion: RealizaActividad): boolean {
    return inscripcion.estatus === 'Completado' && 
           !inscripcion.calificacion && 
           inscripcion.asistio === true;
  }
}