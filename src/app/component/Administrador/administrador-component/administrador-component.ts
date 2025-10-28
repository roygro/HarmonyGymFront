// administrador.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { Administrador, AdministradorService } from '../../../services/administrador/administradorService';
import { HeaderAdministradorComponent } from '../header-admin/header-admin'; // Importar el header

@Component({
  selector: 'app-administrador-component',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, HeaderAdministradorComponent],
  templateUrl: './administrador-component.html',
  styleUrls: ['./administrador-component.css']
})
export class AdministradorComponent implements OnInit {
  administradores: Administrador[] = [];
  administradoresFiltrados: Administrador[] = [];
  
  administradorSeleccionado: Administrador = this.inicializarAdministrador();
  nuevoAdministrador: any = this.inicializarNuevoAdministrador();
  
  // Variables para filtros con debounce
  private filtroAppSubject = new Subject<string>();
  private filtroApmSubject = new Subject<string>();
  private busquedaNombreSubject = new Subject<string>();
  
  folioGenerado: string = 'ADM001';
  modoEdicion: boolean = false;
  mostrarFormulario: boolean = false;
  mostrarEstadisticas: boolean = false;
  cargando: boolean = false;
  nombreInvalido: boolean = false;
  
  filtroApp: string = '';
  filtroApm: string = '';
  terminoBusqueda: string = '';
  
  estadisticas: any = {
    totalGestiones: 0,
    totalMembresiasActivas: 0,
    totalClientesActivos: 0,
    totalInstructoresActivos: 0,
    totalRecepcionistasActivos: 0,
    ingresosHoy: 0
  };

  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | 'warning' = 'success';

  constructor(private administradorService: AdministradorService) {}

  ngOnInit(): void {
    this.cargarAdministradores();
    
    // Configurar debounce para filtros (300ms)
    this.filtroAppSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(app => {
      this.aplicarFiltros();
    });

    this.filtroApmSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(apm => {
      this.aplicarFiltros();
    });

    this.busquedaNombreSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(nombre => {
      this.buscarPorNombre();
    });
  }

  private inicializarAdministrador(): Administrador {
    return {
      folioAdmin: '',
      nombreCom: '',
      app: '',
      apm: '',
      fechaRegistro: new Date().toISOString()
    };
  }

  private inicializarNuevoAdministrador(): any {
    return {
      nombreCom: '',
      app: '',
      apm: ''
    };
  }

  cargarAdministradores(): void {
    this.cargando = true;
    
    this.administradorService.obtenerTodosLosAdministradores().subscribe({
      next: (data) => {
        console.log('✅ Administradores cargados:', data);
        this.administradores = data;
        this.administradoresFiltrados = data;
        this.cargando = false;
       
        // Generar próximo folio basado en los datos existentes
        this.generarProximoFolio();
      },
      error: (error) => {
        console.error('❌ Error al cargar administradores:', error);
        
        if (error.status === 0) {
          this.mostrarMensaje('No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.', 'error');
        } else {
          this.mostrarMensaje(`Error ${error.status}: ${error.statusText}`, 'error');
        }
        this.cargando = false;
      }
    });
  }

  private generarProximoFolio(): void {
    if (this.administradores.length === 0) {
      this.folioGenerado = 'ADM001';
      return;
    }
    
    // Encontrar el folio más alto numéricamente
    const folios = this.administradores
      .map(a => a.folioAdmin)
      .filter(folio => folio.startsWith('ADM'))
      .map(folio => {
        const numeroStr = folio.replace('ADM', '');
        return parseInt(numeroStr) || 0;
      });
    
    if (folios.length === 0) {
      this.folioGenerado = 'ADM001';
      return;
    }
    
    const maxFolio = Math.max(...folios);
    this.folioGenerado = `ADM${(maxFolio + 1).toString().padStart(3, '0')}`;
  }

  // MÉTODOS MEJORADOS PARA FILTROS CON DEBOUNCE
  onFiltroAppChange(): void {
    this.filtroAppSubject.next(this.filtroApp);
  }

  onFiltroApmChange(): void {
    this.filtroApmSubject.next(this.filtroApm);
  }

  onBuscarNombreChange(): void {
    this.busquedaNombreSubject.next(this.terminoBusqueda);
  }

  aplicarFiltros(): void {
    let administradoresFiltrados = this.administradores;

    // Filtrar por apellido paterno
    if (this.filtroApp) {
      administradoresFiltrados = administradoresFiltrados.filter(admin =>
        admin.app?.toLowerCase().includes(this.filtroApp.toLowerCase())
      );
    }

    // Filtrar por apellido materno
    if (this.filtroApm) {
      administradoresFiltrados = administradoresFiltrados.filter(admin =>
        admin.apm?.toLowerCase().includes(this.filtroApm.toLowerCase())
      );
    }

    this.administradoresFiltrados = administradoresFiltrados;
  }

  buscarPorNombre(): void {
    if (!this.terminoBusqueda.trim()) {
      this.aplicarFiltros();
      return;
    }

    this.cargando = true;
    this.administradorService.buscarAdministradoresPorNombre(this.terminoBusqueda).subscribe({
      next: (data) => {
        this.administradoresFiltrados = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al buscar:', error);
        this.mostrarMensaje('Error al buscar administradores', 'error');
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroApp = '';
    this.filtroApm = '';
    this.terminoBusqueda = '';
    this.administradoresFiltrados = this.administradores;
  }

  prepararNuevoAdministrador(): void {
    this.nuevoAdministrador = this.inicializarNuevoAdministrador();
    this.mostrarFormulario = true;
    this.modoEdicion = false;
    this.mostrarEstadisticas = false;
    this.nombreInvalido = false;
    
    // Generar folio automáticamente
    this.generarProximoFolio();
  }

  validarNombre(): void {
    this.nombreInvalido = !this.nuevoAdministrador.nombreCom.trim();
  }

  crearAdministrador(): void {
    if (!this.nuevoAdministrador.nombreCom.trim()) {
      this.nombreInvalido = true;
      this.mostrarMensaje('El nombre completo es requerido', 'error');
      return;
    }

    this.cargando = true;
    
    this.administradorService.crearAdministrador(
      this.nuevoAdministrador.nombreCom,
      this.nuevoAdministrador.app,
      this.nuevoAdministrador.apm
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.mostrarMensaje(`Administrador creado exitosamente`, 'success');
          this.cargarAdministradores();
          this.cerrarFormulario();
        } else {
          this.mostrarMensaje(`Error al crear administrador: ${response.message}`, 'error');
        }
        this.cargando = false;
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Error al crear administrador';
        this.mostrarMensaje(errorMessage, 'error');
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  seleccionarAdministrador(administrador: Administrador): void {
    this.administradorSeleccionado = { ...administrador };
    this.mostrarFormulario = true;
    this.modoEdicion = true;
    this.mostrarEstadisticas = false;
  }

  actualizarAdministrador(): void {
    if (!this.administradorSeleccionado.nombreCom.trim()) {
      this.mostrarMensaje('El nombre completo es requerido', 'error');
      return;
    }

    this.cargando = true;

    this.administradorService.actualizarAdministrador(
      this.administradorSeleccionado.folioAdmin,
      this.administradorSeleccionado.nombreCom,
      this.administradorSeleccionado.app,
      this.administradorSeleccionado.apm
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.mostrarMensaje(`Administrador actualizado exitosamente`, 'success');
          this.cargarAdministradores();
          this.cerrarFormulario();
        } else {
          this.mostrarMensaje(`Error al actualizar administrador: ${response.message}`, 'error');
        }
        this.cargando = false;
      },
      error: (error) => {
        const errorMessage = error.error?.message || 'Error al actualizar administrador';
        this.mostrarMensaje(errorMessage, 'error');
        this.cargando = false;
        console.error('Error:', error);
      }
    });
  }

  eliminarAdministrador(folioAdmin: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este administrador?')) {
      this.cargando = true;
      this.administradorService.eliminarAdministrador(folioAdmin).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.mostrarMensaje('Administrador eliminado exitosamente', 'success');
            this.cargarAdministradores();
          } else {
            this.mostrarMensaje(`Error al eliminar administrador: ${response.message}`, 'error');
          }
          this.cargando = false;
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Error al eliminar administrador';
          this.mostrarMensaje(errorMessage, 'error');
          this.cargando = false;
          console.error('Error:', error);
        }
      });
    }
  }

  verEstadisticas(administrador: Administrador): void {
    this.administradorSeleccionado = administrador;
    this.mostrarEstadisticas = true;
    this.mostrarFormulario = false;

    this.administradorService.obtenerEstadisticasAdministrador(administrador.folioAdmin).subscribe({
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
    this.administradorSeleccionado = this.inicializarAdministrador();
    this.nuevoAdministrador = this.inicializarNuevoAdministrador();
    this.nombreInvalido = false;
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return 'No asignada';
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
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
}