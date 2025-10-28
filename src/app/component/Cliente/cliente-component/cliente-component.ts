import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente, CrearClienteRequest, ActualizarClienteRequest, ClienteService } from '../../../services/cliente/ClienteService';
import { HeaderAdministradorComponent } from '../../Administrador/header-admin/header-admin';

@Component({
  selector: 'app-cliente-component',
  imports: [CommonModule, FormsModule, HeaderAdministradorComponent],
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
  
  // Campos específicos para usuario
  emailUsuario: string = '';
  usernameSugerido: string = '';
  
  // Archivos
  fotoSeleccionada: File | null = null;
  vistaPreviaFoto: string | ArrayBuffer | null = null;
  eliminarFotoExistente: boolean = false;
  
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
    if (!this.validarClienteParaCreacion()) return;

    this.cargando = true;
    
    // Crear FormData para enviar archivos
    const formData = new FormData();
    formData.append('nombre', this.nuevoCliente.nombre);
    formData.append('telefono', this.nuevoCliente.telefono || '');
    formData.append('email', this.emailUsuario);
    formData.append('fechaNacimiento', this.nuevoCliente.fechaNacimiento || '');
    formData.append('genero', this.nuevoCliente.genero || '');
    formData.append('estatus', this.nuevoCliente.estatus || 'Activo');
    
    if (this.fotoSeleccionada) {
      formData.append('foto', this.fotoSeleccionada);
    }

    this.clienteService.crearClienteConFoto(formData).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.mostrarMensaje('Cliente creado exitosamente. Se han enviado las credenciales al email: ' + this.emailUsuario, 'success');
          this.cargarClientes();
          this.vistaActual = 'lista';
          this.limpiarFormularioCreacion();
        } else {
          this.mostrarMensaje('Error: ' + response.message, 'error');
        }
        this.cargando = false;
      },
      error: (error: any) => {
        this.mostrarMensaje('Error al crear el cliente: ' + this.obtenerMensajeError(error), 'error');
        this.cargando = false;
      }
    });
  }

  actualizarCliente(): void {
  if (!this.clienteSeleccionado) return;

  if (!this.validarClienteParaEdicion()) return;

  this.cargando = true;
  
  const formData = new FormData();
  formData.append('nombre', this.clienteEditado.nombre || '');
  formData.append('telefono', this.clienteEditado.telefono || '');
  formData.append('fechaNacimiento', this.clienteEditado.fechaNacimiento || '');
  formData.append('genero', this.clienteEditado.genero || '');
  formData.append('estatus', this.clienteEditado.estatus || 'Activo');
  formData.append('eliminarFoto', this.eliminarFotoExistente.toString());
  
  if (this.emailUsuario && this.emailUsuario !== this.clienteSeleccionado.email) {
    formData.append('email', this.emailUsuario);
  }
  
  if (this.fotoSeleccionada) {
    formData.append('foto', this.fotoSeleccionada);
  }

  this.clienteService.actualizarClienteConFoto(this.clienteSeleccionado.folioCliente, formData).subscribe({
    next: (response: any) => {
      if (response.success) {
        this.mostrarMensaje('Cliente actualizado exitosamente', 'success');
        this.cargarClientes();
        this.vistaActual = 'detalle';
        this.limpiarFormularioEdicion();
      } else {
        this.mostrarMensaje('Error: ' + response.message, 'error');
      }
      this.cargando = false;
    },
    error: (error: any) => {
      this.mostrarMensaje('Error al actualizar el cliente: ' + this.obtenerMensajeError(error), 'error');
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

  // En el método darDeBajaCliente
darDeBajaCliente(folioCliente: string): void {
  if (confirm('¿Estás seguro de que quieres dar de baja este cliente?')) {
    this.clienteService.darDeBajaCliente(folioCliente).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.mostrarMensaje('Cliente dado de baja exitosamente', 'success');
          this.cargarClientes();
        } else {
          this.mostrarMensaje('Error: ' + response.message, 'error');
        }
      },
      error: (error) => {
        this.mostrarMensaje('Error al dar de baja el cliente: ' + this.obtenerMensajeError(error), 'error');
      }
    });
  }
}

  // En el método activarCliente
activarCliente(folioCliente: string): void {
  this.clienteService.activarCliente(folioCliente).subscribe({
    next: (response: any) => {
      if (response.success) {
        this.mostrarMensaje('Cliente activado exitosamente', 'success');
        this.cargarClientes();
      } else {
        this.mostrarMensaje('Error: ' + response.message, 'error');
      }
    },
    error: (error) => {
      this.mostrarMensaje('Error al activar el cliente: ' + this.obtenerMensajeError(error), 'error');
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

  // ===== MÉTODOS DE VALIDACIÓN ESPECÍFICOS =====
  validarClienteParaCreacion(): boolean {
    this.erroresValidacion = {};

    // Validar nombre (obligatorio)
    if (!this.nuevoCliente.nombre || this.nuevoCliente.nombre.trim().length < 2) {
      this.erroresValidacion['nombre'] = 'El nombre es requerido y debe tener al menos 2 caracteres';
    }

    // Validar email (obligatorio para crear usuario)
    if (!this.emailUsuario || this.emailUsuario.trim() === '') {
      this.erroresValidacion['emailUsuario'] = 'El email es obligatorio para crear las credenciales de acceso';
    } else if (!this.validarEmail(this.emailUsuario)) {
      this.erroresValidacion['emailUsuario'] = 'El formato del email no es válido';
    }

    // Validar teléfono si está presente
    if (this.nuevoCliente.telefono && !this.validarTelefono(this.nuevoCliente.telefono)) {
      this.erroresValidacion['telefono'] = 'El teléfono debe tener 10 dígitos';
    }

    return Object.keys(this.erroresValidacion).length === 0;
  }

  validarClienteParaEdicion(): boolean {
    this.erroresValidacion = {};

    // Validar nombre (obligatorio)
    if (!this.clienteEditado.nombre || this.clienteEditado.nombre.trim().length < 2) {
      this.erroresValidacion['nombre'] = 'El nombre es requerido y debe tener al menos 2 caracteres';
    }

    // Validar email si se está cambiando
    if (this.emailUsuario && this.emailUsuario !== this.clienteSeleccionado?.email) {
      if (!this.validarEmail(this.emailUsuario)) {
        this.erroresValidacion['emailUsuario'] = 'El formato del email no es válido';
      }
    }

    // Validar teléfono si está presente
    if (this.clienteEditado.telefono && !this.validarTelefono(this.clienteEditado.telefono)) {
      this.erroresValidacion['telefono'] = 'El teléfono debe tener 10 dígitos';
    }

    return Object.keys(this.erroresValidacion).length === 0;
  }

  // ===== MÉTODOS PARA GENERAR USERNAME =====
  generarUsernameDesdeEmail(): void {
    if (this.emailUsuario && this.validarEmail(this.emailUsuario)) {
      // Extraer la parte antes del @ del email
      const usernameBase = this.emailUsuario.split('@')[0];
      this.usernameSugerido = usernameBase.toLowerCase();
      
      // Verificar disponibilidad del username
      this.verificarDisponibilidadUsername(this.usernameSugerido);
    }
  }

  generarUsernameDesdeNombre(): void {
    if (this.nuevoCliente.nombre) {
      const nombreLimpio = this.nuevoCliente.nombre
        .toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '');
      this.usernameSugerido = nombreLimpio;
      
      // Verificar disponibilidad
      this.verificarDisponibilidadUsername(this.usernameSugerido);
    }
  }

  verificarDisponibilidadUsername(username: string): void {
    this.clienteService.verificarDisponibilidadUsername(username).subscribe({
      next: (response: any) => {
        if (!response.disponible) {
          this.erroresValidacion['username'] = 'El username no está disponible. Se generará uno único automáticamente.';
        } else {
          delete this.erroresValidacion['username'];
        }
      },
      error: (error: any) => {
        console.error('Error al verificar username:', error);
      }
    });
  }

  // ===== MÉTODOS PARA MANEJO DE ARCHIVOS =====
  onFotoSeleccionada(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      // Validar tipo de archivo
      if (!this.validarTipoArchivo(archivo)) {
        this.mostrarMensaje('Solo se permiten imágenes (JPG, PNG, GIF, WebP)', 'error');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (archivo.size > 5 * 1024 * 1024) {
        this.mostrarMensaje('La imagen no debe superar los 5MB', 'error');
        return;
      }

      this.fotoSeleccionada = archivo;

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = (e) => {
        this.vistaPreviaFoto = e.target?.result || null;
      };
      reader.readAsDataURL(archivo);
    }
  }

  eliminarFotoSeleccionada(): void {
    this.fotoSeleccionada = null;
    this.vistaPreviaFoto = null;
    
    // Si estamos en edición, marcar para eliminar la foto existente
    if (this.vistaActual === 'editar') {
      this.eliminarFotoExistente = true;
    }
  }

  validarTipoArchivo(archivo: File): boolean {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return tiposPermitidos.includes(archivo.type);
  }

  // ===== MÉTODOS DE UTILIDAD =====
  validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validarTelefono(telefono: string): boolean {
    const telefonoRegex = /^\d{10}$/;
    return telefonoRegex.test(telefono);
  }

  obtenerMensajeError(error: any): string {
    if (error.error && error.error.message) {
      return error.error.message;
    }
    return error.message || 'Error desconocido';
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
      fechaNacimiento: cliente.fechaNacimiento || '',
      genero: cliente.genero || '',
      estatus: cliente.estatus || 'Activo'
    };
    this.emailUsuario = cliente.email || '';
    this.vistaActual = 'editar';
  }

  volverALista(): void {
    this.vistaActual = 'lista';
    this.clienteSeleccionado = null;
    this.erroresValidacion = {};
    this.limpiarFormularioCreacion();
  }

  // ===== MÉTODOS DE LIMPIEZA =====
  limpiarFormularioCreacion(): void {
    this.nuevoCliente = this.inicializarCliente();
    this.emailUsuario = '';
    this.usernameSugerido = '';
    this.fotoSeleccionada = null;
    this.vistaPreviaFoto = null;
    this.erroresValidacion = {};
  }

  limpiarFormularioEdicion(): void {
    this.clienteEditado = this.inicializarClienteEditado();
    this.emailUsuario = '';
    this.fotoSeleccionada = null;
    this.vistaPreviaFoto = null;
    this.eliminarFotoExistente = false;
    this.erroresValidacion = {};
  }

  inicializarCliente(): CrearClienteRequest {
    return {
      nombre: '',
      telefono: '',
      fechaNacimiento: '',
      genero: '',
      estatus: 'Activo'
    };
  }

  inicializarClienteEditado(): ActualizarClienteRequest {
    return {
      nombre: '',
      telefono: '',
      fechaNacimiento: '',
      genero: '',
      estatus: 'Activo'
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
    this.mostrarMensaje('Funcionalidad de membresías en desarrollo', 'info');
  }

  renovarMembresia(folioCliente: string): void {
    this.mostrarMensaje('Funcionalidad de renovación en desarrollo', 'info');
  }

  // ===== MÉTODOS PARA GESTIÓN DE RUTINAS (INTEGRACIÓN) =====
  verRutinasCliente(folioCliente: string): void {
    this.mostrarMensaje('Redirigiendo a rutinas del cliente...', 'info');
  }

  // ===== MÉTODOS DE PRUEBA Y DESARROLLO =====
  generarClientePrueba(): void {
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofia'];
    const apellidos = ['Pérez', 'García', 'López', 'Martínez', 'González', 'Rodríguez'];
    
    this.nuevoCliente = {
      nombre: `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`,
      telefono: `55${Math.floor(10000000 + Math.random() * 90000000)}`,
      fechaNacimiento: this.generarFechaNacimientoAleatoria(),
      genero: Math.random() > 0.5 ? 'Masculino' : 'Femenino',
      estatus: 'Activo'
    };

    this.emailUsuario = `cliente${Math.floor(Math.random() * 1000)}@gmail.com`;
    
    this.vistaActual = 'crear';
    this.mostrarMensaje('Cliente de prueba generado. Completa y guarda.', 'info');
  }

  private generarFechaNacimientoAleatoria(): string {
    const año = 1980 + Math.floor(Math.random() * 30);
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

  // ===== MÉTODOS DE LIMPIEZA =====
  ngOnDestroy(): void {
    // Limpiar cualquier suscripción si es necesario
  }
}