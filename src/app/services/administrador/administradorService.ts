import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Administrador {
  folioAdmin: string;
  nombreCom: string;
  app?: string;
  apm?: string;
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdministradorService {
  private apiUrl = 'http://localhost:8081/api/administradores';

  constructor(private http: HttpClient) {}

  // ===== OPERACIONES CRUD BÁSICAS =====
  obtenerTodosLosAdministradores(): Observable<Administrador[]> {
    return this.http.get<Administrador[]>(this.apiUrl);
  }

  obtenerAdministradorPorId(folioAdmin: string): Observable<Administrador> {
    return this.http.get<Administrador>(`${this.apiUrl}/${folioAdmin}`);
  }

  crearAdministrador(nombreCom: string, app?: string, apm?: string): Observable<any> {
    const params = new HttpParams()
      .set('nombreCom', nombreCom)
      .set('app', app || '')
      .set('apm', apm || '');
    
    return this.http.post(this.apiUrl, params);
  }

  actualizarAdministrador(folioAdmin: string, nombreCom?: string, app?: string, apm?: string): Observable<any> {
    const params = new HttpParams()
      .set('nombreCom', nombreCom || '')
      .set('app', app || '')
      .set('apm', apm || '');
    
    return this.http.put(`${this.apiUrl}/${folioAdmin}`, params);
  }

  eliminarAdministrador(folioAdmin: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${folioAdmin}`);
  }

  // ===== BÚSQUEDAS Y FILTROS =====
  buscarAdministradoresPorNombre(nombreCom: string): Observable<Administrador[]> {
    return this.http.get<Administrador[]>(`${this.apiUrl}/buscar/nombre`, {
      params: { nombreCom }
    });
  }

  buscarAdministradoresPorApp(app: string): Observable<Administrador[]> {
    return this.http.get<Administrador[]>(`${this.apiUrl}/buscar/app`, {
      params: { app }
    });
  }

  buscarAdministradoresPorApm(apm: string): Observable<Administrador[]> {
    return this.http.get<Administrador[]>(`${this.apiUrl}/buscar/apm`, {
      params: { apm }
    });
  }

  obtenerAdministradoresFiltrados(nombreCom?: string, app?: string, apm?: string): Observable<Administrador[]> {
    let params = new HttpParams();
    if (nombreCom) params = params.set('nombreCom', nombreCom);
    if (app) params = params.set('app', app);
    if (apm) params = params.set('apm', apm);

    return this.http.get<Administrador[]>(`${this.apiUrl}/filtros`, { params });
  }

  // ===== ESTADÍSTICAS =====
  obtenerEstadisticasAdministrador(folioAdmin: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${folioAdmin}/estadisticas`);
  }

  obtenerEstadisticasGenerales(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas-generales`);
  }

  // ===== CONSULTAS ADICIONALES =====
  obtenerAdministradoresRecientes(dias: number = 30): Observable<Administrador[]> {
    return this.http.get<Administrador[]>(`${this.apiUrl}/recientes`, {
      params: { dias: dias.toString() }
    });
  }

  obtenerAdministradoresPorRangoFechas(fechaInicio: string, fechaFin: string): Observable<Administrador[]> {
    return this.http.get<Administrador[]>(`${this.apiUrl}/por-fechas`, {
      params: { fechaInicio, fechaFin }
    });
  }

  // ===== MÉTODOS DE UTILIDAD =====
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calcularTiempoRegistro(fechaRegistro: string): string {
    if (!fechaRegistro) return '';
    
    const registro = new Date(fechaRegistro);
    const ahora = new Date();
    const diffMs = ahora.getTime() - registro.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) return 'Hoy';
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return `Hace ${diffDias} días`;
    if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} semanas`;
    if (diffDias < 365) return `Hace ${Math.floor(diffDias / 30)} meses`;
    
    return `Hace ${Math.floor(diffDias / 365)} años`;
  }
}