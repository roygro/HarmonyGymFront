import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Recepcionista {
  idRecepcionista: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaContratacion: string;
  estatus: string;
  fechaRegistro: Date;
}

export interface RecepcionistaEstadisticas {
  totalRegistros: number;
  totalVentas: number;
  totalIngresos: number;
  registrosUltimoMes: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecepcionistaService {
  private apiUrl = 'http://localhost:8081/api/recepcionistas';

  constructor(private http: HttpClient) {}

  obtenerRecepcionistas(): Observable<Recepcionista[]> {
    return this.http.get<Recepcionista[]>(this.apiUrl);
  }

  obtenerRecepcionistasFiltrados(estatus?: string): Observable<Recepcionista[]> {
    let params = new HttpParams();
    if (estatus) {
      params = params.set('estatus', estatus);
    }
    return this.http.get<Recepcionista[]>(`${this.apiUrl}/filtrados`, { params });
  }

  buscarRecepcionistasPorNombre(nombre: string): Observable<Recepcionista[]> {
    return this.http.get<Recepcionista[]>(`${this.apiUrl}/buscar`, {
      params: { nombre }
    });
  }

  crearRecepcionista(
    nombre: string,
    telefono: string,
    email: string,
    fechaContratacion: string,
    estatus: string
  ): Observable<Recepcionista> {
    return this.http.post<Recepcionista>(this.apiUrl, {
      nombre,
      telefono,
      email,
      fechaContratacion,
      estatus
    });
  }

  actualizarRecepcionista(
    idRecepcionista: string,
    nombre: string,
    telefono: string,
    email: string,
    fechaContratacion: string,
    estatus: string
  ): Observable<Recepcionista> {
    return this.http.put<Recepcionista>(`${this.apiUrl}/${idRecepcionista}`, {
      nombre,
      telefono,
      email,
      fechaContratacion,
      estatus
    });
  }

  eliminarRecepcionista(idRecepcionista: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idRecepcionista}`);
  }

  activarRecepcionista(idRecepcionista: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${idRecepcionista}/activar`, {});
  }

  obtenerEstadisticas(idRecepcionista: string): Observable<RecepcionistaEstadisticas> {
    return this.http.get<RecepcionistaEstadisticas>(`${this.apiUrl}/${idRecepcionista}/estadisticas`);
  }
}