import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Recepcionista, RecepcionistaEstadisticas, RecepcionistaService } from '../../../services/recepcionista/recepcionistaService';

@Component({
  selector: 'app-recepcionista-component',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './recepcionista-component.html',
  styleUrls: ['./recepcionista-component.css']
})
export class RecepcionistaComponent implements OnInit {
  recepcionistas: Recepcionista[] = [];
  recepcionistasFiltrados: Recepcionista[] = [];
  
  recepcionistaSeleccionado: Recepcionista = this.inicializarRecepcionista();
  nuevoRecepcionista: Recepcionista = this.inicializarRecepcionista();
  
  // Variables para filtros con debounce
  private filtroEstatusSubject = new Subject<string>();
  private busquedaNombreSubject = new Subject<string>();
  
  idGenerado: string = 'REC001';
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  mostrarEstadisticas: boolean = false;
  cargando: boolean = false;
  nombreInvalido: boolean = false;
  
  filtroEstatus: string = '';
  terminoBusqueda: string = '';
  
  estadisticas: RecepcionistaEstadisticas = {
    totalRegistros: 0,
    totalVentas: 0,
    totalIngresos: 0,
    registrosUltimoMes: 0
  };

  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'warning' = 'success';

  constructor(private recepcionistaService: RecepcionistaService) {}

  ngOnInit(): void {
    this.cargarRecepcionistas();
    
    // Configurar debounce para filtros (300ms)
    this.filtroEstatusSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(estatus => {
      this.aplicarFiltros();
    });

    this.busquedaNombreSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(nombre => {
      this.buscarPorNombre();
    });
  }

  private inicializarRecepcionista(): Recepcionista {
    const today = new Date().toISOString().split('T')[0];
    return {
      idRecepcionista: '',
      nombre: '',
      telefono: '',
      email: '',
      fechaContratacion: today,
      estatus: 'Activo',
      fechaRegistro: new Date()
    };
  }

  cargarRecepcionistas(): void {
    this.cargando = true;
    
    this.recepcionistaService.obtenerRecepcionistas().subscribe({
      next: (data) => {
        console.log('✅ Recepcionistas cargados:', data);
        this.recepcionistas = data;
        this.recepcionistasFiltrados = data;
        this.cargando = false;
       
        // Generar próximo ID basado en los datos existentes
        this.generarProximoId();
      },
      error: (error) => {
        console.error('❌ Error al cargar recepcionistas:', error);
        
        if (error.status === 0) {
          this.mostrarMensaje('No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.', 'error');
        } else {
          this.mostrarMensaje(`Error ${error.status}: ${error.statusText}`, 'error');
        }
        this.cargando = false;
      }
    });
  }

  private generarProximoId(): void {
    if (this.recepcionistas.length === 0) {
      this.idGenerado = 'REC001';
      return;
    }
    
    // Encontrar el ID más alto numéricamente
    const ids = this.recepcionistas
      .map(r => r.idRecepcionista)
      .filter(id => id.startsWith('REC'))
      .map(id => {
        const numeroStr = id.replace('REC', '');
        return parseInt(numeroStr) || 0;
      });
    
    if (ids.length === 0) {
      this.idGenerado = 'REC001';
      return;
    }
    
    const maxId = Math.max(...ids);
    this.idGenerado = `REC${(maxId + 1).toString().padStart(3, '0')}`;
  }

  // MÉTODOS MEJORADOS PARA FILTROS CON DEBOUNCE
  onFiltroEstatusChange(): void {
    this.filtroEstatusSubject.next(this.filtroEstatus);
  }

  onBuscarNombreChange(): void {
    this.busquedaNombreSubject.next(this.terminoBusqueda);
  }

  aplicarFiltros(): void {
    this.cargando = true;
    this.recepcionistaService.obtenerRecepcionistasFiltrados(
      this.filtroEstatus || undefined
    ).subscribe({
      next: (data) => {
        this.recepcionistasFiltrados = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al aplicar filtros:', error);
        this.mostrarMensaje('Error al aplicar filtros', 'error');
        this.cargando = false;
      }
    });
  }

  buscarPorNombre(): void {
    if (!this.terminoBusqueda.trim()) {
      this.aplicarFiltros();
      return;
    }

    this.cargando = true;
    this.recepcionistaService.buscarRecepcionistasPorNombre(this.terminoBusqueda).subscribe({
      next: (data) => {
        this.recepcionistasFiltrados = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar:', error);
        this.mostrarMensaje('Error al buscar recepcionistas', 'error');
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroEstatus = '';
    this.terminoBusqueda = '';
    this.recepcionistasFiltrados = this.recepcionistas;
  }

  prepararNuevoRecepcionista(): void {
    this.nuevoRecepcionista = this.inicializarRecepcionista();
    this.mostrarFormulario = true;
    this.modoEdicion = false;
    this.mostrarEstadisticas = false;
    this.nombreInvalido = false;
    
    // Generar ID automáticamente
    this.generarProximoId();
  }

  validarNombre(): void {
    this.nombreInvalido = !this.nuevoRecepcionista.nombre.trim();
  }

  crearRecepcionista(): void {
    if (!this.nuevoRecepcionista.nombre.trim()) {
      this.nombreInvalido = true;
      this.mostrarMensaje('El nombre es requerido', 'error');
      return;
    }

    this.cargando = true;
    
    this.recepcionistaService.crearRecepcionista(
      this.nuevoRecepcionista.nombre,
      this.nuevoRecepcionista.telefono || '',
      this.nuevoRecepcionista.email || '',
      this.nuevoRecepcionista.fechaContratacion,
      this.nuevoRecepcionista.estatus
    ).subscribe({
      next: (recepcionista) => {
        this.mostrarMensaje(`Recepcionista ${recepcionista.idRecepcionista} creado exitosamente`, 'success');
        this.cargarRecepcionistas();
        this.cerrarFormulario();
        this.cargando = false;
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Error al crear recepcionista';
        this.mostrarMensaje(errorMessage, 'error');
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  seleccionarRecepcionista(recepcionista: Recepcionista): void {
    this.recepcionistaSeleccionado = { 
      ...recepcionista,
      fechaContratacion: recepcionista.fechaContratacion || new Date().toISOString().split('T')[0]
    };
    
    this.mostrarFormulario = true;
    this.modoEdicion = true;
    this.mostrarEstadisticas = false;
  }

  actualizarRecepcionista(): void {
    if (!this.recepcionistaSeleccionado.nombre.trim()) {
      this.mostrarMensaje('El nombre es requerido', 'error');
      return;
    }

    this.cargando = true;

    this.recepcionistaService.actualizarRecepcionista(
      this.recepcionistaSeleccionado.idRecepcionista,
      this.recepcionistaSeleccionado.nombre,
      this.recepcionistaSeleccionado.telefono || '',
      this.recepcionistaSeleccionado.email || '',
      this.recepcionistaSeleccionado.fechaContratacion,
      this.recepcionistaSeleccionado.estatus
    ).subscribe({
      next: (recepcionista) => {
        this.mostrarMensaje(`Recepcionista ${recepcionista.idRecepcionista} actualizado exitosamente`, 'success');
        this.cargarRecepcionistas();
        this.cerrarFormulario();
        this.cargando = false;
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Error al actualizar recepcionista';
        this.mostrarMensaje(errorMessage, 'error');
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  eliminarRecepcionista(idRecepcionista: string): void {
    if (confirm('¿Estás seguro de que deseas desactivar este recepcionista?')) {
      this.cargando = true;
      this.recepcionistaService.eliminarRecepcionista(idRecepcionista).subscribe({
        next: () => {
          this.mostrarMensaje('Recepcionista desactivado exitosamente', 'success');
          this.cargarRecepcionistas();
          this.cargando = false;
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Error al desactivar recepcionista';
          this.mostrarMensaje(errorMessage, 'error');
          this.cargando = false;
          console.error('Error:', error);
        }
      });
    }
  }

  activarRecepcionista(idRecepcionista: string): void {
    this.cargando = true;
    this.recepcionistaService.activarRecepcionista(idRecepcionista).subscribe({
      next: () => {
        this.mostrarMensaje('Recepcionista activado exitosamente', 'success');
        this.cargarRecepcionistas();
        this.cargando = false;
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Error al activar recepcionista';
        this.mostrarMensaje(errorMessage, 'error');
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  verEstadisticas(recepcionista: Recepcionista): void {
    this.recepcionistaSeleccionado = recepcionista;
    this.mostrarEstadisticas = true;
    this.mostrarFormulario = false;

    this.recepcionistaService.obtenerEstadisticas(recepcionista.idRecepcionista).subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
      },
      error: (error) => {
        this.mostrarMensaje('Error al cargar estadísticas', 'error');
        console.error('Error:', error);
      }
    });
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.mostrarEstadisticas = false;
    this.recepcionistaSeleccionado = this.inicializarRecepcionista();
    this.nuevoRecepcionista = this.inicializarRecepcionista();
    this.nombreInvalido = false;
  }

  obtenerClaseEstatus(estatus: string): string {
    switch (estatus) {
      case 'Activo': return 'estatus-activo';
      case 'Inactivo': return 'estatus-inactivo';
      default: return 'estatus-desconocido';
    }
  }

  formatearFecha(fecha: string | Date | null): string {
    if (!fecha) return 'No asignada';
    try {
      const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return fechaObj.toLocaleDateString('es-ES');
    } catch (e) {
      return 'Fecha inválida';
    }
  }
}