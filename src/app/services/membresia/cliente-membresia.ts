import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClienteMembresia {
  id_membresia_cliente: number;
  folio_cliente: string;
  id_membresia: string;
  fecha_inicio: string;
  fecha_fin: string;
  estatus: string;
  fecha_registro: string;
  fecha_actualizacion: string;
}

export interface VerificarAccesoResponse {
  tieneAcceso: boolean;
  mensaje: string;
  membresia?: ClienteMembresia;
}

export interface EstadisticasResponse {
  totalMembresias: number;
  activas: number;
  expiradas: number;
  canceladas: number;
  porExpirar: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteMembresiaService {
  private apiUrl = 'http://localhost:8081/api/membresias-clientes';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // ==================== OPERACIONES BÁSICAS ====================

  /**
   * Obtener todas las membresías activas
   */
  obtenerMembresiasActivas(): Observable<ClienteMembresia[]> {
    return this.http.get<ClienteMembresia[]>(`${this.apiUrl}/activas`);
  }

  /**
   * Asignar una membresía a un cliente
   */
  asignarMembresia(folioCliente: string, idMembresia: string, fechaInicio: string): Observable<ClienteMembresia> {
    const params = new HttpParams()
      .set('folioCliente', folioCliente)
      .set('idMembresia', idMembresia)
      .set('fechaInicio', fechaInicio);

    return this.http.post<ClienteMembresia>(this.apiUrl, {}, { 
      headers: this.getHeaders(),
      params: params
    });
  }

  /**
   * Renovar una membresía existente
   */
  renovarMembresia(id: number): Observable<ClienteMembresia> {
    return this.http.post<ClienteMembresia>(`${this.apiUrl}/${id}/renovar`, {});
  }

  /**
   * Cancelar una membresía
   */
  cancelarMembresia(id: number): Observable<ClienteMembresia> {
    return this.http.put<ClienteMembresia>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  /**
   * Cambiar el tipo de membresía de un cliente
   */
  cambiarMembresia(id: number, nuevaIdMembresia: string): Observable<ClienteMembresia> {
    const params = new HttpParams().set('nuevaIdMembresia', nuevaIdMembresia);
    return this.http.put<ClienteMembresia>(`${this.apiUrl}/${id}/cambiar`, {}, { params });
  }

  // ==================== CONSULTAS ESPECÍFICAS ====================

  /**
   * Obtener la membresía activa de un cliente
   */
  obtenerMembresiaActiva(folioCliente: string): Observable<ClienteMembresia> {
    return this.http.get<ClienteMembresia>(`${this.apiUrl}/cliente/${folioCliente}/activa`);
  }

  /**
   * Obtener el historial completo de membresías de un cliente
   */
  obtenerHistorialMembresias(folioCliente: string): Observable<ClienteMembresia[]> {
    return this.http.get<ClienteMembresia[]>(`${this.apiUrl}/cliente/${folioCliente}/historial`);
  }

  /**
   * Obtener membresías que están por expirar
   */
  obtenerMembresiasPorExpirar(dias: number = 7): Observable<ClienteMembresia[]> {
    const params = new HttpParams().set('dias', dias.toString());
    return this.http.get<ClienteMembresia[]>(`${this.apiUrl}/por-expirar`, { params });
  }

  // ==================== VERIFICACIONES Y UTILIDADES ====================

  /**
   * Verificar si un cliente tiene acceso al gimnasio
   */
  verificarAcceso(folioCliente: string): Observable<VerificarAccesoResponse> {
    return this.http.get<VerificarAccesoResponse>(`${this.apiUrl}/cliente/${folioCliente}/verificar-acceso`);
  }

  /**
   * Actualizar automáticamente membresías expiradas
   */
  actualizarMembresiasExpiradas(): Observable<{ actualizadas: number }> {
    return this.http.post<{ actualizadas: number }>(`${this.apiUrl}/actualizar-expiradas`, {});
  }

  /**
   * Obtener estadísticas generales del sistema
   */
  getEstadisticas(): Observable<EstadisticasResponse> {
    return this.http.get<EstadisticasResponse>(`${this.apiUrl}/estadisticas`);
  }

  // ==================== MÉTODOS ADICIONALES ====================

  /**
   * Obtener todas las membresías (si el endpoint existe)
   */
  obtenerTodasMembresias(): Observable<ClienteMembresia[]> {
    return this.http.get<ClienteMembresia[]>(this.apiUrl);
  }

  /**
   * Obtener una membresía específica por ID
   */
  obtenerMembresiaPorId(id: number): Observable<ClienteMembresia> {
    return this.http.get<ClienteMembresia>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener membresías por estatus
   */
  obtenerMembresiasPorEstatus(estatus: string): Observable<ClienteMembresia[]> {
    const params = new HttpParams().set('estatus', estatus);
    return this.http.get<ClienteMembresia[]>(`${this.apiUrl}/estatus`, { params });
  }

  /**
   * Verificar si un cliente tiene membresía activa
   */
  verificarMembresiaActiva(folioCliente: string): Observable<{ tieneMembresiaActiva: boolean }> {
    return this.http.get<{ tieneMembresiaActiva: boolean }>(`${this.apiUrl}/cliente/${folioCliente}/tiene-activa`);
  }

  /**
   * Obtener fecha de expiración de membresía
   */
  obtenerFechaExpiracion(folioCliente: string): Observable<{ fechaExpiracion: string }> {
    return this.http.get<{ fechaExpiracion: string }>(`${this.apiUrl}/cliente/${folioCliente}/expiracion`);
  }

  // ==================== MÉTODOS DE GESTIÓN ====================

  /**
   * Suspender temporalmente una membresía
   */
  suspenderMembresia(id: number, motivo: string): Observable<ClienteMembresia> {
    const body = { motivo: motivo };
    return this.http.put<ClienteMembresia>(`${this.apiUrl}/${id}/suspender`, body);
  }

  /**
   * Reactivar una membresía suspendida
   */
  reactivarMembresia(id: number): Observable<ClienteMembresia> {
    return this.http.put<ClienteMembresia>(`${this.apiUrl}/${id}/reactivar`, {});
  }

  /**
   * Extender la vigencia de una membresía
   */
  extenderMembresia(id: number, diasExtendidos: number): Observable<ClienteMembresia> {
    const body = { diasExtendidos: diasExtendidos };
    return this.http.put<ClienteMembresia>(`${this.apiUrl}/${id}/extender`, body);
  }

  // ==================== MÉTODOS DE REPORTES ====================

  /**
   * Generar reporte de membresías por periodo
   */
  generarReporteMembresias(fechaInicio: string, fechaFin: string): Observable<any> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    
    return this.http.get<any>(`${this.apiUrl}/reportes/membresias`, { params });
  }

  /**
   * Obtener ingresos por membresías
   */
  obtenerIngresosMembresias(periodo: string): Observable<{ periodo: string, ingresos: number }> {
    const params = new HttpParams().set('periodo', periodo);
    return this.http.get<{ periodo: string, ingresos: number }>(`${this.apiUrl}/reportes/ingresos`, { params });
  }

  // ==================== MÉTODOS DE NOTIFICACIONES ====================

  /**
   * Enviar recordatorio de expiración
   */
  enviarRecordatorioExpiracion(id: number): Observable<{ enviado: boolean }> {
    return this.http.post<{ enviado: boolean }>(`${this.apiUrl}/${id}/recordatorio`, {});
  }

  /**
   * Notificar renovación exitosa
   */
  notificarRenovacion(id: number): Observable<{ notificado: boolean }> {
    return this.http.post<{ notificado: boolean }>(`${this.apiUrl}/${id}/notificar-renovacion`, {});
  }
}