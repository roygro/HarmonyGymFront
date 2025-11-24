import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PagoService, Pago } from '../../../services/pagos/pago';
import { ProductoService, Producto } from '../../../services/productos/producto';
import { ClienteService, Cliente } from '../../../services/cliente/ClienteService';
import { RecepcionistaService, Recepcionista } from '../../../services/recepcionista/recepcionistaService';
import { MembresiaService, Membresia } from '../../../services/membresia/membresia';
import { HeaderRecepcionistaComponent } from '../../recepcionista/header-recepcionista/header-recepcionista';
import { AuthService } from '../../../services/Auth/AuthService';
import { ClienteMembresia, ClienteMembresiaService } from '../../../services/membresia/cliente-membresia';

interface MembresiaActivaResponse {
  success: boolean;
  membresia: ClienteMembresia;
  precioFinal: number;
}

@Component({
  selector: 'app-pago-create',
  templateUrl: './pago-create.html',
  styleUrls: ['./pago-create.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderRecepcionistaComponent]
})
export class PagoCreate implements OnInit {
  pagoForm: FormGroup;
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  clientes: Cliente[] = [];
  clientesConMembresiaActiva: Cliente[] = [];
  recepcionistas: Recepcionista[] = [];
  membresias: Membresia[] = [];
  
  cargando: boolean = true;
  enviando: boolean = false;
  buscandoMembresia: boolean = false;
  productoSeleccionado: Producto | null = null;
  membresiaSeleccionada: Membresia | null = null;
  recepcionistaLogueado: any = null;
  clienteMembresiaActiva: ClienteMembresia | null = null;
  precioFinalMembresia: number = 0;

  // Filtros para búsqueda
  filtroCliente: string = '';
  filtroProducto: string = '';
  clientesFiltrados: Cliente[] = [];

  // Secciones
  seccionActiva: 'membresia' | 'producto' = 'membresia';

  totalPlanCompleto: number = 0;
  mesesCubiertosPlan: number = 1;
  duracionTotalPlan: number = 0;
  precioBaseMensual: number = 0;
  precioMensualConDescuento: number = 0;

  // Estados de validación visual
  campoFocused: { [key: string]: boolean } = {};

  // Efecto de pestaña
  efectoPestana = {
    left: '0%',
    width: '50%'
  };

  // Propiedades para notificaciones
  mostrarNotificacion: boolean = false;
  mensajeNotificacion: string = '';
  tipoNotificacion: 'success' | 'error' | 'warning' | 'info' = 'info';

  // Nuevas propiedades para monto y cambio
  montoRecibido: number = 0;
  cambio: number = 0;
  mostrarCamposPago: boolean = false;
  metodoPago: string = 'efectivo';
  
  // Opciones de método de pago
  metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: 'fa-money-bill-wave' },
    { value: 'tarjeta', label: 'Tarjeta', icon: 'fa-credit-card' },
    { value: 'transferencia', label: 'Transferencia', icon: 'fa-university' }
  ];

  constructor(
    private fb: FormBuilder,
    private pagoService: PagoService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private recepcionistaService: RecepcionistaService,
    private membresiaService: MembresiaService,
    private clienteMembresiaService: ClienteMembresiaService,
    private authService: AuthService,
    private router: Router
  ) {
    this.pagoForm = this.createForm();
  }

  ngOnInit(): void {
    this.obtenerRecepcionistaLogueado();
    this.cargarDatosIniciales();
    this.setupEventListeners();
    this.actualizarEfectoPestana();
  }

  // Método para mostrar notificaciones estilizadas
  mostrarAlerta(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.mensajeNotificacion = mensaje;
    this.tipoNotificacion = tipo;
    this.mostrarNotificacion = true;

    // Auto-ocultar después de 5 segundos para success/info, 8 segundos para error/warning
    const tiempo = tipo === 'success' || tipo === 'info' ? 5000 : 8000;
    setTimeout(() => {
      this.mostrarNotificacion = false;
    }, tiempo);
  }

  // Método para cerrar notificación manualmente
  cerrarNotificacion(): void {
    this.mostrarNotificacion = false;
  }

  // Actualizar efecto visual de pestaña
  actualizarEfectoPestana(): void {
    if (this.seccionActiva === 'membresia') {
      this.efectoPestana = { left: '0%', width: '50%' };
    } else {
      this.efectoPestana = { left: '50%', width: '50%' };
    }
  }

  // Mejora: Setup de event listeners para mejor UX
  setupEventListeners(): void {
    // Focus tracking para mejor feedback visual
    Object.keys(this.pagoForm.controls).forEach(key => {
      const control = this.pagoForm.get(key);
      if (control) {
        control.valueChanges.subscribe(() => {
          this.actualizarEstadoCampo(key);
        });
      }
    });
  }

  // Mejora: Actualizar estado visual de los campos
  actualizarEstadoCampo(campo: string): void {
    const control = this.pagoForm.get(campo);
    if (control) {
      this.campoFocused[campo] = control.value && control.value !== '';
    }
  }

  onFocus(campo: string): void {
    this.campoFocused[campo] = true;
  }

  onBlur(campo: string): void {
    const control = this.pagoForm.get(campo);
    this.campoFocused[campo] = !!(control && control.value && control.value !== '');
  }

  obtenerRecepcionistaLogueado(): void {
    const user = this.authService.getCurrentUser();
    console.log('🔐 Usuario obtenido de AuthService:', user);
    
    if (user) {
      const tienePermisosRecepcion = 
        user.tipoUsuario === 'RECEPCIONISTA' || 
        user.tipoUsuario === 'ADMIN' || 
        user.permisos?.includes('RECEPCION') ||
        user.nombreRol === 'RECEPCIONISTA' ||
        user.rol === 'RECEPCIONISTA' ||
        (user.permisos && Array.isArray(user.permisos) && user.permisos.some((p: string | string[]) => p.includes('RECEPCION')));

      if (tienePermisosRecepcion) {
        this.recepcionistaLogueado = user;
        this.pagoForm.patchValue({
          idRecepcionista: user.idPersona || user.id || user.idUsuario
        });
      } else {
        this.recepcionistaLogueado = user;
        this.pagoForm.patchValue({
          idRecepcionista: user.idPersona || user.id || user.idUsuario || 'REC001'
        });
      }
    } else {
      console.error('❌ No hay usuario logueado');
      this.router.navigate(['/login']);
    }
  }

  cargarDatosIniciales(): void {
    this.cargando = true;

    Promise.all([
      this.cargarProductos(),
      this.cargarClientesConMembresiaActiva(),
      this.cargarMembresias()
    ]).finally(() => {
      this.cargando = false;
      this.setupCalculos();
      this.filtrarClientes();
      this.filtrarProductos();
    });
  }

  cargarClientesConMembresiaActiva(): Promise<void> {
    return new Promise((resolve) => {
      this.clienteService.obtenerTodosLosClientes().subscribe({
        next: (clientes) => {
          this.clientes = Array.isArray(clientes) ? clientes : [];
          this.filtrarClientesConMembresiaActiva();
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          this.clientes = [];
          this.clientesConMembresiaActiva = [];
          resolve();
        }
      });
    });
  }

  filtrarClientesConMembresiaActiva(): void {
    this.clientesConMembresiaActiva = [];
    
    if (this.clientes.length === 0) {
      return;
    }

    const promesas = this.clientes.map(cliente => {
      return new Promise<void>((resolve) => {
        this.clienteMembresiaService.obtenerMembresiaActiva(cliente.folioCliente).subscribe({
          next: (response: any) => {
            if (response.success && response.membresia) {
              this.clientesConMembresiaActiva.push(cliente);
            }
            resolve();
          },
          error: (error) => {
            console.error(`Error al verificar membresía de ${cliente.folioCliente}:`, error);
            resolve();
          }
        });
      });
    });

    Promise.all(promesas).then(() => {
      this.filtrarClientes();
    });
  }

  // Mejora: Búsqueda más inteligente para clientes
  filtrarClientes(): void {
    if (!this.filtroCliente) {
      this.clientesFiltrados = [...this.clientesConMembresiaActiva];
    } else {
      const filtro = this.filtroCliente.toLowerCase().trim();
      this.clientesFiltrados = this.clientesConMembresiaActiva.filter(cliente =>
        cliente.nombre.toLowerCase().includes(filtro) ||
        cliente.folioCliente.toLowerCase().includes(filtro) ||
        cliente.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(filtro) ||
        cliente.folioCliente.replace(/-/g, '').includes(filtro.replace(/-/g, ''))
      );
    }
  }

  // Nueva función: Búsqueda inteligente para productos
  filtrarProductos(): void {
    if (!this.filtroProducto) {
      this.productosFiltrados = [...this.productos];
    } else {
      const filtro = this.filtroProducto.toLowerCase().trim();
      this.productosFiltrados = this.productos.filter(producto =>
        producto.nombre.toLowerCase().includes(filtro) ||
        producto.codigo.toLowerCase().includes(filtro) ||
        producto.descripcion?.toLowerCase().includes(filtro) ||
        producto.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(filtro)
      );
    }
  }

  onFiltroClienteChange(): void {
    this.filtrarClientes();
  }

  onFiltroProductoChange(): void {
    this.filtrarProductos();
  }

  // Mejora: Selección con mejor feedback
  seleccionarCliente(cliente: Cliente): void {
    this.pagoForm.patchValue({
      folioCliente: cliente.folioCliente
    });
    this.filtroCliente = cliente.nombre + ' - ' + cliente.folioCliente;
    this.onClienteChange();
    
    // Feedback visual
    setTimeout(() => {
      this.clientesFiltrados = [];
    }, 300);
  }

  // Nueva función: Seleccionar producto desde búsqueda
  seleccionarProducto(producto: Producto): void {
    this.pagoForm.patchValue({
      codigoProducto: producto.codigo
    });
    this.filtroProducto = producto.nombre + ' - ' + producto.codigo;
    this.actualizarPrecioProducto(producto.codigo);
    
    // Feedback visual
    setTimeout(() => {
      this.productosFiltrados = [];
    }, 300);
  }

  limpiarSeleccionCliente(): void {
    this.pagoForm.patchValue({ folioCliente: '' });
    this.filtroCliente = '';
    this.clientesFiltrados = [...this.clientesConMembresiaActiva];
    this.resetMembresiaData();
  }

  limpiarSeleccionProducto(): void {
    this.pagoForm.patchValue({ codigoProducto: '' });
    this.filtroProducto = '';
    this.productosFiltrados = [...this.productos];
    this.productoSeleccionado = null;
  }

  cargarMembresias(): Promise<void> {
    return new Promise((resolve) => {
      this.membresiaService.getMembresiasActivas().subscribe({
        next: (membresias) => {
          this.membresias = Array.isArray(membresias) ? membresias : [];
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar membresías:', error);
          this.membresias = [];
          resolve();
        }
      });
    });
  }

  cargarProductos(): Promise<void> {
    return new Promise((resolve) => {
      this.productoService.obtenerProductos().subscribe({
        next: (productos) => {
          this.productos = Array.isArray(productos) ? productos : [];
          this.productosFiltrados = [...this.productos];
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar productos:', error);
          this.productos = [];
          this.productosFiltrados = [];
          resolve();
        }
      });
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      tipoPago: ['membresia', [Validators.required]],
      idRecepcionista: [{value: '', disabled: true}, [Validators.required]],
      codigoProducto: [''],
      idMembresia: [{value: '', disabled: true}],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      total: [0, [Validators.required, Validators.min(0)]],
      folioCliente: ['', [Validators.required]]
    });
  }

  // Mejora: Cambio de sección con animación y efecto visual
  cambiarSeccion(seccion: 'membresia' | 'producto'): void {
    this.seccionActiva = seccion;
    this.pagoForm.patchValue({
      tipoPago: seccion
    });
    
    // Actualizar efecto visual de pestaña
    this.actualizarEfectoPestana();
    
    // Reset de campos no utilizados
    if (seccion === 'producto') {
      this.resetMembresiaData();
    } else {
      this.pagoForm.patchValue({ codigoProducto: '' });
      this.limpiarSeleccionProducto();
    }
    
    this.onTipoPagoChange();
    
    // Efecto visual adicional - scroll suave al inicio del formulario
    setTimeout(() => {
      const formCard = document.querySelector('.form-card');
      if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  onTipoPagoChange(): void {
    const tipoPago = this.pagoForm.get('tipoPago')?.value;
    
    if (tipoPago === 'producto') {
      this.pagoForm.patchValue({
        idMembresia: '',
        cantidad: 1
      });
      this.pagoForm.get('codigoProducto')?.setValidators([Validators.required]);
      this.pagoForm.get('idMembresia')?.clearValidators();
      this.pagoForm.get('codigoProducto')?.enable();
      this.pagoForm.get('idMembresia')?.disable();
    } else if (tipoPago === 'membresia') {
      this.pagoForm.patchValue({
        codigoProducto: '',
        cantidad: 1
      });
      this.pagoForm.get('idMembresia')?.setValidators([Validators.required]);
      this.pagoForm.get('codigoProducto')?.clearValidators();
      this.pagoForm.get('codigoProducto')?.disable();
      this.pagoForm.get('idMembresia')?.enable();
      
      const folioCliente = this.pagoForm.get('folioCliente')?.value;
      if (folioCliente) {
        this.buscarMembresiaCliente(folioCliente);
      }
    }
    
    this.pagoForm.get('codigoProducto')?.updateValueAndValidity();
    this.pagoForm.get('idMembresia')?.updateValueAndValidity();
    this.calcularTotal();
  }

  onClienteChange(): void {
    const folioCliente = this.pagoForm.get('folioCliente')?.value;
    const tipoPago = this.pagoForm.get('tipoPago')?.value;
    
    if (tipoPago === 'membresia' && folioCliente) {
      this.buscarMembresiaCliente(folioCliente);
    } else {
      this.resetMembresiaData();
    }
  }

  buscarMembresiaCliente(folioCliente: string): void {
    this.buscandoMembresia = true;
    this.resetMembresiaData();

    this.clienteMembresiaService.obtenerMembresiaActiva(folioCliente).subscribe({
      next: (response: any) => {
        if (response.success && response.membresia) {
          this.procesarMembresiaCliente(response.membresia, response.precioFinal);
        } else {
          this.mostrarErrorMembresia('El cliente no tiene una membresía activa.');
        }
        this.buscandoMembresia = false;
      },
      error: (error) => {
        if (error.status === 404) {
          this.mostrarErrorMembresia('El cliente no tiene una membresía activa registrada.');
        } else {
          this.mostrarErrorMembresia('No se pudo verificar la membresía del cliente. Por favor intente nuevamente.');
        }
        this.buscandoMembresia = false;
      }
    });
  }

  procesarMembresiaCliente(membresiaCliente: any, precioFinal: number): void {
    this.clienteMembresiaActiva = membresiaCliente;
    this.precioFinalMembresia = precioFinal;
    this.precioMensualConDescuento = precioFinal;
    
    // Debuggear para ver las propiedades reales
    console.log('📋 Membresia cliente recibida:', membresiaCliente);
    this.debugMembresia(); // Llamar al método de debug
    
    if (!membresiaCliente) {
      this.mostrarErrorMembresia('No se encontraron los detalles de la membresía.');
      return;
    }

    let idMembresia = this.obtenerIdMembresia(membresiaCliente);
    
    if (!idMembresia) {
      if (membresiaCliente.membresia && membresiaCliente.membresia.idMembresia) {
        idMembresia = membresiaCliente.membresia.idMembresia;
      } else if (membresiaCliente.idMembresia) {
        idMembresia = membresiaCliente.idMembresia;
      } else {
        this.mostrarErrorMembresia('Error: No se pudo obtener el ID de la membresía. Contacte al administrador.');
        return;
      }
    }

    const membresiaEncontrada = this.membresias.find(m => m.idMembresia === idMembresia);
    
    if (membresiaEncontrada) {
      this.membresiaSeleccionada = membresiaEncontrada;
      this.precioBaseMensual = membresiaEncontrada.precio;
    } else {
      this.membresiaSeleccionada = {
        idMembresia: idMembresia,
        tipo: (membresiaCliente.membresia?.tipo || membresiaCliente.tipo || 'Desconocido'),
        precio: (membresiaCliente.membresia?.precio || membresiaCliente.precio || precioFinal),
        duracion: (membresiaCliente.membresia?.duracion || membresiaCliente.duracion || 30),
        descripcion: (membresiaCliente.membresia?.descripcion || membresiaCliente.descripcion || '')
      } as Membresia;
      
      this.precioBaseMensual = this.membresiaSeleccionada.precio;
    }

    this.obtenerInformacionPlanCompleto(membresiaCliente);

    const totalAPagar = this.totalPlanCompleto;
    
    this.pagoForm.patchValue({
      idMembresia: idMembresia,
      precioUnitario: totalAPagar,
      cantidad: 1,
      total: totalAPagar
    });
  }

  // Método temporal para debuggear - puedes removerlo después
  debugMembresia(): void {
    if (this.clienteMembresiaActiva) {
      console.log('🔍 Debug - Propiedades de clienteMembresiaActiva:', this.clienteMembresiaActiva);
      console.log('🔍 Debug - Todas las propiedades:', Object.keys(this.clienteMembresiaActiva));
      
      // Buscar propiedades que contengan "fecha", "inicio", "fin"
      const propiedadesFecha = Object.keys(this.clienteMembresiaActiva).filter(key => 
        key.toLowerCase().includes('fecha') || 
        key.toLowerCase().includes('inicio') || 
        key.toLowerCase().includes('fin')
      );
      console.log('🔍 Debug - Propiedades relacionadas con fechas:', propiedadesFecha);
      
      // Mostrar valores de esas propiedades
      propiedadesFecha.forEach(prop => {
        console.log(`🔍 Debug - ${prop}:`, (this.clienteMembresiaActiva as any)[prop]);
      });
    }
  }

  obtenerIdMembresia(membresiaCliente: any): string | null {
    const posiblesPropiedades = [
      'id_membresia',
      'idMembresia', 
      'membresiaId',
      'membresia.idMembresia',
      'membresia.id_membresia'
    ];

    for (const prop of posiblesPropiedades) {
      if (prop.includes('.')) {
        const parts = prop.split('.');
        let value = membresiaCliente;
        for (const part of parts) {
          value = value?.[part];
          if (value === undefined) break;
        }
        if (value) {
          return value;
        }
      } else if (membresiaCliente[prop]) {
        return membresiaCliente[prop];
      }
    }

    return null;
  }

  obtenerInformacionPlanCompleto(membresiaCliente: any): void {
    this.mesesCubiertosPlan = 1;
    this.duracionTotalPlan = this.membresiaSeleccionada?.duracion || 30;

    if (!membresiaCliente.planPago) {
      this.totalPlanCompleto = this.precioFinalMembresia;
      return;
    }

    const plan = membresiaCliente.planPago;
    const duracionMensual = this.membresiaSeleccionada?.duracion || 30;
    
    if (plan.duracionDias && plan.duracionDias > duracionMensual) {
      this.mesesCubiertosPlan = Math.floor(plan.duracionDias / duracionMensual);
    } else {
      const nombrePlan = plan.nombre?.toUpperCase() || '';
      const tipoPlan = plan.tipoPlan?.toUpperCase() || '';
      
      if (tipoPlan.includes('TRIMESTRAL') || nombrePlan.includes('TRIMESTRAL') || nombrePlan.includes('3 MESES')) {
        this.mesesCubiertosPlan = 3;
      } else if (tipoPlan.includes('SEMESTRAL') || nombrePlan.includes('SEMESTRAL') || nombrePlan.includes('6 MESES')) {
        this.mesesCubiertosPlan = 6;
      } else if (tipoPlan.includes('ANUAL') || nombrePlan.includes('ANUAL') || nombrePlan.includes('12 MESES')) {
        this.mesesCubiertosPlan = 12;
      }
    }

    this.duracionTotalPlan = duracionMensual * this.mesesCubiertosPlan;
    
    if (this.mesesCubiertosPlan > 1) {
      this.totalPlanCompleto = this.precioFinalMembresia * this.mesesCubiertosPlan;
    } else {
      this.totalPlanCompleto = this.precioFinalMembresia;
    }
  }

  resetMembresiaData(): void {
    this.clienteMembresiaActiva = null;
    this.membresiaSeleccionada = null;
    this.precioFinalMembresia = 0;
    this.totalPlanCompleto = 0;
    this.mesesCubiertosPlan = 1;
    this.duracionTotalPlan = 0;
    this.precioBaseMensual = 0;
    this.precioMensualConDescuento = 0;
    
    this.pagoForm.patchValue({
      idMembresia: '',
      precioUnitario: 0,
      total: 0
    });
  }

  mostrarErrorMembresia(mensaje: string): void {
    this.pagoForm.patchValue({
      idMembresia: '',
      precioUnitario: 0,
      total: 0
    });
    this.resetMembresiaData();
    this.mostrarAlerta(mensaje, 'warning');
  }

  setupCalculos(): void {
    this.pagoForm.get('cantidad')?.valueChanges.subscribe(() => this.calcularTotal());
    this.pagoForm.get('precioUnitario')?.valueChanges.subscribe(() => this.calcularTotal());
    
    this.pagoForm.get('codigoProducto')?.valueChanges.subscribe(codigo => {
      this.actualizarPrecioProducto(codigo);
    });
    
    this.pagoForm.get('idMembresia')?.valueChanges.subscribe(idMembresia => {
      this.actualizarPrecioMembresia(idMembresia);
    });

    this.pagoForm.get('folioCliente')?.valueChanges.subscribe(folioCliente => {
      this.onClienteChange();
    });
  }

  actualizarPrecioProducto(codigo: string): void {
    const producto = this.productos.find(p => p.codigo === codigo);
    if (producto) {
      this.productoSeleccionado = producto;
      this.pagoForm.patchValue({
        precioUnitario: producto.precio
      });
      this.calcularTotal();
    } else {
      this.productoSeleccionado = null;
    }
  }

  actualizarPrecioMembresia(idMembresia: string): void {
    const membresia = this.membresias.find(m => m.idMembresia === idMembresia);
    if (membresia) {
      this.membresiaSeleccionada = membresia;
    }
  }

  calcularTotal(): void {
    const cantidad = this.pagoForm.get('cantidad')?.value || 0;
    const precioUnitario = this.pagoForm.get('precioUnitario')?.value || 0;
    const total = cantidad * precioUnitario;
    this.pagoForm.patchValue({ total: this.redondearDecimales(total, 2) });
  }

  calcularSubtotal(): number {
    const cantidad = this.pagoForm.get('cantidad')?.value || 0;
    const precioUnitario = this.pagoForm.get('precioUnitario')?.value || 0;
    return cantidad * precioUnitario;
  }

  redondearDecimales(numero: number, decimales: number): number {
    return Number(numero.toFixed(decimales));
  }

  onPrecioManualChange(): void {
    setTimeout(() => {
      this.calcularTotal();
    }, 100);
  }

  // Mejora: Control de cantidad con validación mejorada
  incrementarCantidad(): void {
    const current = this.pagoForm.get('cantidad')?.value || 1;
    if (current < 100) {
      this.pagoForm.patchValue({ cantidad: current + 1 });
    }
  }

  decrementarCantidad(): void {
    const current = this.pagoForm.get('cantidad')?.value || 1;
    if (current > 1) {
      this.pagoForm.patchValue({ cantidad: current - 1 });
    }
  }

  validarDatosPago(pagoData: any): boolean {
    if (!pagoData.idRecepcionista) {
      this.mostrarAlerta('❌ Error: No se encontró el recepcionista. Por favor, inicie sesión nuevamente.', 'error');
      return false;
    }
    
    if (!pagoData.folioCliente) {
      this.mostrarAlerta('❌ Error: No se seleccionó un cliente', 'error');
      return false;
    }
    
    if (pagoData.tipoPago === 'membresia') {
      if (!pagoData.idMembresia) {
        this.mostrarAlerta('❌ Error: No se seleccionó una membresía válida', 'error');
        return false;
      }
      
      if (!this.clienteMembresiaActiva) {
        this.mostrarAlerta('❌ Error: No se encontró la información de la membresía del cliente', 'error');
        return false;
      }
    }
    
    if (pagoData.tipoPago === 'producto' && !pagoData.codigoProducto) {
      this.mostrarAlerta('❌ Error: No se seleccionó un producto', 'error');
      return false;
    }
    
    if (pagoData.total <= 0) {
      this.mostrarAlerta('❌ Error: El total debe ser mayor a 0', 'error');
      return false;
    }
    
    return true;
  }

  // NUEVOS MÉTODOS PARA MANEJO DE PAGO

  // Método para calcular el cambio
  calcularCambio(): void {
    const total = this.pagoForm.get('total')?.value || 0;
    this.cambio = this.montoRecibido - total;
    
    // Validar que el monto recibido sea suficiente
    if (this.cambio < 0) {
      this.cambio = 0;
    }
  }

  // Método para manejar cambios en el monto recibido
  onMontoRecibidoChange(): void {
    this.calcularCambio();
  }

  // Método para formatear el monto al perder el foco
  formatearMontoRecibido(): void {
    if (this.montoRecibido) {
      this.montoRecibido = this.redondearDecimales(this.montoRecibido, 2);
      this.calcularCambio();
    }
  }

  // Método para validar si el pago es válido
  validarPago(): boolean {
    const total = this.pagoForm.get('total')?.value || 0;
    
    if (this.metodoPago === 'efectivo') {
      if (this.montoRecibido <= 0) {
        this.mostrarAlerta('❌ Ingrese el monto recibido', 'error');
        return false;
      }
      if (this.montoRecibido < total) {
        this.mostrarAlerta('❌ El monto recibido es menor al total', 'error');
        return false;
      }
    }
    
    return true;
  }

  // Método para manejar el proceso de pago completo
  procesarPago(): void {
    if (!this.validarPago()) {
      return;
    }

    this.enviando = true;
    
    const tipoPago = this.pagoForm.get('tipoPago')?.value;
    const formValue = this.pagoForm.getRawValue();
    
    const idRecepcionista = this.recepcionistaLogueado.idPersona || 
                           this.recepcionistaLogueado.id || 
                           this.recepcionistaLogueado.idUsuario ||
                           'REC001';
    
    const pagoData: any = {
      idRecepcionista: idRecepcionista,
      cantidad: formValue.cantidad,
      precioUnitario: formValue.precioUnitario,
      total: formValue.total,
      folioCliente: formValue.folioCliente,
      tipoPago: tipoPago,
      metodoPago: this.metodoPago,
      montoRecibido: this.metodoPago === 'efectivo' ? this.montoRecibido : formValue.total,
      cambio: this.metodoPago === 'efectivo' ? this.cambio : 0,
      fechaPago: new Date().toISOString()
    };

    if (tipoPago === 'producto') {
      pagoData.codigoProducto = formValue.codigoProducto;
    } else if (tipoPago === 'membresia') {
      pagoData.idMembresia = formValue.idMembresia;
      
      if (this.clienteMembresiaActiva) {
        const idMembresiaCliente = this.clienteMembresiaActiva.id_membresia_cliente || 
                                  this.clienteMembresiaActiva.id_membresia_cliente;
        
        pagoData.idMembresiaCliente = idMembresiaCliente;
        pagoData.idPlanPago = this.clienteMembresiaActiva.planPago?.id;
      }
    }

    console.log('📤 Enviando datos del pago:', pagoData);

    if (!this.validarDatosPago(pagoData)) {
      this.enviando = false;
      return;
    }

    this.pagoService.crearPago(pagoData).subscribe({
      next: (pagoCreado) => {
        this.enviando = false;
        const mensaje = tipoPago === 'membresia' 
          ? `¡Pago de membresía registrado exitosamente!\nTotal: ${this.formatearMoneda(pagoCreado.total)}\nMétodo: ${this.getMetodoPagoLabel()}\n${this.metodoPago === 'efectivo' ? `Cambio: ${this.formatearMoneda(this.cambio)}` : ''}`
          : `¡Pago de producto registrado exitosamente!\nTotal: ${this.formatearMoneda(pagoCreado.total)}\nMétodo: ${this.getMetodoPagoLabel()}\n${this.metodoPago === 'efectivo' ? `Cambio: ${this.formatearMoneda(this.cambio)}` : ''}`;
        
        this.mostrarAlerta(mensaje, 'success');
        setTimeout(() => {
          this.router.navigate(['/pagos']);
        }, 3000);
      },
      error: (error) => {
        this.enviando = false;
        const errorMsg = error.error?.message || error.error?.error || error.error || error.message || 'Error desconocido';
        this.mostrarAlerta('❌ Error al registrar el pago: ' + errorMsg, 'error');
      }
    });
  }

  // Método para obtener el label del método de pago
  getMetodoPagoLabel(): string {
    const metodo = this.metodosPago.find(m => m.value === this.metodoPago);
    return metodo ? metodo.label : this.metodoPago;
  }

  // Método para obtener el icono del método de pago
  getMetodoPagoIcon(): string {
    const metodo = this.metodosPago.find(m => m.value === this.metodoPago);
    return metodo ? metodo.icon : 'fa-money-bill-wave';
  }

  // Método para cambiar el método de pago
  onMetodoPagoChange(): void {
    if (this.metodoPago !== 'efectivo') {
      this.montoRecibido = this.pagoForm.get('total')?.value || 0;
      this.cambio = 0;
    } else {
      this.montoRecibido = 0;
      this.cambio = 0;
    }
  }

  // Sobrescribir el método onSubmit existente
  onSubmit(): void {
    if (!this.recepcionistaLogueado) {
      this.mostrarAlerta('❌ Error: No se pudo identificar al recepcionista. Por favor, inicie sesión nuevamente.', 'error');
      return;
    }

    // Marcar todos los campos como touched para mostrar errores
    this.marcarCamposComoTouched();

    if (this.pagoForm.valid) {
      this.mostrarCamposPago = true;
      
      // Scroll a la sección de pago
      setTimeout(() => {
        const seccionPago = document.querySelector('.seccion-pago');
        if (seccionPago) {
          seccionPago.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      this.mostrarAlerta('❌ Por favor completa todos los campos requeridos correctamente.', 'error');
    }
  }

  // Método para regresar al formulario principal
  regresarAlFormulario(): void {
    this.mostrarCamposPago = false;
  }

  // Mejora: Marcar todos los campos como touched para mostrar errores
  marcarCamposComoTouched(): void {
    Object.keys(this.pagoForm.controls).forEach(key => {
      const control = this.pagoForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  onCancel(): void {
    if (confirm('¿Estás seguro de que quieres cancelar? Los datos no guardados se perderán.')) {
      this.router.navigate(['/pagos']);
    }
  }

  get f() { 
    return this.pagoForm.controls; 
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  volverALista(): void {
    this.router.navigate(['/pagos']);
  }

  getInfoPlanPago(): string {
    if (this.clienteMembresiaActiva?.planPago) {
      const plan = this.clienteMembresiaActiva.planPago;
      const descuento = (1 - plan.factorDescuento) * 100;
      return `${plan.nombre} - ${Math.round(descuento)}% descuento`;
    }
    return 'Plan estándar (0% descuento)';
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    
    try {
      let fechaObj: Date;
      
      if (typeof fecha === 'string') {
        // Intentar parsear diferentes formatos de fecha
        fechaObj = new Date(fecha);
        
        // Si el parsing directo falla, intentar con formato ISO
        if (isNaN(fechaObj.getTime())) {
          // Intentar con formato ISO (común en APIs)
          fechaObj = new Date(fecha.replace(' ', 'T'));
        }
      } else if (fecha instanceof Date) {
        fechaObj = fecha;
      } else if (fecha && typeof fecha === 'object') {
        // Si es un objeto con timestamp
        fechaObj = new Date(fecha);
      } else {
        return 'N/A';
      }
      
      if (isNaN(fechaObj.getTime())) {
        console.warn('⚠️ Fecha inválida:', fecha);
        return 'N/A';
      }
      
      return fechaObj.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('❌ Error al formatear fecha:', error, 'Fecha original:', fecha);
      return 'N/A';
    }
  }

  getFechasMembresia(): {inicio: string, fin: string} {
    if (!this.clienteMembresiaActiva) {
      return { inicio: 'N/A', fin: 'N/A' };
    }

    console.log('🔍 Buscando fechas en:', this.clienteMembresiaActiva);

    // Buscar propiedades de fecha de manera más robusta
    const posiblesInicios = [
      'fecha_inicio', 'fechaInicio', 'fecha_inicio_membresia', 'inicio', 
      'fechaInicioMembresia', 'fecha_inicio_membresia_cliente', 'inicioVigencia',
      'fechaInicioVigencia', 'start_date', 'startDate', 'fechaInicioVigencia',
      'fecha_inicio_vigencia', 'inicio_vigencia'
    ];

    const posiblesFines = [
      'fecha_fin', 'fechaFin', 'fecha_fin_membresia', 'fin', 
      'fechaFinMembresia', 'fecha_fin_membresia_cliente', 'finVigencia',
      'fechaFinVigencia', 'end_date', 'endDate', 'fechaFinVigencia',
      'fecha_fin_vigencia', 'fin_vigencia'
    ];

    let fechaInicio: any = null;
    let fechaFin: any = null;

    // Buscar fecha de inicio
    for (const prop of posiblesInicios) {
      if ((this.clienteMembresiaActiva as any)[prop]) {
        fechaInicio = (this.clienteMembresiaActiva as any)[prop];
        console.log(`✅ Encontrada fecha inicio en propiedad: ${prop}`, fechaInicio);
        break;
      }
    }

    // Buscar fecha de fin
    for (const prop of posiblesFines) {
      if ((this.clienteMembresiaActiva as any)[prop]) {
        fechaFin = (this.clienteMembresiaActiva as any)[prop];
        console.log(`✅ Encontrada fecha fin en propiedad: ${prop}`, fechaFin);
        break;
      }
    }

    return {
      inicio: this.formatearFecha(fechaInicio),
      fin: this.formatearFecha(fechaFin)
    };
  }

  getDescuentoAplicado(): string {
    if (this.clienteMembresiaActiva?.planPago) {
      const descuento = (1 - this.clienteMembresiaActiva.planPago.factorDescuento) * 100;
      return `${Math.round(descuento)}%`;
    }
    return '0%';
  }

  getNombrePlanCompleto(): string {
    if (!this.clienteMembresiaActiva?.planPago) {
      return 'Plan Mensual';
    }
    
    const plan = this.clienteMembresiaActiva.planPago;
    const descuento = (1 - plan.factorDescuento) * 100;
    
    if (this.mesesCubiertosPlan > 1) {
      return `${plan.nombre} - ${Math.round(descuento)}% descuento - ${this.mesesCubiertosPlan} meses`;
    } else {
      return `${plan.nombre} - ${Math.round(descuento)}% descuento - 1 mes`;
    }
  }

  esPlanMultiMes(): boolean {
    return this.mesesCubiertosPlan > 1;
  }

  getNombreRecepcionista(): string {
    return this.recepcionistaLogueado?.nombreCompleto || 
           this.recepcionistaLogueado?.username || 
           'Recepcionista';
  }

  getRolRecepcionista(): string {
    return this.recepcionistaLogueado?.tipoUsuario || 
           this.recepcionistaLogueado?.nombreRol || 
           this.recepcionistaLogueado?.rol || 
           'Recepcionista';
  }

  // Mejora: Método para obtener clase CSS dinámica
  getClaseCampo(campo: string): string {
    const control = this.pagoForm.get(campo);
    if (!control) return '';
    
    if (control.invalid && control.touched) {
      return 'error';
    } else if (control.valid && control.touched) {
      return 'success';
    } else if (this.campoFocused[campo]) {
      return 'focused';
    }
    return '';
  }

  // Nueva función: Obtener stock status
  getStockStatus(stock: number): string {
    if (stock > 20) return 'alto';
    if (stock > 10) return 'medio';
    if (stock > 0) return 'bajo';
    return 'agotado';
  }
}