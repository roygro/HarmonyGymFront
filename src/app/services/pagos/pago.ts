import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces dentro del mismo archivo del servicio
export interface Pago {
  idVenta?: number;
  idRecepcionista: string;
  codigoProducto?: string;
  idMembresia?: string; // Nuevo campo opcional
  fechaVenta?: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  folioCliente: string;
  tipoPago: string; // 'producto' o 'membresia'
}

export interface PagoDTO {
  idRecepcionista: string;
  codigoProducto?: string;
  idMembresia?: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  folioCliente: string;
  tipoPago: string;
}

export interface EstadisticasDia {
  totalVentas: number;
  cantidadVentas: number;
}

export interface TipoMembresia {
  codigo: string;
  nombre: string;
  precio: number;
}

export interface Producto {
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  descripcion: string;
  estatus: string;
}

export interface Cliente {
  folio: string;
  nombre: string;
  email?: string;
  telefono?: string;
  estatus: string;
}

export interface Recepcionista {
  id: string;
  nombre: string;
  email?: string;
  estatus: string;
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = 'http://localhost:8081/api/pagos';

  constructor(private http: HttpClient) { }

  // Crear nuevo pago
  crearPago(pago: PagoDTO): Observable<Pago> {
    return this.http.post<Pago>(this.apiUrl, pago);
  }

  // Obtener todos los pagos
  obtenerPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(this.apiUrl);
  }

  // Obtener pagos por cliente
  obtenerPagosPorCliente(folioCliente: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/cliente/${folioCliente}`);
  }

  // Obtener pagos por recepcionista
  obtenerPagosPorRecepcionista(idRecepcionista: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/recepcionista/${idRecepcionista}`);
  }

  // Obtener estadísticas del día
  obtenerEstadisticasDia(): Observable<EstadisticasDia> {
    return this.http.get<EstadisticasDia>(`${this.apiUrl}/estadisticas/dia`);
  }

  // Obtener tipos de membresía
  obtenerTiposMembresia(): Observable<TipoMembresia[]> {
    return this.http.get<TipoMembresia[]>(`${this.apiUrl}/tipos-membresia`);
  }

  // Obtener pago por ID
  obtenerPagoPorId(id: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/${id}`);
  }

  // Obtener pagos por rango de fechas
  obtenerPagosPorRangoFechas(fechaInicio: string, fechaFin: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/rango-fechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  }


  // Obtener todos los clientes
obtenerClientes(): Observable<Cliente[]> {
  return this.http.get<Cliente[]>(`http://localhost:8081/api/clientes`);
}

// Obtener todos los recepcionistas
obtenerRecepcionistas(): Observable<Recepcionista[]> {
  return this.http.get<Recepcionista[]>(`http://localhost:8081/api/recepcionistas`);
}

// Obtener todos los productos
obtenerProductos(): Observable<Producto[]> {
  return this.http.get<Producto[]>(`http://localhost:8081/api/productos`);
}
}

