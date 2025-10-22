import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente, ClienteService } from '../../../../services/cliente/ClienteService';
import { Rutina, EjercicioSimple, EjercicioRutina, RutinaService } from '../../../../services/instructor/RutinaService';


@Component({
  selector: 'app-rutina',
  templateUrl: './rutina-component.html',
  styleUrls: ['./rutina-component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    SlicePipe
  ],
  providers: [DatePipe, SlicePipe]
})

export class RutinaComponent implements OnInit {
  // Estados de la aplicación
  vistaActual: 'lista' | 'detalle' | 'crear' | 'editar' | 'ejercicios' | 'asignar' | 'ejercicios-lista' | 'ejercicio-detalle' | 'cliente-lista' = 'lista';
  cargando: boolean = false;
   rutinasActivasCount: number = 0;
  rutinasInactivasCount: number = 0;
  
  // Mensajes y alertas
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'info' | 'warning' = 'info';
  
  // Datos principales
  rutinas: Rutina[] = [];
  rutinasFiltradas: Rutina[] = [];
  rutinaSeleccionada: Rutina | null = null;
  nuevaRutina: Rutina = this.inicializarRutina();
  
  // Ejercicios
  ejercicios: EjercicioSimple[] = [];
  ejerciciosRutina: EjercicioRutina[] = [];
  ejerciciosFiltrados: EjercicioSimple[] = [];
  ejercicioDetalle: EjercicioSimple | null = null;
  
  // Clientes
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  clientesDisponibles: Cliente[] = [];
  clientesDisponiblesFiltrados: Cliente[] = [];
  clientesSeleccionados: string[] = [];
  
  // Filtros y búsquedas
  filtroNombre: string = '';
  filtroNivel: string = '';
  filtroEjercicio: string = '';
  filtroGrupoMuscular: string = '';
  filtroCliente: string = '';
  
  // Listas de opciones
  niveles: string[] = ['Principiante', 'Intermedio', 'Avanzado'];
  gruposMusculares: string[] = ['Pecho', 'Espalda', 'Hombros', 'Piernas', 'Brazos', 'Abdomen', 'Full Body'];
  
  // Estados para formularios de ejercicios
  mostrarFormularioEjercicio: boolean = false;
  editandoEjercicio: boolean = false;
  ejercicioSeleccionado: any = this.inicializarEjercicioRutina();

  constructor(
    private rutinaService: RutinaService,
     private clienteService: ClienteService,
    private datePipe: DatePipe
  ) {}

ngOnInit(): void {
  this.obtenerRutinas();
  this.obtenerEjercicios();
  
  // Opcional: precargar algunos clientes para debugging
  this.clienteService.obtenerTodosLosClientes().subscribe({
    next: (clientes) => {
      console.log('Clientes cargados:', clientes.length);
    },
    error: (error) => {
      console.error('Error cargando clientes:', error);
    }
  });
}
  // ===== MÉTODOS DE INICIALIZACIÓN =====

  inicializarRutina(): Rutina {
    return {
      folioRutina: '',
      nombre: '',
      descripcion: '',
      nivel: '',
      objetivo: '',
      duracionEstimada: 0,
      estatus: 'Activa',
      fechaCreacion: '',
      folioInstructor: ''
    };
  }

  inicializarEjercicioRutina(): any {
    return {
      idEjercicio: '',
      orden: null,
      seriesEjercicio: null,
      repeticionesEjercicio: null,
      descansoEjercicio: null,
      observaciones: ''
    };
  }

  // ===== MÉTODOS PRINCIPALES DE RUTINAS =====

  obtenerRutinas(): void {
    this.cargando = true;
    this.rutinaService.obtenerTodasLasRutinas().subscribe({
      next: (rutinas) => {
        this.rutinas = rutinas;
        this.rutinasFiltradas = rutinas;
        this.calcularEstadisticas();
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al cargar las rutinas: ' + error.message, 'error');
        this.cargando = false;
      }
    });
  }

  obtenerRutinaConEjercicios(folioRutina: string): void {
    this.cargando = true;
    this.rutinaService.obtenerRutinaConEjercicios(folioRutina).subscribe({
      next: (rutina) => {
        this.rutinaSeleccionada = rutina;
        this.ejerciciosRutina = rutina.ejercicios || [];
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al cargar la rutina: ' + error.message, 'error');
        this.cargando = false;
      }
    });
  }

  crearRutina(): void {
    if (!this.validarRutina(this.nuevaRutina)) return;

    this.cargando = true;
    this.rutinaService.crearRutina(this.nuevaRutina).subscribe({
      next: (rutinaCreada) => {
        this.mostrarMensaje('Rutina creada exitosamente', 'success');
        this.volverALista();
        this.obtenerRutinas();
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al crear la rutina: ' + error.message, 'error');
        this.cargando = false;
      }
    });
  }

  actualizarRutina(): void {
    if (!this.rutinaSeleccionada || !this.validarRutina(this.nuevaRutina)) return;

    this.cargando = true;
    this.rutinaService.actualizarRutina(this.rutinaSeleccionada.folioRutina, this.nuevaRutina).subscribe({
      next: (rutinaActualizada) => {
        this.mostrarMensaje('Rutina actualizada exitosamente', 'success');
        this.volverALista();
        this.obtenerRutinas();
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al actualizar la rutina: ' + error.message, 'error');
        this.cargando = false;
      }
    });
  }

  // ===== MÉTODOS DE ESTATUS (CORREGIDOS) =====

  cambiarEstatusRutina(rutina: Rutina, nuevoEstatus: string): void {
    const rutinaOriginal = { ...rutina };
    const estatusOriginal = rutina.estatus;
    
    // Cambio optimista - actualizar UI inmediatamente
    rutina.estatus = nuevoEstatus;
    
    this.rutinaService.cambiarEstatusRutina(rutina.folioRutina, nuevoEstatus).subscribe({
      next: (response) => {
        this.mostrarMensaje(`Rutina ${nuevoEstatus.toLowerCase()} correctamente`, 'success');
        // Recargar datos para asegurar consistencia
        this.obtenerRutinas();
      },
      error: (error) => {
        // Error - revertir el cambio optimista
        rutina.estatus = estatusOriginal;
        
        console.error('Error detallado al cambiar estatus:', error);
        this.mostrarMensaje(error.message || 'Error al cambiar el estatus de la rutina', 'error');
        
        // Forzar actualización de la vista
        this.rutinasFiltradas = [...this.rutinasFiltradas];
      }
    });
  }

  // ===== MÉTODOS DE NAVEGACIÓN =====

  verDetalles(rutina: Rutina): void {
    this.rutinaSeleccionada = rutina;
    this.obtenerEjerciciosDeRutina(rutina.folioRutina);
    this.vistaActual = 'detalle';
  }

  editarRutina(rutina: Rutina): void {
    this.rutinaSeleccionada = rutina;
    this.nuevaRutina = { ...rutina };
    this.vistaActual = 'editar';
  }

  volverALista(): void {
    this.vistaActual = 'lista';
    this.rutinaSeleccionada = null;
    this.nuevaRutina = this.inicializarRutina();
    this.mostrarFormularioEjercicio = false;
    this.editandoEjercicio = false;
    this.ejercicioSeleccionado = this.inicializarEjercicioRutina();
  }

  // ===== MÉTODOS DE EJERCICIOS =====

  obtenerEjercicios(): void {
    this.rutinaService.obtenerTodosLosEjercicios().subscribe({
      next: (ejercicios) => {
        this.ejercicios = ejercicios;
        this.ejerciciosFiltrados = ejercicios;
      },
      error: (error) => {
        console.error('Error al cargar ejercicios:', error);
      }
    });
  }

  obtenerEjerciciosDeRutina(folioRutina: string): void {
    this.rutinaService.obtenerEjerciciosDeRutina(folioRutina).subscribe({
      next: (ejercicios) => {
        this.ejerciciosRutina = ejercicios;
      },
      error: (error) => {
        console.error('Error al cargar ejercicios de la rutina:', error);
      }
    });
  }

  gestionarEjercicios(rutina: Rutina): void {
    this.rutinaSeleccionada = rutina;
    this.obtenerEjerciciosDeRutina(rutina.folioRutina);
    this.vistaActual = 'ejercicios';
  }

  abrirFormularioEjercicio(): void {
    this.mostrarFormularioEjercicio = true;
    this.editandoEjercicio = false;
    this.ejercicioSeleccionado = this.inicializarEjercicioRutina();
    
    // Establecer orden por defecto
    if (this.ejerciciosRutina.length > 0) {
      this.ejercicioSeleccionado.orden = this.ejerciciosRutina.length + 1;
    } else {
      this.ejercicioSeleccionado.orden = 1;
    }
  }

  cerrarFormularioEjercicio(): void {
    this.mostrarFormularioEjercicio = false;
    this.editandoEjercicio = false;
    this.ejercicioSeleccionado = this.inicializarEjercicioRutina();
  }

  editarEjercicio(ejercicio: EjercicioRutina): void {
    this.ejercicioSeleccionado = { ...ejercicio };
    this.editandoEjercicio = true;
    this.mostrarFormularioEjercicio = true;
  }

  agregarEjercicioARutina(): void {
    if (!this.rutinaSeleccionada || !this.ejercicioSeleccionado.idEjercicio) {
      this.mostrarMensaje('Selecciona un ejercicio', 'warning');
      return;
    }

    this.cargando = true;
    this.rutinaService.agregarEjercicioARutina(
      this.rutinaSeleccionada.folioRutina, 
      this.ejercicioSeleccionado
    ).subscribe({
      next: () => {
        this.mostrarMensaje('Ejercicio agregado a la rutina', 'success');
        this.obtenerEjerciciosDeRutina(this.rutinaSeleccionada!.folioRutina);
        this.cerrarFormularioEjercicio();
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al agregar ejercicio: ' + error.message, 'error');
        this.cargando = false;
      }
    });
  }

  actualizarEjercicioEnRutina(): void {
    if (!this.rutinaSeleccionada || !this.ejercicioSeleccionado.idEjercicio) return;

    this.cargando = true;
    const parametros = {
      series: this.ejercicioSeleccionado.seriesEjercicio,
      repeticiones: this.ejercicioSeleccionado.repeticionesEjercicio,
      descanso: this.ejercicioSeleccionado.descansoEjercicio,
      observaciones: this.ejercicioSeleccionado.observaciones
    };

    this.rutinaService.actualizarParametrosEjercicio(
      this.rutinaSeleccionada.folioRutina,
      this.ejercicioSeleccionado.idEjercicio,
      parametros
    ).subscribe({
      next: () => {
        this.mostrarMensaje('Ejercicio actualizado', 'success');
        this.obtenerEjerciciosDeRutina(this.rutinaSeleccionada!.folioRutina);
        this.cerrarFormularioEjercicio();
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al actualizar ejercicio: ' + error.message, 'error');
        this.cargando = false;
      }
    });
  }

  removerEjercicioDeRutina(idEjercicio: string): void {
    if (!this.rutinaSeleccionada || !confirm('¿Estás seguro de remover este ejercicio?')) return;

    this.cargando = true;
    this.rutinaService.removerEjercicioDeRutina(
      this.rutinaSeleccionada.folioRutina, 
      idEjercicio
    ).subscribe({
      next: () => {
        this.mostrarMensaje('Ejercicio removido de la rutina', 'success');
        this.obtenerEjerciciosDeRutina(this.rutinaSeleccionada!.folioRutina);
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al remover ejercicio: ' + error.message, 'error');
        this.cargando = false;
      }
    });
  }

  // ===== MÉTODOS DE ASIGNACIÓN A CLIENTES =====


  gestionarAsignaciones(rutina: Rutina): void {
  this.rutinaSeleccionada = rutina;
  this.clientesSeleccionados = []; // Limpiar selección
  this.obtenerClientesDeRutina(rutina.folioRutina);
  this.vistaActual = 'asignar';
}
obtenerClientesDeRutina(folioRutina: string): void {
  this.cargando = true;
  this.rutinaService.obtenerClientesActivosDeRutina(folioRutina).subscribe({
    next: (clientes) => {
      // Calcular edad para cada cliente
      this.clientes = clientes.map(cliente => ({
        ...cliente,
        edad: this.calcularEdad(cliente.fechaNacimiento)
      }));
      this.cargando = false;
      
      // Una vez cargados los clientes asignados, cargar los disponibles
      this.obtenerClientesDisponibles();
    },
    error: (error) => {
      this.mostrarMensaje('Error al cargar clientes: ' + error.message, 'error');
      this.cargando = false;
    }
  });

  }

 obtenerClientesDisponibles(): void {
  this.cargando = true;
  
  this.clienteService.obtenerClientesActivos().subscribe({
    next: (clientes) => {
      // Filtrar clientes que NO están asignados a esta rutina
      const clientesAsignadosIds = this.clientes.map(c => c.folioCliente);
      
      this.clientesDisponibles = clientes
        .filter(cliente => !clientesAsignadosIds.includes(cliente.folioCliente))
        .map(cliente => ({
          ...cliente,
          edad: this.calcularEdad(cliente.fechaNacimiento)
        }));
      
      this.clientesDisponiblesFiltrados = [...this.clientesDisponibles];
      this.cargando = false;
    },
    error: (error) => {
      console.error('Error al cargar clientes disponibles:', error);
      this.mostrarMensaje('Error al cargar clientes disponibles', 'error');
      this.cargando = false;
    }
  });
}

  seleccionarCliente(cliente: Cliente): void {
    const index = this.clientesSeleccionados.indexOf(cliente.folioCliente);
    if (index > -1) {
      this.clientesSeleccionados.splice(index, 1);
    } else {
      this.clientesSeleccionados.push(cliente.folioCliente);
    }
  }
calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  
  try {
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
  } catch (error) {
    console.error('Error calculando edad:', error);
    return 0;
  }
}
  estaClienteSeleccionado(cliente: Cliente): boolean {
    return this.clientesSeleccionados.includes(cliente.folioCliente);
  }

  asignarRutinaAClientes(): void {
    if (!this.rutinaSeleccionada || this.clientesSeleccionados.length === 0) return;

    this.cargando = true;
    this.rutinaService.asignarRutinaAMultiplesClientes(
      this.rutinaSeleccionada.folioRutina,
      this.clientesSeleccionados
    ).subscribe({
      next: (response) => {
        this.mostrarMensaje('Rutina asignada a clientes exitosamente', 'success');
        this.clientesSeleccionados = [];
        this.obtenerClientesDeRutina(this.rutinaSeleccionada!.folioRutina);
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al asignar rutina: ' + error.message, 'error');
        this.cargando = false;
      }
    });
  }

  removerAsignacionCliente(cliente: Cliente): void {
    if (!this.rutinaSeleccionada || !confirm('¿Estás seguro de remover esta asignación?')) return;

    this.cargando = true;
    this.rutinaService.removerAsignacionRutina(
      this.rutinaSeleccionada.folioRutina,
      cliente.folioCliente
    ).subscribe({
      next: () => {
        this.mostrarMensaje('Asignación removida exitosamente', 'success');
        this.obtenerClientesDeRutina(this.rutinaSeleccionada!.folioRutina);
        this.cargando = false;
      },
      error: (error) => {
        this.mostrarMensaje('Error al remover asignación: ' + error.message, 'error');
        this.cargando = false;
      }
    });
  }

  // ===== MÉTODOS DE BÚSQUEDA Y FILTRADO =====

  buscarRutinas(): void {
    if (!this.filtroNombre) {
      this.rutinasFiltradas = this.rutinas;
      return;
    }

    this.rutinasFiltradas = this.rutinas.filter(rutina =>
      rutina.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase())
    );
  }

  filtrarRutinasPorNivel(): void {
    if (!this.filtroNivel) {
      this.rutinasFiltradas = this.rutinas;
      return;
    }

    this.rutinasFiltradas = this.rutinas.filter(rutina =>
      rutina.nivel === this.filtroNivel
    );
  }

  filtrarEjercicios(): void {
    let ejerciciosFiltrados = this.ejercicios;

    if (this.filtroEjercicio) {
      ejerciciosFiltrados = ejerciciosFiltrados.filter(ejercicio =>
        ejercicio.nombre.toLowerCase().includes(this.filtroEjercicio.toLowerCase())
      );
    }

    if (this.filtroGrupoMuscular) {
      ejerciciosFiltrados = ejerciciosFiltrados.filter(ejercicio =>
        ejercicio.grupoMuscular === this.filtroGrupoMuscular
      );
    }

    this.ejerciciosFiltrados = ejerciciosFiltrados;
  }

  filtrarClientesDisponibles(): void {
    if (!this.filtroCliente) {
      this.clientesDisponiblesFiltrados = this.clientesDisponibles;
      return;
    }

    this.clientesDisponiblesFiltrados = this.clientesDisponibles.filter(cliente =>
      cliente.nombre.toLowerCase().includes(this.filtroCliente.toLowerCase())
    );
  }

  // ===== MÉTODOS DE UTILIDAD =====

  getEjercicioPorId(idEjercicio: string): EjercicioSimple | undefined {
    return this.ejercicios.find(e => e.idEjercicio === idEjercicio);
  }

  formatearDuracion(minutos: number): string {
    if (!minutos) return 'No especificada';
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    if (horas > 0) {
      return `${horas}h ${mins}min`;
    } else {
      return `${mins} min`;
    }
  }

  calcularTiempoTotal(): number {
    return this.ejerciciosRutina.reduce((total, ejercicio) => {
      const tiempoEjercicio = ejercicio.tiempo || 
        (ejercicio.seriesEjercicio * ejercicio.repeticionesEjercicio * 4) + 
        ((ejercicio.seriesEjercicio - 1) * ejercicio.descansoEjercicio);
      return total + (tiempoEjercicio || 0);
    }, 0);
  }

  calcularEstadisticas(): void {
  this.rutinasActivasCount = this.rutinas.filter(r => r.estatus === 'Activa').length;
  this.rutinasInactivasCount = this.rutinas.filter(r => r.estatus === 'Inactiva').length;

    
  }

  validarRutina(rutina: Rutina): boolean {
    if (!rutina.nombre || !rutina.nivel || !rutina.objetivo || !rutina.duracionEstimada) {
      this.mostrarMensaje('Completa todos los campos requeridos', 'warning');
      return false;
    }
    return true;
  }

  // ===== MÉTODOS DE VISTAS ADICIONALES =====

  verTodosLosEjercicios(): void {
    this.vistaActual = 'ejercicios-lista';
  }

  verDetalleEjercicio(ejercicio: EjercicioSimple): void {
    this.ejercicioDetalle = ejercicio;
    this.vistaActual = 'ejercicio-detalle';
  }

verTodosLosClientes(): void {
  this.vistaActual = 'cliente-lista';
  this.cargarTodosLosClientes();
}
cargarTodosLosClientes(): void {
  this.cargando = true;
  
  this.clienteService.obtenerTodosLosClientes().subscribe({
    next: (clientes) => {
      // Calcular edad para cada cliente y asignar a clientesFiltrados
      this.clientesFiltrados = clientes.map(cliente => ({
        ...cliente,
        edad: this.calcularEdad(cliente.fechaNacimiento)
      }));
      this.cargando = false;
      console.log('Clientes cargados para vista lista:', this.clientesFiltrados.length);
    },
    error: (error) => {
      console.error('Error al cargar todos los clientes:', error);
      this.mostrarMensaje('Error al cargar los clientes: ' + error.message, 'error');
      this.cargando = false;
    }
  });
}

filtrarClientesEnLista(): void {
  if (!this.filtroCliente) {
    this.clientesFiltrados = [...this.clientesFiltrados];
    return;
  }

  const termino = this.filtroCliente.toLowerCase();
  this.clientesFiltrados = this.clientesFiltrados.filter(cliente =>
    cliente.nombre.toLowerCase().includes(termino) ||
    cliente.email?.toLowerCase().includes(termino) ||
    cliente.telefono?.includes(termino)
  );
}
  // ===== MÉTODOS DE INTERFAZ =====

  moverEjercicioArriba(index: number): void {
    if (index <= 0) return;

    const ejercicios = [...this.ejerciciosRutina];
    [ejercicios[index], ejercicios[index - 1]] = [ejercicios[index - 1], ejercicios[index]];
    
    // Actualizar órdenes
    ejercicios.forEach((ej, i) => ej.orden = i + 1);
    this.ejerciciosRutina = ejercicios;
    
    // En una implementación real, aquí guardarías el nuevo orden
  }

  moverEjercicioAbajo(index: number): void {
    if (index >= this.ejerciciosRutina.length - 1) return;

    const ejercicios = [...this.ejerciciosRutina];
    [ejercicios[index], ejercicios[index + 1]] = [ejercicios[index + 1], ejercicios[index]];
    
    // Actualizar órdenes
    ejercicios.forEach((ej, i) => ej.orden = i + 1);
    this.ejerciciosRutina = ejercicios;
    
    // En una implementación real, aquí guardarías el nuevo orden
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  // Método auxiliar para formatear fechas
  formatearFecha(fecha: string): string {
    return this.datePipe.transform(fecha, 'dd/MM/yyyy') || 'Fecha inválida';
  }
}