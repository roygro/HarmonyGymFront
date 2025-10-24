import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteMembresiaService, ClienteMembresia } from '../../../services/membresia/cliente-membresia';

// Nueva interfaz que coincide con tu backend
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
}

@Component({
  selector: 'app-cliente-membresia',
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-membresia.html',
  styleUrl: './cliente-membresia.css'
})
export class ClienteMembresiaComponent implements OnInit {
  membresias: ClienteMembresia[] = [];
  membresiasFiltradas: ClienteMembresia[] = [];
  filtro: string = '';
  loading: boolean = false;
  showAsignarDialog: boolean = false;
  
  asignarFormData = {
    folioCliente: '',
    idMembresia: 'MEM_BASICA',
    fechaInicio: new Date().toISOString().split('T')[0]
  };

  tipoMembresias = [
    { value: 'MEM_BASICA', label: 'Membresía Básica' },
    { value: 'MEM_PREMIUM', label: 'Membresía Premium' },
    { value: 'MEM_VIP', label: 'Membresía VIP' }
  ];

  snackbar = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error'
  };

  constructor(private clienteMembresiaService: ClienteMembresiaService) { }

  ngOnInit(): void {
    this.cargarMembresiasActivas();
  }

  cargarMembresiasActivas(): void {
    this.loading = true;
    this.clienteMembresiaService.obtenerMembresiasActivas().subscribe({
      next: (data: any) => {
        console.log('Datos recibidos del servicio:', data);
        
        // Mapear los datos del backend a nuestra interfaz
        if (data && data.membresias && Array.isArray(data.membresias)) {
          this.membresias = data.membresias.map((item: ClienteMembresiaBackend) => this.mapearMembresiaBackend(item));
          console.log('Membresías mapeadas:', this.membresias);
        } else {
          console.warn('Formato de respuesta inesperado:', data);
          this.membresias = [];
        }
        
        this.membresiasFiltradas = [...this.membresias];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar membresías:', error);
        this.mostrarSnackbar('Error al cargar las membresías activas', 'error');
        this.membresias = [];
        this.membresiasFiltradas = [];
        this.loading = false;
      }
    });
  }

  // Método para mapear la estructura del backend a nuestra interfaz
  private mapearMembresiaBackend(backendData: ClienteMembresiaBackend): ClienteMembresia {
    return {
      id_membresia_cliente: backendData.idMembresiaCliente,
      folio_cliente: backendData.cliente.folioCliente,
      id_membresia: backendData.membresia.idMembresia,
      fecha_inicio: backendData.fechaInicio,
      fecha_fin: backendData.fechaFin,
      estatus: backendData.estatus,
      fecha_registro: backendData.fechaRegistro,
      fecha_actualizacion: backendData.fechaActualizacion || ''
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
    this.membresiasFiltradas = this.membresias.filter(membresia =>
      (membresia.folio_cliente && membresia.folio_cliente.toLowerCase().includes(filtroLower)) ||
      (membresia.id_membresia && membresia.id_membresia.toLowerCase().includes(filtroLower)) ||
      (membresia.estatus && membresia.estatus.toLowerCase().includes(filtroLower))
    );
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
    this.asignarFormData = {
      folioCliente: '',
      idMembresia: 'MEM_BASICA',
      fechaInicio: new Date().toISOString().split('T')[0]
    };
    this.showAsignarDialog = true;
  }

  asignarMembresia(): void {
    this.loading = true;
    this.clienteMembresiaService.asignarMembresia(
      this.asignarFormData.folioCliente,
      this.asignarFormData.idMembresia,
      this.asignarFormData.fechaInicio
    ).subscribe({
      next: (membresia: ClienteMembresia) => {
        this.mostrarSnackbar('Membresía asignada exitosamente', 'success');
        this.cargarMembresiasActivas();
        this.showAsignarDialog = false;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al asignar membresía:', error);
        this.mostrarSnackbar('Error al asignar la membresía: ' + error.error?.message, 'error');
        this.loading = false;
      }
    });
  }

  renovarMembresia(membresia: ClienteMembresia): void {
    if (confirm('¿Estás seguro de que deseas renovar esta membresía?')) {
      this.clienteMembresiaService.renovarMembresia(membresia.id_membresia_cliente).subscribe({
        next: (membresiaRenovada: ClienteMembresia) => {
          this.mostrarSnackbar('Membresía renovada exitosamente', 'success');
          this.cargarMembresiasActivas();
        },
        error: (error: any) => {
          console.error('Error al renovar membresía:', error);
          this.mostrarSnackbar('Error al renovar la membresía: ' + error.error?.message, 'error');
        }
      });
    }
  }

  cancelarMembresia(membresia: ClienteMembresia): void {
    if (confirm('¿Estás seguro de que deseas cancelar esta membresía?')) {
      this.clienteMembresiaService.cancelarMembresia(membresia.id_membresia_cliente).subscribe({
        next: (membresiaCancelada: ClienteMembresia) => {
          this.mostrarSnackbar('Membresía cancelada exitosamente', 'success');
          this.cargarMembresiasActivas();
        },
        error: (error: any) => {
          console.error('Error al cancelar membresía:', error);
          this.mostrarSnackbar('Error al cancelar la membresía: ' + error.error?.message, 'error');
        }
      });
    }
  }

  verificarAcceso(membresia: ClienteMembresia): void {
    this.clienteMembresiaService.verificarAcceso(membresia.folio_cliente).subscribe({
      next: (response: any) => {
        const mensaje = response.tieneAcceso 
          ? `✅ ${response.mensaje}`
          : `❌ ${response.mensaje}`;
        this.mostrarSnackbar(mensaje, response.tieneAcceso ? 'success' : 'error');
      },
      error: (error: any) => {
        console.error('Error al verificar acceso:', error);
        this.mostrarSnackbar('Error al verificar acceso', 'error');
      }
    });
  }

  verHistorial(membresia: ClienteMembresia): void {
    this.clienteMembresiaService.obtenerHistorialMembresias(membresia.folio_cliente).subscribe({
      next: (historial: any) => {
        let historialArray: ClienteMembresia[] = [];
        
        if (historial && historial.historial && Array.isArray(historial.historial)) {
          historialArray = historial.historial.map((item: ClienteMembresiaBackend) => this.mapearMembresiaBackend(item));
        }
        
        const mensaje = `Historial de ${membresia.folio_cliente}: ${historialArray.length} membresías`;
        this.mostrarSnackbar(mensaje, 'success');
      },
      error: (error: any) => {
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
      },
      error: (error: any) => {
        console.error('Error al cargar membresías por expirar:', error);
        this.mostrarSnackbar('Error al cargar membresías por expirar', 'error');
        this.loading = false;
      }
    });
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

  // Métodos auxiliares para la UI
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
    if (!idMembresia) return 'Desconocida';
    
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
    if (!fechaString) return 'Fecha no disponible';
    
    try {
      return new Date(fechaString).toLocaleDateString('es-MX');
    } catch (error) {
      console.warn('Fecha inválida:', fechaString);
      return 'Fecha inválida';
    }
  }

  mostrarSnackbar(mensaje: string, type: 'success' | 'error'): void {
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

  calcularTasaRenovacion(): number {
    return 75;
  }

  hayMembresias(): boolean {
    return Array.isArray(this.membresias) && this.membresias.length > 0;
  }
}