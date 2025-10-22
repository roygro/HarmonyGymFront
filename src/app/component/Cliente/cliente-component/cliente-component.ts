import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente, CrearClienteRequest, ActualizarClienteRequest, ClienteService } from '../../../services/cliente/ClienteService';

@Component({
  selector: 'app-cliente-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-component.html',
  styleUrl: './cliente-component.css'
})
export class ClienteComponent implements OnInit {
  // Estados de la aplicación
  vistaActual: 'lista' | 'detalle' | 'crear' | 'editar' = 'lista';
  
  // Datos
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;
  
  // Formularios
  nuevoCliente: CrearClienteRequest = this.inicializarCliente();
  clienteEditado: ActualizarClienteRequest = this.inicializarClienteEditado();
  
  // Filtros y búsquedas
  filtroNombre: string = '';
  filtroEstatus: string = '';
  terminoBusqueda: string = '';
  
  // Estados de carga y mensajes
  cargando: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'info' = 'info';
  
  // Validaciones
  erroresValidacion: { [key: string]: string } = {};

  constructor(public clienteService: ClienteService) {}

  ngOnInit() {
    this.cargarClientes();
  }

  // ===== MÉTODOS DE CARGA DE DATOS =====
  cargarClientes(): void {
    this.cargando = true;
    this.clienteService.obtenerTodosLosClientes().subscribe({
      next: (clientes) => {
        this.clientes = clientes;
        this.clientesFiltrados = clientes;
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al cargar los clientes', 'error');
        this.cargando = false;
      }
    });
  }

  cargarClientePorId(folioCliente: string): void {
    this.cargando = true;
    this.clienteService.obtenerClientePorId(folioCliente).subscribe({
      next: (cliente) => {
        this.clienteSeleccionado = cliente;
        this.cargando = false;
        this.vistaActual = 'detalle';
      },
      error: (error) => {
        this.mostrarMensaje('Error al cargar el cliente', 'error');
        this.cargando = false;
      }
    });
  }

  // ===== MÉTODOS DE GESTIÓN DE CLIENTES =====
  crearCliente(): void {
    // Validar antes de crear
    if (!this.validarCliente(this.nuevoCliente)) return;

    this.cargando = true;
    this.clienteService.crearCliente(this.nuevoCliente).subscribe({
      next: (cliente) => {
        this.mostrarMensaje('Cliente creado exitosamente', 'success');
        this.cargarClientes();
        this.vistaActual = 'lista';
        this.nuevoCliente = this.inicializarCliente();
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al crear el cliente: ' + error.error, 'error');
        this.cargando = false;
      }
    });
  }

  actualizarCliente(): void {
    if (!this.clienteSeleccionado) return;

    // Validar antes de actualizar
    if (!this.validarCliente(this.clienteEditado)) return;

    this.cargando = true;
    this.clienteService.actualizarCliente(this.clienteSeleccionado.folioCliente, this.clienteEditado).subscribe({
      next: (cliente) => {
        this.mostrarMensaje('Cliente actualizado exitosamente', 'success');
        this.cargarClientes();
        this.vistaActual = 'detalle';
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al actualizar el cliente: ' + error.error, 'error');
        this.cargando = false;
      }
    });
  }

  eliminarCliente(folioCliente: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar permanentemente este cliente?')) {
      this.clienteService.eliminarCliente(folioCliente).subscribe({
        next: () => {
          this.mostrarMensaje('Cliente eliminado exitosamente', 'success');
          this.cargarClientes();
        },
        error: (error) => {
          this.mostrarMensaje('Error al eliminar el cliente: ' + error.error, 'error');
        }
      });
    }
  }

  darDeBajaCliente(folioCliente: string): void {
    if (confirm('¿Estás seguro de que quieres dar de baja este cliente?')) {
      this.clienteService.darDeBajaCliente(folioCliente).subscribe({
        next: () => {
          this.mostrarMensaje('Cliente dado de baja exitosamente', 'success');
          this.cargarClientes();
        },
        error: (error) => {
          this.mostrarMensaje('Error al dar de baja el cliente: ' + error.error, 'error');
        }
      });
    }
  }

  activarCliente(folioCliente: string): void {
    this.clienteService.activarCliente(folioCliente).subscribe({
      next: () => {
        this.mostrarMensaje('Cliente activado exitosamente', 'success');
        this.cargarClientes();
      },
      error: (error) => {
        this.mostrarMensaje('Error al activar el cliente: ' + error.error, 'error');
      }
    });
  }

  // ===== MÉTODOS DE BÚSQUEDA Y FILTRADO =====
  buscarClientes(): void {
    if (this.terminoBusqueda.trim()) {
      this.cargando = true;
      this.clienteService.buscarClientes(this.terminoBusqueda).subscribe({
        next: (clientes) => {
          this.clientesFiltrados = clientes;
          this.cargando = false;
        },
        error: (error) => {
          this.mostrarMensaje('Error en la búsqueda', 'error');
          this.cargando = false;
        }
      });
    } else {
      this.aplicarFiltros();
    }
  }

  aplicarFiltros(): void {
    let clientesFiltrados = this.clientes;

    // Filtrar por nombre
    if (this.filtroNombre) {
      clientesFiltrados = clientesFiltrados.filter(cliente =>
        cliente.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase())
      );
    }

    // Filtrar por estatus
    if (this.filtroEstatus) {
      clientesFiltrados = clientesFiltrados.filter(cliente =>
        cliente.estatus === this.filtroEstatus
      );
    }

    this.clientesFiltrados = clientesFiltrados;
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroEstatus = '';
    this.terminoBusqueda = '';
    this.clientesFiltrados = this.clientes;
    this.mostrarMensaje('Filtros limpiados', 'info');
  }

  // ===== MÉTODOS DE VALIDACIÓN =====
  validarCliente(cliente: any): boolean {
    this.erroresValidacion = {};

    // Validar nombre
    if (!cliente.nombre || cliente.nombre.trim().length < 2) {
      this.erroresValidacion['nombre'] = 'El nombre es requerido y debe tener al menos 2 caracteres';
    }

    // Validar email si está presente
    if (cliente.email && !this.clienteService.validarEmail(cliente.email)) {
      this.erroresValidacion['email'] = 'El formato del email no es válido';
    }

    // Validar teléfono si está presente
    if (cliente.telefono && !this.clienteService.validarTelefono(cliente.telefono)) {
      this.erroresValidacion['telefono'] = 'El teléfono debe tener 10 dígitos';
    }

    // Validar folio (solo para creación)
    if (cliente.folioCliente && !this.validarFormatoFolio(cliente.folioCliente)) {
      this.erroresValidacion['folioCliente'] = 'El folio debe tener un formato válido (ej: CLI-001)';
    }

    return Object.keys(this.erroresValidacion).length === 0;
  }

  validarFormatoFolio(folio: string): boolean {
    const folioRegex = /^[A-Z]{3}-[0-9]{3}$/;
    return folioRegex.test(folio);
  }

  verificarFolioExistente(): void {
    if (this.nuevoCliente.folioCliente) {
      this.clienteService.verificarFolioExistente(this.nuevoCliente.folioCliente).subscribe({
        next: (existe) => {
          if (existe) {
            this.erroresValidacion['folioCliente'] = 'El folio de cliente ya existe';
          } else {
            delete this.erroresValidacion['folioCliente'];
          }
        },
        error: (error) => {
          console.error('Error al verificar folio:', error);
        }
      });
    }
  }

  verificarEmailExistente(): void {
    if (this.nuevoCliente.email) {
      this.clienteService.verificarEmailExistente(this.nuevoCliente.email).subscribe({
        next: (existe) => {
          if (existe) {
            this.erroresValidacion['email'] = 'El email ya está registrado';
          } else {
            delete this.erroresValidacion['email'];
          }
        },
        error: (error) => {
          console.error('Error al verificar email:', error);
        }
      });
    }
  }

  // ===== MÉTODOS DE NAVEGACIÓN =====
  verDetalles(cliente: Cliente): void {
    this.cargarClientePorId(cliente.folioCliente);
  }

  editarCliente(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.clienteEditado = {
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      fechaNacimiento: cliente.fechaNacimiento || '',
      genero: cliente.genero || ''
    };
    this.vistaActual = 'editar';
  }

  volverALista(): void {
    this.vistaActual = 'lista';
    this.clienteSeleccionado = null;
    this.erroresValidacion = {};
    this.nuevoCliente = this.inicializarCliente();
  }

  // ===== MÉTODOS AUXILIARES =====
  inicializarCliente(): CrearClienteRequest {
    return {
      folioCliente: '',
      nombre: '',
      telefono: '',
      email: '',
      fechaNacimiento: '',
      genero: ''
    };
  }

  inicializarClienteEditado(): ActualizarClienteRequest {
    return {
      nombre: '',
      telefono: '',
      email: '',
      fechaNacimiento: '',
      genero: ''
    };
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  // ===== MÉTODOS PARA ESTADÍSTICAS =====
  obtenerEstadisticas(): void {
    this.clienteService.obtenerEstadisticasClientes().subscribe({
      next: (estadisticas) => {
        console.log('Estadísticas de clientes:', estadisticas);
        this.mostrarMensaje(`Estadísticas: ${estadisticas.totalClientes} clientes total, ${estadisticas.clientesActivos} activos`, 'info');
      },
      error: (error) => {
        console.error('Error al obtener estadísticas:', error);
      }
    });
  }

  obtenerDistribucionGenero(): void {
    this.clienteService.obtenerDistribucionGenero().subscribe({
      next: (distribucion) => {
        console.log('Distribución por género:', distribucion);
      },
      error: (error) => {
        console.error('Error al obtener distribución:', error);
      }
    });
  }

  // ===== MÉTODOS DE EXPORTACIÓN =====
  exportarClientesCSV(): void {
    if (this.clientesFiltrados.length === 0) {
      this.mostrarMensaje('No hay clientes para exportar', 'info');
      return;
    }

    this.clienteService.descargarClientesCSV(this.clientesFiltrados, 'clientes_gym');
    this.mostrarMensaje(`Exportados ${this.clientesFiltrados.length} clientes a CSV`, 'success');
  }

  exportarTodosClientesCSV(): void {
    if (this.clientes.length === 0) {
      this.mostrarMensaje('No hay clientes para exportar', 'info');
      return;
    }

    this.clienteService.descargarClientesCSV(this.clientes, 'todos_clientes_gym');
    this.mostrarMensaje(`Exportados ${this.clientes.length} clientes a CSV`, 'success');
  }

  // ===== MÉTODOS DE UTILIDAD PARA TEMPLATE =====
  getEdad(fechaNacimiento: string): number {
    return this.clienteService.calcularEdad(fechaNacimiento);
  }

  formatearFecha(fecha: string): string {
    return this.clienteService.formatearFecha(fecha);
  }

  getTiempoRegistro(fechaRegistro: string): string {
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

  // ===== GETTERS PARA TEMPLATE =====
  get estatusOpciones(): string[] {
    return ['Activo', 'Inactivo'];
  }

  get generos(): string[] {
    return ['Masculino', 'Femenino', 'Otro'];
  }

  get totalClientes(): number {
    return this.clientesFiltrados.length;
  }

  get clientesActivos(): number {
    return this.clientesFiltrados.filter(c => c.estatus === 'Activo').length;
  }

  get clientesInactivos(): number {
    return this.clientesFiltrados.filter(c => c.estatus === 'Inactivo').length;
  }

  get porcentajeActivos(): number {
    return this.totalClientes > 0 ? (this.clientesActivos / this.totalClientes) * 100 : 0;
  }

  get clientesRecientes(): Cliente[] {
    return this.clientesFiltrados
      .sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime())
      .slice(0, 5);
  }

  // ===== MÉTODOS PARA GESTIÓN DE MEMBRESÍAS (FUTURO) =====
  asignarMembresia(folioCliente: string, idMembresia: string): void {
    // Implementar cuando tengas el servicio de membresías
    this.mostrarMensaje('Funcionalidad de membresías en desarrollo', 'info');
  }

  renovarMembresia(folioCliente: string): void {
    // Implementar cuando tengas el servicio de membresías
    this.mostrarMensaje('Funcionalidad de renovación en desarrollo', 'info');
  }

  // ===== MÉTODOS PARA GESTIÓN DE RUTINAS (INTEGRACIÓN) =====
  verRutinasCliente(folioCliente: string): void {
    // Implementar integración con el servicio de rutinas
    this.mostrarMensaje('Redirigiendo a rutinas del cliente...', 'info');
    // Aquí podrías navegar a un componente de rutinas o mostrar un modal
  }

  // ===== MÉTODOS DE LIMPIEZA =====
  ngOnDestroy(): void {
    // Limpiar cualquier suscripción si es necesario
  }

  // ===== MÉTODOS DE PRUEBA Y DESARROLLO =====
  generarClientePrueba(): void {
    const folio = `CLI-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofia'];
    const apellidos = ['Pérez', 'García', 'López', 'Martínez', 'González', 'Rodríguez'];
    
    this.nuevoCliente = {
      folioCliente: folio,
      nombre: `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`,
      telefono: `55${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `cliente${Math.floor(Math.random() * 1000)}@gmail.com`,
      fechaNacimiento: this.generarFechaNacimientoAleatoria(),
      genero: Math.random() > 0.5 ? 'Masculino' : 'Femenino'
    };
    
    this.vistaActual = 'crear';
    this.mostrarMensaje('Cliente de prueba generado. Completa y guarda.', 'info');
  }

  private generarFechaNacimientoAleatoria(): string {
    const año = 1980 + Math.floor(Math.random() * 30); // Entre 1980 y 2010
    const mes = 1 + Math.floor(Math.random() * 12);
    const dia = 1 + Math.floor(Math.random() * 28);
    return `${año}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
  }

  // ===== MÉTODOS DE ORDENAMIENTO =====
  ordenarPorNombre(): void {
    this.clientesFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  ordenarPorFechaRegistro(): void {
    this.clientesFiltrados.sort((a, b) => 
      new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()
    );
  }

  ordenarPorEstatus(): void {
    this.clientesFiltrados.sort((a, b) => a.estatus.localeCompare(b.estatus));
  }
}