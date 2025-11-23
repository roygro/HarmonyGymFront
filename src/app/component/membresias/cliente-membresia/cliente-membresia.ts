import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HeaderRecepcionistaComponent } from '../../recepcionista/header-recepcionista/header-recepcionista';
import { Chart, registerables } from 'chart.js';
import { PlanPago, ClienteMembresia, ClienteMembresiaService } from '../../../services/membresia/cliente-membresia';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

export interface ClienteMembresiaBackend {
  idMembresiaCliente: number;
  cliente: {
    folioCliente: string;
    nombre: string;
    telefono: string;
    email: string;
    fechaNacimiento: string;
  };
  membresia: {
    idMembresia: string;
    tipo: string;
    precio: number;
    duracion: number;
    descripcion: string;
  };
  fechaInicio: string;
  fechaFin: string;
  fechaRegistro: string;
  fechaActualizacion: string | null;
  estatus: string;
  vigente: boolean;
  expirada: boolean;  
  planPago?: PlanPago; // ✅ NUEVO: Incluir plan de pago
}

@Component({
  selector: 'app-cliente-membresia',
  imports: [CommonModule, FormsModule, HeaderRecepcionistaComponent],
  templateUrl: './cliente-membresia.html',
  styleUrl: './cliente-membresia.css'
})
export class ClienteMembresiaComponent implements OnInit, AfterViewInit, OnDestroy {
  membresias: ClienteMembresia[] = [];
  membresiasFiltradas: ClienteMembresia[] = [];
  filtro: string = '';
  loading: boolean = false;
  showAsignarDialog: boolean = false;
  
  // ✅ MODIFICADO: Actualizar asignarFormData para incluir plan de pago
  asignarFormData = {
    folioCliente: '',
    idMembresia: '',
    idPlanPago: null as number | null, // ✅ NUEVO: Campo para plan de pago
    fechaInicio: new Date().toISOString().split('T')[0]
  };

  // Lista inicial vacía - se llenará con datos reales
  tipoMembresias: any[] = [];

  // ✅ NUEVO: Propiedades para planes de pago
  planesPago: PlanPago[] = [];
  planesConDescuento: PlanPago[] = [];
  loadingPlanes: boolean = false;

  // Snackbar
  snackbar = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'warning'
  };

  // Historial
  showHistorialModal: boolean = false;
  historialData: any[] = [];
  clienteHistorial: string = '';
  loadingHistorial: boolean = false;

  // Propiedades para los nombres
  clientes: any[] = [];
  recepcionistas: any[] = [];
  productos: any[] = [];

  // Propiedades para gráficos
  private distribucionChart: Chart | null = null;
  private estadoChart: Chart | null = null;
  tiposMembresiaDisponibles: string[] = ['Básica', 'Premium', 'VIP'];
Math: any;

  constructor(
    private clienteMembresiaService: ClienteMembresiaService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.verificarMembresiasDisponibles();
    this.cargarPlanesPagoDisponibles(); // ✅ NUEVO: Cargar planes de pago
    this.cargarTodasLasMembresias();
    this.cargarNombres();
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  ngOnDestroy(): void {
    // Limpiar gráficos cuando el componente se destruya
    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }
    if (this.estadoChart) {
      this.estadoChart.destroy();
    }
  }

  // ✅ NUEVO: Método para cargar planes de pago
  cargarPlanesPagoDisponibles(): void {
    this.loadingPlanes = true;
    this.clienteMembresiaService.obtenerPlanesPagoDisponibles().subscribe({
      next: (planes: PlanPago[]) => {
        this.planesPago = planes;
        
        // Establecer el primer plan como valor por defecto si existe
        if (this.planesPago.length > 0) {
          this.asignarFormData.idPlanPago = this.planesPago[0].id;
        }
        
        this.loadingPlanes = false;
      },
      error: (error: any) => {
        this.mostrarSnackbar('Error al cargar planes de pago disponibles', 'error');
        this.loadingPlanes = false;
      }
    });
  }

// ✅ NUEVO: Método para obtener el factor de descuento
obtenerFactorDescuento(planId: number | null): number {
  if (!planId) return 1;
  
  const plan = this.planesPago.find(p => p.id === planId);
  return plan ? plan.factorDescuento : 1;
}

calcularPorcentajeDescuentoMembresia(planPago: PlanPago): number {
  if (!planPago || !planPago.factorDescuento) return 0;
  return Math.round((1 - planPago.factorDescuento) * 100);
}

  // ✅ NUEVO: Método para formatear la información del plan
  formatearInfoPlan(plan: PlanPago): string {
    const descuento = Math.round((1 - plan.factorDescuento) * 100);
    const duracion = plan.duracionDias;
    
    if (descuento === 0) {
      return `${plan.nombre} - ${duracion} días (Sin descuento)`;
    } else {
      return `${plan.nombre} - ${duracion} días (${descuento}% descuento)`;
    }
  }

  // NUEVO: Precio con descuento
 calcularPrecioConDescuento(precioBase: number, planPagoId: number | null): number {
 
  
  if (!planPagoId) {
    return precioBase;
  }
  
  const plan = this.obtenerPlanPagoPorId(planPagoId);
  
  if (!plan) {
    return precioBase;
  }
  

  // Validar que factorDescuento es un número válido
  if (typeof plan.factorDescuento !== 'number' || isNaN(plan.factorDescuento)) {
    return precioBase;
  }
  
  // Calcular precio mensual con descuento
  const precioMensualConDescuento = precioBase * plan.factorDescuento;
  
  // Calcular duración en meses (aproximadamente)
  const duracionMeses = Math.ceil(plan.duracionDias / 30);
  
  // Calcular precio TOTAL del plan
  const precioTotal = precioMensualConDescuento * duracionMeses;
  
 
  
  return precioTotal;
}


// ✅ NUEVO: Método para obtener duración en meses
obtenerDuracionMeses(planPagoId: number | null): number {
  if (!planPagoId) return 1;
  
  const plan = this.obtenerPlanPagoPorId(planPagoId);
  if (!plan || !plan.duracionDias) return 1;
  
  return Math.ceil(plan.duracionDias / 30);
}

// ✅ NUEVO: Método para obtener duración formateada
obtenerDuracionFormateada(planPagoId: number | null): string {
  const meses = this.obtenerDuracionMeses(planPagoId);
  
  if (meses === 1) {
    return '1 mes';
  } else if (meses === 12) {
    return '1 año';
  } else {
    return `${meses} meses`;
  }
}


  // ✅ NUEVO: Método para obtener precio base de membresía
  obtenerPrecioBaseMembresia(idMembresia: string): number {
    const membresia = this.tipoMembresias.find(m => m.value === idMembresia);
    return membresia?.precio || 0;
  }

  // ✅ NUEVO: Método cuando cambia la membresía seleccionada
  onMembresiaChange(): void {
    
  }

  // ✅ NUEVO: Método cuando cambia el plan de pago
  onPlanPagoChange(): void {
   
    
    const planSeleccionado = this.planesPago.find(p => p.id === this.asignarFormData.idPlanPago);
    if (planSeleccionado) {
   
    }
  }

  // ✅ NUEVO: Método para obtener información del plan seleccionado
  getPlanSeleccionado(): PlanPago | null {
    if (!this.asignarFormData.idPlanPago) return null;
    return this.planesPago.find(p => p.id === this.asignarFormData.idPlanPago) || null;
  }

  // Método para cargar los nombres
  cargarNombres(): void {
    this.http.get('http://localhost:8081/api/clientes').subscribe({
      next: (clientes: any) => {
        this.clientes = clientes;
      },
      error: (error: any) => {
        console.error('Error al cargar clientes:', error);
      }
    });

    this.http.get('http://localhost:8081/api/recepcionistas').subscribe({
      next: (recepcionistas: any) => {
        this.recepcionistas = recepcionistas;
      },
      error: (error: any) => {
        console.error('Error al cargar recepcionistas:', error);
      }
    });

    this.http.get('http://localhost:8081/api/productos').subscribe({
      next: (productos: any) => {
        this.productos = productos;
      },
      error: (error: any) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  // Métodos para obtener nombres
  obtenerNombreCliente(folio: string): string {
    const cliente = this.clientes.find((c: any) => c.folioCliente === folio);
    return cliente ? cliente.nombre : folio;
  }

  obtenerNombreRecepcionista(id: string): string {
    const recepcionista = this.recepcionistas.find((r: any) => r.idRecepcionista === id);
    return recepcionista ? recepcionista.nombre : id;
  }

  obtenerNombreProducto(codigo: string): string {
    const producto = this.productos.find((p: any) => p.codigo === codigo);
    return producto ? producto.nombre : codigo;
  }

  // NUEVO MÉTODO: Verificar membresías disponibles en el backend
  verificarMembresiasDisponibles(): void {
    
    this.http.get('http://localhost:8081/api/membresias').subscribe({
      next: (membresias: any) => {

      
        if (membresias && Array.isArray(membresias) && membresias.length > 0) {
          // Mapear las membresías reales del backend incluyendo precio
          this.tipoMembresias = membresias.map((memb: any) => ({
            value: memb.id_membresia || memb.idMembresia,
            label: memb.tipo || memb.descripcion || memb.id_membresia,
            precio: memb.precio || 0 // ✅ NUEVO: Incluir precio
          }));
          
          
          // Establecer el primer tipo como valor por defecto
          if (this.tipoMembresias.length > 0) {
            this.asignarFormData.idMembresia = this.tipoMembresias[0].value;
          }
          
          this.mostrarSnackbar(`${this.tipoMembresias.length} tipos de membresía cargados`, 'success');
        } else {
          this.tipoMembresias = [];
          this.mostrarSnackbar('No hay tipos de membresía configurados en el sistema', 'warning');
        }
      },
      error: (error) => {
        this.tipoMembresias = [];
        this.mostrarSnackbar('Error al cargar tipos de membresía disponibles', 'error');
      }
    });
  }

  // NUEVO MÉTODO: Crear membresías de prueba si no existen
  crearMembresiasDePrueba(): void {
    
    const membresiasPrueba = [
      {
        id_membresia: 'MEM001',
        tipo: 'Básica',
        precio: 299.00,
        duracion: 30,
        descripcion: 'Membresía básica con acceso a área de pesas y cardio',
        beneficios: 'Acceso a área de pesas, zona cardio, lockers'
      },
      {
        id_membresia: 'MEM002', 
        tipo: 'Premium',
        precio: 499.00,
        duracion: 30,
        descripcion: 'Membresía premium con acceso a todas las áreas',
        beneficios: 'Acceso a todas las áreas, clases grupales, asesoría nutricional'
      },
      {
        id_membresia: 'MEM003',
        tipo: 'VIP',
        precio: 799.00,
        duracion: 30,
        descripcion: 'Membresía VIP con beneficios exclusivos',
        beneficios: 'Todos los beneficios premium + entrenador personal, estacionamiento VIP'
      }
    ];

    let creadas = 0;
    const total = membresiasPrueba.length;

    // Enviar cada membresía al backend
    membresiasPrueba.forEach(membresia => {
      this.http.post('http://localhost:8081/api/membresias', membresia).subscribe({
        next: (response) => {
          creadas++;
          
          if (creadas === total) {
            this.mostrarSnackbar('Membresías de prueba creadas exitosamente', 'success');
            // Recargar la lista de membresías disponibles
            setTimeout(() => {
              this.verificarMembresiasDisponibles();
            }, 1000);
          }
        },
        error: (error) => {
          console.error(`Error al crear membresía ${membresia.tipo}:`, error);
          creadas++;
          
          if (creadas === total) {
            this.mostrarSnackbar('Algunas membresías no se pudieron crear', 'warning');
            this.verificarMembresiasDisponibles();
          }
        }
      });
    });
  }

  cargarTodasLasMembresias(): void {
  this.loading = true;
  
  this.clienteMembresiaService.obtenerTodasMembresias().subscribe({
    next: (data: any) => {
      
      if (data && Array.isArray(data)) {
        // Si viene directamente como array
        this.membresias = data.map((item: any) => this.mapearMembresiaBackend(item));
      } else if (data && data.membresias && Array.isArray(data.membresias)) {
        // Si viene dentro de un objeto con propiedad 'membresias'
        this.membresias = data.membresias.map((item: any) => this.mapearMembresiaBackend(item));
      } else {
        console.warn('Formato de respuesta inesperado:', data);
        this.membresias = [];
      }
      
      this.membresiasFiltradas = [...this.membresias];
      this.loading = false;
      
      // Crear gráficos después de cargar los datos
      setTimeout(() => {
        this.crearGraficoDistribucion();
        this.crearGraficoEstado();
      }, 100);
    },
    error: (error: any) => {
      console.error('Error al cargar todas las membresías:', error);
      
      // Si falla, intentar con el método de activas como respaldo
      this.mostrarSnackbar('No se pudieron cargar todas las membresías. Cargando solo activas...', 'warning');
      this.cargarMembresiasActivasComoRespaldo();
    }
  });
}

// Método de respaldo que usa solo las activas
cargarMembresiasActivasComoRespaldo(): void {
  this.clienteMembresiaService.obtenerMembresiasActivas().subscribe({
    next: (data: any) => {
      
      if (data && Array.isArray(data)) {
        this.membresias = data.map((item: any) => this.mapearMembresiaBackend(item));
      } else if (data && data.membresias && Array.isArray(data.membresias)) {
        this.membresias = data.membresias.map((item: any) => this.mapearMembresiaBackend(item));
      } else {
        this.membresias = [];
      }
      
      this.membresiasFiltradas = [...this.membresias];
      this.loading = false;
      
      setTimeout(() => {
        this.crearGraficoDistribucion();
        this.crearGraficoEstado();
      }, 100);
    },
    error: (error: any) => {
      console.error('Error al cargar membresías activas:', error);
      this.mostrarSnackbar('Error al cargar las membresías', 'error');
      this.membresias = [];
      this.membresiasFiltradas = [];
      this.loading = false;
    }
  });
}

  private mapearMembresiaBackend(backendData: any): ClienteMembresia {
    
    return {
      id_membresia_cliente: backendData.idMembresiaCliente || backendData.id_membresia_cliente,
      folio_cliente: backendData.cliente?.folioCliente || backendData.folio_cliente || 'Desconocido',
      id_membresia: backendData.membresia?.idMembresia || backendData.id_membresia || 'Desconocida',
      fecha_inicio: backendData.fechaInicio || backendData.fecha_inicio || '',
      fecha_fin: backendData.fechaFin || backendData.fecha_fin || '',
      estatus: backendData.estatus || 'Desconocido',
      fecha_registro: backendData.fechaRegistro || backendData.fecha_registro || '',
      fecha_actualizacion: backendData.fechaActualizacion || backendData.fecha_actualizacion || '',
      planPago: backendData.planPago // ✅ NUEVO: Incluir plan de pago
    };
  }

  aplicarFiltro(): void {
    if (!Array.isArray(this.membresias)) {
      this.membresiasFiltradas = [];
      return;
    }

    if (!this.filtro) {
      this.membresiasFiltradas = [...this.membresias];
      return;
    }

    const filtroLower = this.filtro.toLowerCase();
    this.membresiasFiltradas = this.membresias.filter(membresia => {
      const nombreCliente = this.obtenerNombreCliente(membresia.folio_cliente).toLowerCase();
      const nombreMembresia = this.obtenerEtiquetaMembresia(membresia.id_membresia).toLowerCase();
      
      return (
        (nombreCliente && nombreCliente.includes(filtroLower)) ||
        (nombreMembresia && nombreMembresia.includes(filtroLower)) ||
        (membresia.estatus && membresia.estatus.toLowerCase().includes(filtroLower)) ||
        (membresia.folio_cliente && membresia.folio_cliente.toLowerCase().includes(filtroLower))
      );
    });
  }

  limpiarFiltro(): void {
    this.filtro = '';
    if (Array.isArray(this.membresias)) {
      this.membresiasFiltradas = [...this.membresias];
    } else {
      this.membresiasFiltradas = [];
    }
  }

  abrirDialogoAsignar(): void {
    // Verificar si hay tipos de membresía disponibles antes de abrir el diálogo
    if (this.tipoMembresias.length === 0) {
      this.mostrarSnackbar('No hay tipos de membresía disponibles. Configure membresías primero.', 'error');
      return;
    }

    this.asignarFormData = {
      folioCliente: '',
      idMembresia: this.tipoMembresias.length > 0 ? this.tipoMembresias[0].value : '',
      idPlanPago: this.planesPago.length > 0 ? this.planesPago[0].id : null, // ✅ NUEVO: Incluir plan por defecto
      fechaInicio: new Date().toISOString().split('T')[0]
    };
    this.showAsignarDialog = true;
  }

  // ✅ MODIFICADO: Método asignarMembresia para incluir plan de pago
  asignarMembresia(): void {
    // Validación adicional
    if (!this.asignarFormData.folioCliente || !this.asignarFormData.idMembresia || !this.asignarFormData.idPlanPago) {
      this.mostrarSnackbar('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    this.loading = true;

    this.clienteMembresiaService.asignarMembresia(
      this.asignarFormData.folioCliente,
      this.asignarFormData.idMembresia,
      this.asignarFormData.idPlanPago!, // ✅ NUEVO: Incluir plan de pago
      this.asignarFormData.fechaInicio
    ).subscribe({
      next: (membresia: ClienteMembresia) => {
        this.mostrarSnackbar('Membresía asignada exitosamente', 'success');
        this.cargarTodasLasMembresias();
        this.showAsignarDialog = false;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error completo al asignar membresía:', error);
        
        let mensajeError = 'Error al asignar la membresía';
        if (error.error?.message) {
          mensajeError += ': ' + error.error.message;
        } else if (error.status === 400) {
          mensajeError += ': Datos inválidos enviados al servidor';
        } else if (error.status === 404) {
          mensajeError += ': Cliente, membresía o plan de pago no encontrado';
        }
        
        this.mostrarSnackbar(mensajeError, 'error');
        this.loading = false;
      }
    });
  }

renovarMembresia(membresia: ClienteMembresia): void {
  // Verificar si la membresía está activa
  if (membresia.estatus !== 'Activa') {
    const mensaje = this.obtenerMensajeRenovacion(membresia.estatus);
    
    if (confirm(`${mensaje}\n\n¿Desea proceder con la renovación?`)) {
      this.procesarRenovacion(membresia);
    }
  } else {
    // Membresía activa - renovación normal
    if (confirm('¿Estás seguro de que deseas renovar esta membresía activa? Se creará una nueva membresía y la actual se marcará como expirada.')) {
      this.procesarRenovacion(membresia);
    }
  }
}

// Método auxiliar para obtener mensaje según el estatus
private obtenerMensajeRenovacion(estatus: string): string {
  const mensajes: { [key: string]: string } = {
    'Expirada': 'Esta membresía está EXPIRADA. La renovación creará una nueva membresía activa.',
    'Cancelada': 'Esta membresía está CANCELADA. La renovación creará una nueva membresía activa.',
    'Inactiva': 'Esta membresía está INACTIVA. La renovación la reactivará.',
    'Activa': 'Renovar membresía activa.'
  };
  
  return mensajes[estatus] || `Esta membresía tiene estatus: ${estatus}. ¿Desea renovarla?`;
}

private procesarRenovacion(membresia: ClienteMembresia): void {
  this.clienteMembresiaService.renovarMembresia(membresia.id_membresia_cliente).subscribe({
    next: (response: any) => {
      // Manejar tanto la respuesta antigua como la nueva
      let membresiaRenovada: ClienteMembresia;
      let mensaje: string;

      if (response.success !== undefined) {
        // Nueva estructura de respuesta
        membresiaRenovada = response.membresia;
        mensaje = response.message || 'Membresía renovada exitosamente';
      } else {
        // Estructura antigua (directamente la membresía)
        membresiaRenovada = response;
        mensaje = 'Membresía renovada exitosamente';
      }

      this.mostrarSnackbar(mensaje, 'success');
      
      // Actualizar la lista de membresías
      this.actualizarListaDespuesRenovacion(membresia.id_membresia_cliente, membresiaRenovada);
    },
    error: (error: any) => {
      console.error('Error al renovar membresía:', error);
      
      let mensajeError = 'Error al renovar la membresía';
      if (error.error?.message) {
        mensajeError += ': ' + error.error.message;
      } else if (error.message) {
        mensajeError += ': ' + error.message;
      } else if (error.status === 400) {
        mensajeError += ': No se puede renovar esta membresía en su estado actual';
      }
      
      this.mostrarSnackbar(mensajeError, 'error');
    }
  });
}

// Método para actualizar la lista después de la renovación
private actualizarListaDespuesRenovacion(idMembresiaAntigua: number, nuevaMembresia: ClienteMembresia): void {
  // Encontrar y actualizar la membresía antigua
  const membresiaIndex = this.membresias.findIndex(m => m.id_membresia_cliente === idMembresiaAntigua);
  
  if (membresiaIndex !== -1) {
    // Marcar la membresía antigua como expirada
    this.membresias[membresiaIndex].estatus = 'Expirada';
    
    // Agregar la nueva membresía al principio de la lista
    this.membresias.unshift(nuevaMembresia);
    
    // Actualizar la lista filtrada
    this.membresiasFiltradas = [...this.membresias];
    
    // Actualizar gráficos
    this.actualizarGraficos();
  } else {
    // Si no encuentra la membresía antigua, recargar todo
    this.cargarTodasLasMembresias();
  }
}


cancelarMembresia(membresia: ClienteMembresia): void {
  // Verificar si ya está cancelada
  if (membresia.estatus === 'Cancelada') {
    this.mostrarSnackbar('Esta membresía ya está cancelada', 'warning');
    return;
  }

  // Verificar si está expirada
  if (membresia.estatus === 'Expirada') {
    this.mostrarSnackbar('Esta membresía ya está expirada, no es necesario cancelarla');
    return;
  }

  const mensaje = this.obtenerMensajeCancelacion(membresia.estatus);
  
  if (confirm(mensaje)) {
    this.clienteMembresiaService.cancelarMembresia(membresia.id_membresia_cliente).subscribe({
      next: (membresiaCancelada: ClienteMembresia) => {
        this.mostrarSnackbar('Membresía cancelada exitosamente', 'success');
        this.cargarTodasLasMembresias();
      },
      error: (error: any) => {
        console.error('Error al cancelar membresía:', error);
        this.mostrarSnackbar('Error al cancelar la membresía: ' + error.error?.message, 'error');
      }
    });
  }
}

// Método auxiliar para mensajes de cancelación
private obtenerMensajeCancelacion(estatus: string): string {
  const mensajes: { [key: string]: string } = {
    'Activa': '¿Estás seguro de que deseas cancelar esta membresía ACTIVA? El cliente perderá el acceso inmediatamente.',
    'Inactiva': '¿Estás seguro de que deseas cancelar esta membresía INACTIVA?',
    'Expirada': 'Esta membresía ya está expirada. ¿Desea marcarla como cancelada?',
    'Cancelada': 'Esta membresía ya está cancelada.'
  };
  
  return mensajes[estatus] || `¿Estás seguro de que deseas cancelar esta membresía (${estatus})?`;
}

  verificarAcceso(membresia: ClienteMembresia): void {
    this.clienteMembresiaService.verificarAcceso(membresia.folio_cliente).subscribe({
      next: (response: any) => {
        
        if (response.success) {
          if (response.tieneAcceso) {
            this.mostrarSnackbar(`✅ ${response.mensaje} - ${membresia.folio_cliente}`, 'success');
            this.registrarEntradaCliente(membresia.folio_cliente);
          } else {
            const mensaje = response.mensaje || response.message || 'Acceso denegado';
            this.mostrarSnackbar(`❌ ${mensaje}`, 'error');
            
            if (mensaje && typeof mensaje === 'string') {
              if (mensaje.includes('expirada')) {
                this.sugerirRenovacion(membresia);
              } else if (mensaje.includes('No tiene membresía') || mensaje.includes('no tiene membresía')) {
                this.sugerirAsignarMembresia(membresia.folio_cliente);
              }
            }
          }
        } else {
          this.mostrarSnackbar('Error en la verificación de acceso', 'error');
        }
      },
      error: (error: any) => {
        console.error('Error al verificar acceso:', error);
        this.mostrarSnackbar('Error al conectar con el servidor', 'error');
      }
    });
  }

  registrarEntradaCliente(folioCliente: string): void {
  }

  sugerirRenovacion(membresia: ClienteMembresia): void {
    if (confirm('¿Desea renovar esta membresía?')) {
      this.renovarMembresia(membresia);
    }
  }

  sugerirAsignarMembresia(folioCliente: string): void {
    if (confirm(`El cliente ${folioCliente} no tiene membresía. ¿Desea asignar una?`)) {
      this.asignarFormData.folioCliente = folioCliente;
      this.showAsignarDialog = true;
    }
  }

  verHistorial(membresia: ClienteMembresia): void {
    this.loadingHistorial = true;
    
    this.clienteMembresiaService.obtenerHistorialMembresias(membresia.folio_cliente).subscribe({
      next: (response: any) => {
        this.loadingHistorial = false;
        
        if (response.success && response.historial) {
          this.historialData = response.historial;
          this.clienteHistorial = membresia.folio_cliente;
          this.showHistorialModal = true;
        } else {
          this.mostrarSnackbar('No se pudo cargar el historial', 'error');
        }
      },
      error: (error: any) => {
        this.loadingHistorial = false;
        console.error('Error al cargar historial:', error);
        this.mostrarSnackbar('Error al cargar el historial', 'error');
      }
    });
  }

  cargarMembresiasPorExpirar(): void {
    this.loading = true;
    this.clienteMembresiaService.obtenerMembresiasPorExpirar(7).subscribe({
      next: (membresias: any) => {
        let membresiasArray: ClienteMembresia[] = [];
        
        if (membresias && membresias.membresias && Array.isArray(membresias.membresias)) {
          membresiasArray = membresias.membresias.map((item: ClienteMembresiaBackend) => this.mapearMembresiaBackend(item));
        }
        
        this.membresias = membresiasArray;
        this.membresiasFiltradas = [...membresiasArray];
        this.mostrarSnackbar(`Se encontraron ${membresiasArray.length} membresías por expirar`, 'success');
        this.loading = false;
        
        // Actualizar gráficos
        this.actualizarGraficos();
      },
      error: (error: any) => {
        console.error('Error al cargar membresías por expirar:', error);
        this.mostrarSnackbar('Error al cargar membresías por expirar', 'error');
        this.loading = false;
      }
    });
  }

obtenerPlanPagoPorId(idPlanPago: number): PlanPago | undefined {

  
  // Asegurarse de que idPlanPago es un número
  const idBuscado = Number(idPlanPago);
  
  const plan = this.planesPago.find(p => p.id === idBuscado);
  
  if (plan) {
    
  } else {
  
    this.planesPago.forEach(p => {
    });
  }
  
  return plan;
}
  
calcularPorcentajeDescuento(planPago: PlanPago | number): number {
  let plan: PlanPago | undefined;
  
  if (typeof planPago === 'number') {
    // Si es un número (ID), buscar el plan correspondiente
    plan = this.obtenerPlanPagoPorId(planPago);
  } else {
    // Si es un objeto PlanPago
    plan = planPago;
  }
  
  return plan ? Math.round((1 - plan.factorDescuento) * 100) : 0;
}


  verEstadisticas(): void {
    this.clienteMembresiaService.getEstadisticas().subscribe({
      next: (estadisticas: any) => {
        const activas = estadisticas.activas || estadisticas.totalActivas || 0;
        const porExpirar = estadisticas.porExpirar || estadisticas.proximasAExpirar || 0;
        const mensaje = `Estadísticas: ${activas} activas, ${porExpirar} por expirar`;
        this.mostrarSnackbar(mensaje, 'success');
      },
      error: (error: any) => {
        console.error('Error al cargar estadísticas:', error);
        this.mostrarSnackbar('Error al cargar estadísticas', 'error');
      }
    });
  }

  // Métodos para gráficos
  private crearGraficoDistribucion(): void {
    if (this.distribucionChart) {
      this.distribucionChart.destroy();
    }

    const ctx = document.getElementById('distribucionClientesChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Canvas distribucionClientesChart no encontrado');
      return;
    }

    const counts = this.tiposMembresiaDisponibles.map(tipo => 
      this.membresias.filter(m => this.obtenerEtiquetaMembresia(m.id_membresia) === tipo).length
    );

    const colors = this.tiposMembresiaDisponibles.map(tipo => this.getColorForTipo(tipo));

    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) {
      this.mostrarMensajeSinDatos(ctx, 'No hay membresías asignadas');
      return;
    }

    try {
      this.distribucionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.tiposMembresiaDisponibles,
          datasets: [{
            data: counts,
            backgroundColor: colors,
            borderColor: colors.map(color => this.adjustBrightness(color, -20)),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#F1FAEE',
                font: {
                  size: 12
                },
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.raw as number;
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  return `${label}: ${value} cliente${value !== 1 ? 's' : ''} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al crear gráfico de distribución:', error);
    }
  }

  private crearGraficoEstado(): void {
    if (this.estadoChart) {
      this.estadoChart.destroy();
    }

    const ctx = document.getElementById('estadoMembresiasChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Canvas estadoMembresiasChart no encontrado');
      return;
    }

    const estados = ['Activa', 'Inactiva', 'Expirada', 'Cancelada'];
    const counts = estados.map(estado => 
      this.membresias.filter(m => m.estatus === estado).length
    );

    const colors = ['#4CAF50', '#FF9800', '#F44336', '#9E9E9E'];

    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) {
      this.mostrarMensajeSinDatos(ctx, 'No hay datos de estado');
      return;
    }

    try {
      this.estadoChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: estados,
          datasets: [{
            label: 'Clientes por Estado',
            data: counts,
            backgroundColor: colors,
            borderColor: colors.map(color => this.adjustBrightness(color, -20)),
            borderWidth: 2,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `${context.parsed.y} cliente${context.parsed.y !== 1 ? 's' : ''}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#F1FAEE',
                stepSize: 1
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              ticks: {
                color: '#F1FAEE'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al crear gráfico de estado:', error);
    }
  }

  private mostrarMensajeSinDatos(ctx: HTMLCanvasElement, mensaje: string): void {
    const context = ctx.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, ctx.width, ctx.height);
    context.fillStyle = '#F1FAEE';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText(mensaje, ctx.width / 2, ctx.height / 2);
  }

  private adjustBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    
    return "#" + (
      0x1000000 +
      R * 0x10000 +
      G * 0x100 +
      B
    ).toString(16).slice(1);
  }

  getColorForTipo(tipo: string): string {
    const colors: {[key: string]: string} = {
      'Básica': '#E63946',
      'Premium': '#457B9D', 
      'VIP': '#F77F00'
    };
    return colors[tipo] || '#A8DADC';
  }

  actualizarGraficos(): void {
    setTimeout(() => {
      this.crearGraficoDistribucion();
      this.crearGraficoEstado();
    }, 100);
  }

  // Métodos auxiliares para la UI
  getImagenMembresia(membresia: ClienteMembresia): string {
    const idMembresia = membresia.id_membresia?.toUpperCase();
    if (idMembresia === 'MEM003' || idMembresia === 'MEM_VIP') {
      return 'assets/images/membresia-vip.jpg';
    } else if (idMembresia === 'MEM002' || idMembresia === 'MEM_PREMIUM') {
      return 'assets/images/membresia-premium.jpg';
    }
    return 'assets/images/membresia-basica.jpg';
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/membresia-default.jpg';
  }

  getEstatusBadgeClass(membresia: ClienteMembresia): string {
    const estatus = membresia.estatus?.toLowerCase() || '';
    if (estatus.includes('activa')) return 'estatus-activa';
    if (estatus.includes('inactiva')) return 'estatus-inactiva';
    if (estatus.includes('expirada')) return 'estatus-expirada';
    if (estatus.includes('cancelada')) return 'estatus-cancelada';
    return 'estatus-activa';
  }

  getTipoMembresiaClass(membresia: ClienteMembresia): string {
    return this.obtenerClaseMembresia(membresia.id_membresia);
  }

  getEstatusColor(estatus: string): string {
    const colores: { [key: string]: string } = {
      'Activa': '#4CAF50',
      'Inactiva': '#FF9800',
      'Expirada': '#F44336',
      'Cancelada': '#9E9E9E'
    };
    return colores[estatus] || '#FFFFFF';
  }

  obtenerClaseEstatus(estatus: string): string {
    if (!estatus) return 'estatus-default';
    
    const clases: { [key: string]: string } = {
      'Activa': 'estatus-activa',
      'Inactiva': 'estatus-inactiva',
      'Expirada': 'estatus-expirada',
      'Cancelada': 'estatus-cancelada'
    };
    return clases[estatus] || 'estatus-default';
  }

  obtenerIconoEstatus(estatus: string): string {
    if (!estatus) return '❓';
    
    const iconos: { [key: string]: string } = {
      'Activa': '✅',
      'Inactiva': '⏸️',
      'Expirada': '⏰',
      'Cancelada': '❌'
    };
    return iconos[estatus] || '❓';
  }

  obtenerClaseMembresia(idMembresia: string): string {
    if (!idMembresia) return 'membresia-default';
    
    const clases: { [key: string]: string } = {
      'MEM_BASICA': 'membresia-basica',
      'MEM_PREMIUM': 'membresia-premium',
      'MEM_VIP': 'membresia-vip',
      'MEM001': 'membresia-basica',
      'MEM002': 'membresia-premium',
      'MEM003': 'membresia-vip'
    };
    return clases[idMembresia] || 'membresia-default';
  }

  obtenerEtiquetaMembresia(idMembresia: string): string {
    if (!idMembresia || idMembresia === 'Desconocida') {
      return 'Desconocida';
    }
    
    const membresiaEncontrada = this.tipoMembresias.find(m => m.value === idMembresia);
    if (membresiaEncontrada) {
      return membresiaEncontrada.label;
    }
    
    const membresia = this.membresias.find(m => m.id_membresia === idMembresia);
    if (membresia) {
      return idMembresia;
    }
    
    const etiquetas: { [key: string]: string } = {
      'MEM_BASICA': 'Básica',
      'MEM_PREMIUM': 'Premium',
      'MEM_VIP': 'VIP',
      'MEM001': 'Básica',
      'MEM002': 'Premium', 
      'MEM003': 'VIP'
    };
    
    return etiquetas[idMembresia] || idMembresia;
  }

  formatearFecha(fechaString: string): string {
    if (!fechaString || fechaString === 'Fecha no disponible') {
      return 'Fecha no disponible';
    }
    
    try {
      const fecha = new Date(fechaString);
      
      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida:', fechaString);
        return 'Fecha inválida';
      }
      
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', fechaString, error);
      return 'Fecha inválida';
    }
  }

  mostrarSnackbar(mensaje: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.snackbar = { 
      show: true, 
      message: mensaje, 
      type 
    };
    setTimeout(() => {
      this.snackbar.show = false;
    }, 4000);
  }

  cerrarSnackbar(): void {
    this.snackbar.show = false;
  }

  // Métricas para el dashboard
  calcularTotalActivas(): number {
    if (!Array.isArray(this.membresias)) {
      return 0;
    }
    return this.membresias.filter(m => m && m.estatus === 'Activa').length;
  }

  calcularPorExpirar(): number {
    if (!Array.isArray(this.membresias)) {
      return 0;
    }
    
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);
    
    return this.membresias.filter(m => {
      if (!m || !m.fecha_fin || !m.estatus || m.estatus !== 'Activa') {
        return false;
      }
      
      try {
        const fechaFin = new Date(m.fecha_fin);
        return fechaFin <= en7Dias && fechaFin >= hoy;
      } catch (error) {
        console.warn('Fecha inválida para membresía:', m.fecha_fin);
        return false;
      }
    }).length;
  }

  calcularTasaRetencion(): number {
  if (!Array.isArray(this.membresias) || this.membresias.length === 0) {
    return 0;
  }

  const membresiasActivas = this.membresias.filter(m => m.estatus === 'Activa').length;
  const totalMembresias = this.membresias.length;
  
  return Math.round((membresiasActivas / totalMembresias) * 100);
}

  hayMembresias(): boolean {
    return Array.isArray(this.membresias) && this.membresias.length > 0;
  }

  cerrarModalHistorial(): void {
    this.showHistorialModal = false;
    this.historialData = [];
    this.clienteHistorial = '';
  }

  contarActivas(): number {
    if (!this.historialData || !Array.isArray(this.historialData)) {
      return 0;
    }
    return this.historialData.filter(item => item.estatus === 'Activa').length;
  }

  contarHistoricas(): number {
    if (!this.historialData || !Array.isArray(this.historialData)) {
      return 0;
    }
    return this.historialData.filter(item => item.estatus !== 'Activa').length;
  }

// Agrega este método en la sección de métodos auxiliares para la UI, después de obtenerEtiquetaMembresia
contarMembresiasPorTipo(tipo: string): number {
  if (!Array.isArray(this.membresias)) {
    return 0;
  }
  return this.membresias.filter(m => this.obtenerEtiquetaMembresia(m.id_membresia) === tipo).length;
}
}