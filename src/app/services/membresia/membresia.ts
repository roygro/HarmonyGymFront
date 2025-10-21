import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Modelo DEFINIDO DENTRO del servicio
export interface Membresia {
  idMembresia: string;
  tipo: TipoMembresia;
  precio: number;
  duracion: number;
  descripcion: string;
  beneficios: string;
  estatus: string;
  fechaCreacion: string;
}

export enum TipoMembresia {
  Basica = 'Básica',
  Premium = 'Premium',
  VIP = 'VIP'
}

@Injectable({
  providedIn: 'root'
})
export class MembresiaService {
  private apiUrl = 'http://localhost:8081/api/membresias';

  constructor(private http: HttpClient) { }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  getMembresias(): Observable<Membresia[]> {
    return this.http.get<Membresia[]>(this.apiUrl);
  }

  getMembresiaById(id: string): Observable<Membresia> {
    return this.http.get<Membresia>(`${this.apiUrl}/${id}`);
  }

  createMembresia(membresia: Membresia): Observable<Membresia> {
    return this.http.post<Membresia>(this.apiUrl, membresia, { headers: this.getHeaders() });
  }

  updateMembresia(id: string, membresia: Membresia): Observable<Membresia> {
    return this.http.put<Membresia>(`${this.apiUrl}/${id}`, membresia, { headers: this.getHeaders() });
  }

  desactivarMembresia(id: string): Observable<Membresia> {
    return this.http.put<Membresia>(`${this.apiUrl}/${id}/desactivar`, {});
  }

  activarMembresia(id: string): Observable<Membresia> {
    return this.http.put<Membresia>(`${this.apiUrl}/${id}/activar`, {});
  }

  getMembresiasActivas(): Observable<Membresia[]> {
    return this.http.get<Membresia[]>(`${this.apiUrl}/activas`);
  }

  getEstadisticas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`);
  }
}