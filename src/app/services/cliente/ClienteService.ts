import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cliente {
  folioCliente: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  genero: string;
  fechaRegistro: string;
  estatus: string;
  edad?: number; 
}

export interface CrearClienteRequest {
  folioCliente: string;
  nombre: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: string;
  genero?: string;
}

export interface ActualizarClienteRequest {
  nombre: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: string;
  genero?: string;
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
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  /**
   * Obtener cliente por ID
   */
  obtenerClientePorId(folioCliente: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${folioCliente}`);
  }

  /**
   * Crear nuevo cliente
   */
  crearCliente(cliente: CrearClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  /**
   * Actualizar cliente existente
   */
  actualizarCliente(folioCliente: string, cliente: ActualizarClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${folioCliente}`, cliente);
  }

  /**
   * Eliminar cliente permanentemente
   */
  eliminarCliente(folioCliente: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${folioCliente}`);
  }

  /**
   * Dar de baja cliente (cambiar estatus a Inactivo)
   */
  darDeBajaCliente(folioCliente: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${folioCliente}/baja`, {});
  }

  /**
   * Activar cliente (cambiar estatus a Activo)
   */
  activarCliente(folioCliente: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${folioCliente}/activar`, {});
  }

  // ===== MÉTODOS DE BÚSQUEDA Y FILTRADO =====

  /**
   * Buscar clientes por término (nombre)
   */
  buscarClientes(termino: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/search`, {
      params: { searchTerm: termino }
    });
  }

  /**
   * Obtener clientes por estatus
   */
  obtenerClientesPorEstatus(estatus: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/estatus/${estatus}`);
  }

  /**
   * Obtener solo clientes activos
   */
  obtenerClientesActivos(): Observable<Cliente[]> {
    return this.obtenerClientesPorEstatus('Activo');
  }

  /**
   * Obtener solo clientes inactivos
   */
  obtenerClientesInactivos(): Observable<Cliente[]> {
    return this.obtenerClientesPorEstatus('Inactivo');
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

  // ===== MÉTODOS DE UTILIDAD =====

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

  // ===== MÉTODOS PARA ESTADÍSTICAS =====

  /**
   * Obtener estadísticas generales de clientes
   */
  obtenerEstadisticasClientes(): Observable<any> {
    return new Observable(observer => {
      this.obtenerTodosLosClientes().subscribe({
        next: (clientes) => {
          const totalClientes = clientes.length;
          const clientesActivos = clientes.filter(c => c.estatus === 'Activo').length;
          const clientesInactivos = clientes.filter(c => c.estatus === 'Inactivo').length;
          
          const estadisticas = {
            totalClientes,
            clientesActivos,
            clientesInactivos,
            porcentajeActivos: totalClientes > 0 ? (clientesActivos / totalClientes) * 100 : 0
          };
          
          observer.next(estadisticas);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
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