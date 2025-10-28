import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PagoService, Pago } from '../../../services/pagos/pago';
import { ProductoService, Producto } from '../../../services/productos/producto';
import { ClienteService, Cliente } from '../../../services/cliente/ClienteService';
import { RecepcionistaService, Recepcionista } from '../../../services/recepcionista/recepcionistaService';
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
  
  cargando: boolean = true;
  enviando: boolean = false;
  productoSeleccionado: Producto | null = null;

  constructor(
    private fb: FormBuilder,
    private pagoService: PagoService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
    private recepcionistaService: RecepcionistaService,
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
      this.cargarRecepcionistas()
    ]).finally(() => {
      this.cargando = false;
      this.setupCalculos();
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
      idRecepcionista: ['', [Validators.required]],
      codigoProducto: ['', [Validators.required]],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      total: [0, [Validators.required, Validators.min(0)]],
      folioCliente: ['', [Validators.required]]
    });
  }

  setupCalculos(): void {
    this.pagoForm.get('cantidad')?.valueChanges.subscribe(() => this.calcularTotal());
    this.pagoForm.get('precioUnitario')?.valueChanges.subscribe(() => this.calcularTotal());
    this.pagoForm.get('codigoProducto')?.valueChanges.subscribe(codigo => {
      this.actualizarPrecioProducto(codigo);
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
      
      const pagoData: Pago = {
        idRecepcionista: this.pagoForm.get('idRecepcionista')?.value,
        codigoProducto: this.pagoForm.get('codigoProducto')?.value,
        cantidad: this.pagoForm.get('cantidad')?.value,
        precioUnitario: this.pagoForm.get('precioUnitario')?.value,
        total: this.pagoForm.get('total')?.value,
        folioCliente: this.pagoForm.get('folioCliente')?.value
      };

      this.pagoService.crearPago(pagoData).subscribe({
        next: (pagoCreado) => {
          this.enviando = false;
          alert(`¡Pago registrado exitosamente!\nID: ${pagoCreado.idVenta}\nTotal: $${pagoCreado.total}`);
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