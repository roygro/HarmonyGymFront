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
  clientes: Cliente[] = [];
  recepcionistas: Recepcionista[] = [];
  membresias: Membresia[] = []; // Nueva propiedad para membresías
  
  cargando: boolean = true;
  enviando: boolean = false;
  productoSeleccionado: Producto | null = null;
  membresiaSeleccionada: Membresia | null = null;

  constructor(
    private fb: FormBuilder,
    private pagoService: PagoService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private recepcionistaService: RecepcionistaService,
    private membresiaService: MembresiaService, // Inyectar servicio de membresías
    private router: Router
  ) {
    this.pagoForm = this.createForm();
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargando = true;

    Promise.all([
      this.cargarProductos(),
      this.cargarClientes(),
      this.cargarRecepcionistas(),
      this.cargarMembresias() // Cargar membresías
    ]).finally(() => {
      this.cargando = false;
      this.setupCalculos();
    });
  }

  cargarMembresias(): Promise<void> {
    return new Promise((resolve) => {
      this.membresiaService.getMembresiasActivas().subscribe({
        next: (membresias) => {
          this.membresias = membresias;
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

  cargarRecepcionistas(): Promise<void> {
    return new Promise((resolve) => {
      this.recepcionistaService.obtenerRecepcionistas().subscribe({
        next: (recepcionistas) => {
          this.recepcionistas = recepcionistas;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar recepcionistas:', error);
          this.recepcionistas = [];
          resolve();
        }
      });
    });
  }

  cargarProductos(): Promise<void> {
    return new Promise((resolve) => {
      this.productoService.obtenerProductos().subscribe({
        next: (productos) => {
          this.productos = productos;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar productos:', error);
          this.productos = [];
          resolve();
        }
      });
    });
  }

  cargarClientes(): Promise<void> {
    return new Promise((resolve) => {
      this.clienteService.obtenerTodosLosClientes().subscribe({
        next: (clientes) => {
          this.clientes = clientes;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          this.clientes = [];
          resolve();
        }
      });
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      tipoPago: ['', [Validators.required]], // Nuevo campo para tipo de pago
      idRecepcionista: ['', [Validators.required]],
      codigoProducto: [''], // Hacer opcional ya que no siempre se usará
      idMembresia: [''], // Nuevo campo para membresía
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      total: [0, [Validators.required, Validators.min(0)]],
      folioCliente: ['', [Validators.required]]
    });
  }

  onTipoPagoChange(): void {
    const tipoPago = this.pagoForm.get('tipoPago')?.value;
    
    // Resetear campos según el tipo de pago
    if (tipoPago === 'producto') {
      this.pagoForm.patchValue({
        idMembresia: '',
        cantidad: 1
      });
      // Agregar validación requerida para producto
      this.pagoForm.get('codigoProducto')?.setValidators([Validators.required]);
      this.pagoForm.get('idMembresia')?.clearValidators();
    } else if (tipoPago === 'membresia') {
      this.pagoForm.patchValue({
        codigoProducto: '',
        cantidad: 1 // Membresías siempre son cantidad 1
      });
      // Agregar validación requerida para membresía
      this.pagoForm.get('idMembresia')?.setValidators([Validators.required]);
      this.pagoForm.get('codigoProducto')?.clearValidators();
    }
    
    // Actualizar validaciones
    this.pagoForm.get('codigoProducto')?.updateValueAndValidity();
    this.pagoForm.get('idMembresia')?.updateValueAndValidity();
    
    this.calcularTotal();
  }

  setupCalculos(): void {
    this.pagoForm.get('cantidad')?.valueChanges.subscribe(() => this.calcularTotal());
    this.pagoForm.get('precioUnitario')?.valueChanges.subscribe(() => this.calcularTotal());
    
    // Suscribirse a cambios en producto
    this.pagoForm.get('codigoProducto')?.valueChanges.subscribe(codigo => {
      this.actualizarPrecioProducto(codigo);
    });
    
    // Suscribirse a cambios en membresía
    this.pagoForm.get('idMembresia')?.valueChanges.subscribe(idMembresia => {
      this.actualizarPrecioMembresia(idMembresia);
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
    }
  }

  actualizarPrecioMembresia(idMembresia: string): void {
    const membresia = this.membresias.find(m => m.idMembresia === idMembresia);
    if (membresia) {
      this.membresiaSeleccionada = membresia;
      this.pagoForm.patchValue({
        precioUnitario: membresia.precio,
        cantidad: 1 // Membresías siempre son cantidad 1
      });
      this.calcularTotal();
    }
  }

  calcularTotal(): void {
    const cantidad = this.pagoForm.get('cantidad')?.value || 0;
    const precioUnitario = this.pagoForm.get('precioUnitario')?.value || 0;
    const total = cantidad * precioUnitario;
    this.pagoForm.patchValue({ total: this.redondearDecimales(total, 2) });
  }

  redondearDecimales(numero: number, decimales: number): number {
    return Number(numero.toFixed(decimales));
  }

  onPrecioManualChange(): void {
    setTimeout(() => {
      this.calcularTotal();
    }, 100);
  }

  onSubmit(): void {
    if (this.pagoForm.valid) {
      this.enviando = true;
      
      const tipoPago = this.pagoForm.get('tipoPago')?.value;
      
      // Preparar datos según el tipo de pago
      const pagoData: any = {
        idRecepcionista: this.pagoForm.get('idRecepcionista')?.value,
        cantidad: this.pagoForm.get('cantidad')?.value,
        precioUnitario: this.pagoForm.get('precioUnitario')?.value,
        total: this.pagoForm.get('total')?.value,
        folioCliente: this.pagoForm.get('folioCliente')?.value,
        tipoPago: tipoPago // Agregar tipo de pago a los datos
      };

      // Agregar campos específicos según el tipo
      if (tipoPago === 'producto') {
        pagoData.codigoProducto = this.pagoForm.get('codigoProducto')?.value;
      } else if (tipoPago === 'membresia') {
        pagoData.idMembresia = this.pagoForm.get('idMembresia')?.value;
      }

      this.pagoService.crearPago(pagoData).subscribe({
        next: (pagoCreado) => {
          this.enviando = false;
          const mensaje = tipoPago === 'membresia' 
            ? `¡Pago de membresía registrado exitosamente!\nID: ${pagoCreado.idVenta}\nTotal: ${this.formatearMoneda(pagoCreado.total)}`
            : `¡Pago de producto registrado exitosamente!\nID: ${pagoCreado.idVenta}\nTotal: ${this.formatearMoneda(pagoCreado.total)}`;
          
          alert(mensaje);
          this.router.navigate(['/pagos']);
        },
        error: (error) => {
          this.enviando = false;
          const errorMsg = error.error?.message || error.error || error.message || 'Error desconocido';
          alert('Error al registrar el pago: ' + errorMsg);
          console.error('Error completo:', error);
        }
      });
    } else {
      Object.keys(this.pagoForm.controls).forEach(key => {
        const control = this.pagoForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      alert('Por favor completa todos los campos requeridos correctamente.');
    }
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
}