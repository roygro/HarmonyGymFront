import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  descripcion: string;
  estatus: string;
  fechaRegistro?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:8081/api/productos';

  constructor(private http: HttpClient) { }

  // Obtener todos los productos
  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  // Obtener producto por código
  obtenerProductoPorCodigo(codigo: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${codigo}`);
  }

  // Obtener productos por categoría
  obtenerProductosPorCategoria(categoria: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/categoria/${categoria}`);
  }

  // Obtener productos activos
  obtenerProductosActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/estatus/activo`);
  }

  // Crear nuevo producto
  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  // Actualizar producto
  actualizarProducto(codigo: string, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${codigo}`, producto);
  }

  // Cambiar estatus de producto
  cambiarEstatusProducto(codigo: string, estatus: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${codigo}/estatus`, { estatus });
  }
}