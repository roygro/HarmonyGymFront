import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Cliente {
  folioCliente: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  genero: string;
  fechaRegistro: string;
  estatus: string;
  nombreArchivoFoto?: string;
  edad?: number; 
}

export interface CrearClienteRequest {
  nombre: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: string;
  genero?: string;
  estatus?: string;
}

export interface ActualizarClienteRequest {
  nombre?: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: string;
  genero?: string;
  estatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:8081/api/clientes';

  constructor(private http: HttpClient) { }

  // ===== MÉTODOS BÁSICOS DE CLIENTES =====

  /**
   * Obtener todos los clientes
   */
  obtenerTodosLosClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener cliente por ID
   */
  obtenerClientePorId(folioCliente: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${folioCliente}`).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Crear nuevo cliente
   */
  crearCliente(cliente: CrearClienteRequest): Observable<Cliente> {
    // Convertir a FormData para multipart/form-data
    const formData = this.crearFormDataDesdeCliente(cliente);
    return this.http.post<Cliente>(this.apiUrl, formData).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Actualizar cliente existente - CORREGIDO para usar FormData
   */
  actualizarCliente(folioCliente: string, cliente: ActualizarClienteRequest): Observable<any> {
    const formData = this.crearFormDataDesdeCliente(cliente);
    
    console.log('🔄 Enviando actualización con FormData:');
    formData.forEach((value, key) => {
      console.log(`  ${key}:`, value);
    });
    
    return this.http.put<any>(`${this.apiUrl}/${folioCliente}`, formData).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Eliminar cliente permanentemente
   */
  eliminarCliente(folioCliente: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${folioCliente}`).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Dar de baja cliente (cambiar estatus a Inactivo)
   */
  darDeBajaCliente(folioCliente: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${folioCliente}/estatus`, null, {
      params: { estatus: 'Inactivo' }
    }).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Activar cliente (cambiar estatus a Activo)
   */
  activarCliente(folioCliente: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${folioCliente}/estatus`, null, {
      params: { estatus: 'Activo' }
    }).pipe(
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS PARA FOTOS =====

  /**
   * Crear cliente con foto
   */
  crearClienteConFoto(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Actualizar cliente con foto
   */
  actualizarClienteConFoto(folioCliente: string, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${folioCliente}`, formData).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener foto del cliente
   */
  obtenerFotoCliente(folioCliente: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${folioCliente}/foto`, {
      responseType: 'blob'
    }).pipe(
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS DE BÚSQUEDA Y FILTRADO =====

  /**
   * Buscar clientes por término (nombre)
   */
  buscarClientes(termino: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar`, {
      params: { nombre: termino }
    }).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener clientes por estatus
   */
  obtenerClientesPorEstatus(estatus: string): Observable<Cliente[]> {
    const params = new HttpParams().set('estatus', estatus);
    return this.http.get<Cliente[]>(`${this.apiUrl}/filtros`, { params }).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener solo clientes activos
   */
  obtenerClientesActivos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/activos`).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener clientes con membresía activa
   */
  obtenerClientesConMembresiaActiva(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/con-membresia-activa`).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener clientes no asignados a una rutina
   */
  obtenerClientesNoAsignadosARutina(folioRutina: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/no-asignados/${folioRutina}`).pipe(
      catchError(this.manejarError)
    );
  }

  // ===== MÉTODOS DE VALIDACIÓN =====

  /**
   * Verificar si un folio de cliente ya existe
   */
  verificarFolioExistente(folioCliente: string): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerClientePorId(folioCliente).subscribe({
        next: () => observer.next(true),
        error: (error) => {
          if (error.status === 404) {
            observer.next(false);
          } else {
            observer.error(error);
          }
        },
        complete: () => observer.complete()
      });
    });
  }

  /**
   * Verificar disponibilidad de username (placeholder)
   */
  verificarDisponibilidadUsername(username: string): Observable<any> {
    return of({ disponible: true });
  }

  /**
   * Verificar si un email ya está registrado
   */
  verificarEmailExistente(email: string, folioClienteExcluir?: string): Observable<boolean> {
    return new Observable(observer => {
      this.obtenerTodosLosClientes().subscribe({
        next: (clientes) => {
          const emailExistente = clientes.some(cliente => {
            const emailCoincide = cliente.email?.toLowerCase() === email.toLowerCase();
            const esMismoCliente = folioClienteExcluir && cliente.folioCliente === folioClienteExcluir;
            return emailCoincide && !esMismoCliente;
          });
          observer.next(emailExistente);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // ===== MÉTODOS PARA ESTADÍSTICAS =====

  /**
   * Obtener estadísticas generales de clientes
   */
  obtenerEstadisticasClientes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas-generales`).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener estadísticas de un cliente específico
   */
  obtenerEstadisticasCliente(folioCliente: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${folioCliente}/estadisticas`).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Obtener distribución por género
   */
  obtenerDistribucionGenero(): Observable<any> {
    return new Observable(observer => {
      this.obtenerTodosLosClientes().subscribe({
        next: (clientes) => {
          const distribucion = clientes.reduce((acc, cliente) => {
            const genero = cliente.genero || 'No especificado';
            acc[genero] = (acc[genero] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });
          
          observer.next(distribucion);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Crear FormData desde objeto cliente
   */
  private crearFormDataDesdeCliente(cliente: any): FormData {
    const formData = new FormData();
    
    // Agregar solo los campos que tienen valor
    if (cliente.nombre) formData.append('nombre', cliente.nombre);
    if (cliente.telefono) formData.append('telefono', cliente.telefono);
    if (cliente.email) formData.append('email', cliente.email);
    if (cliente.fechaNacimiento) formData.append('fechaNacimiento', cliente.fechaNacimiento);
    if (cliente.genero) formData.append('genero', cliente.genero);
    if (cliente.estatus) formData.append('estatus', cliente.estatus);
    
    return formData;
  }

  /**
   * Manejo centralizado de errores
   */
  private manejarError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en ClienteService:', error);
    
    let mensajeError = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      mensajeError = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.status === 0) {
        mensajeError = 'Error de conexión con el servidor. Verifica que el backend esté funcionando.';
      } else if (error.status === 404) {
        mensajeError = 'Recurso no encontrado';
      } else if (error.status === 400) {
        mensajeError = error.error?.message || 'Datos inválidos';
      } else if (error.status === 409) {
        mensajeError = error.error?.message || 'Conflicto: El email o teléfono ya están registrados';
      } else if (error.error?.message) {
        mensajeError = error.error.message;
      } else {
        mensajeError = `${error.status}: ${error.message}`;
      }
    }
    
    return throwError(() => new Error(mensajeError));
  }

  /**
   * Verificar si el servidor está disponible
   */
  verificarServidor(): Observable<any> {
    return this.http.get(this.apiUrl).pipe(
      catchError(this.manejarError)
    );
  }

  /**
   * Calcular edad a partir de la fecha de nacimiento
   */
  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    
    const mes = hoy.getMonth();
    const dia = hoy.getDate();
    
    if (mes < nacimiento.getMonth() || 
        (mes === nacimiento.getMonth() && dia < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Validar formato de email
   */
  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar formato de teléfono (México)
   */
  validarTelefono(telefono: string): boolean {
    const telefonoRegex = /^[0-9]{10}$/;
    return telefonoRegex.test(telefono.replace(/\D/g, ''));
  }

  // ===== MÉTODOS PARA EXPORTACIÓN =====

  /**
   * Generar datos para exportar a CSV
   */
  generarDatosCSV(clientes: Cliente[]): string {
    const headers = ['Folio', 'Nombre', 'Teléfono', 'Email', 'Fecha Nacimiento', 'Género', 'Estatus', 'Fecha Registro'];
    const csvData = clientes.map(cliente => [
      cliente.folioCliente,
      `"${cliente.nombre}"`,
      cliente.telefono || '',
      cliente.email || '',
      cliente.fechaNacimiento || '',
      cliente.genero || '',
      cliente.estatus,
      cliente.fechaRegistro
    ]);
    
    return [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
  }

  /**
   * Descargar clientes como CSV
   */
  descargarClientesCSV(clientes: Cliente[], nombreArchivo: string = 'clientes'): void {
    const csvContent = this.generarDatosCSV(clientes);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${nombreArchivo}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}