import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs';

export interface ClienteMembresia {
  id_membresia_cliente: number;
  folio_cliente: string;
  id_membresia: string;
  fecha_inicio: string;
  fecha_fin: string;
  estatus: string;
  fecha_registro: string;
  fecha_actualizacion: string;
  planPago?: PlanPago; // ✅ NUEVO: Incluir plan de pago
   membresia?: {
    idMembresia: string;
    tipo: string;
    precio: number;
    duracion: number;
    descripcion: string;
  };
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

// ✅ NUEVO: Interface para PlanPago
export interface PlanPago {
  id: number;
  nombre: string;
  descripcion: string;
  duracionDias: number;
  factorDescuento: number;
  estatus: string;
   tipoPlan?: string;
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
   * Asignar una membresía a un cliente - ✅ MODIFICADO: Incluir idPlanPago
   */
  asignarMembresia(folioCliente: string, idMembresia: string, idPlanPago: number, fechaInicio: string): Observable<ClienteMembresia> {
    const params = new HttpParams()
      .set('folioCliente', folioCliente)
      .set('idMembresia', idMembresia)
      .set('idPlanPago', idPlanPago.toString()) // ✅ NUEVO: Incluir plan de pago
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
    return this.http.post<{success: boolean, message: string, membresia: ClienteMembresia}>(
      `${this.apiUrl}/${id}/renovar`, 
      {}
    ).pipe(
      map(response => {
        if (response.success) {
          return response.membresia;
        } else {
          throw new Error(response.message);
        }
      })
    );
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

  // ✅ NUEVO: MÉTODOS PARA PLANES DE PAGO

  /**
   * Obtener planes de pago disponibles
   */
  obtenerPlanesPagoDisponibles(): Observable<PlanPago[]> {
    return this.http.get<{success: boolean, planes: PlanPago[]}>(
      `${this.apiUrl}/planes-pago`
    ).pipe(
      map(response => response.planes || [])
    );
  }

  /**
   * Obtener planes con descuento
   */
  obtenerPlanesConDescuento(): Observable<PlanPago[]> {
    return this.http.get<{success: boolean, planes: PlanPago[]}>(
      `${this.apiUrl}/planes-pago/descuentos`
    ).pipe(
      map(response => response.planes || [])
    );
  }

  /**
   * Cambiar plan de pago de una membresía
   */
  cambiarPlanPago(idMembresiaCliente: number, idPlanPago: number): Observable<ClienteMembresia> {
    const params = new HttpParams().set('idPlanPago', idPlanPago.toString());
    return this.http.put<ClienteMembresia>(`${this.apiUrl}/${idMembresiaCliente}/cambiar-plan`, {}, { params });
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
}