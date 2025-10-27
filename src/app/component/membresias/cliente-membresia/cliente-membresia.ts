import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // Importa HttpClient
import { ClienteMembresiaService, ClienteMembresia } from '../../../services/membresia/cliente-membresia';
import { HeaderRecepcionistaComponent } from '../../recepcionista/header-recepcionista/header-recepcionista';

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
  imports: [CommonModule, FormsModule, HeaderRecepcionistaComponent],
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
    idMembresia: '',
    fechaInicio: new Date().toISOString().split('T')[0]
    
  };

  // Lista inicial vacía - se llenará con datos reales
  tipoMembresias: any[] = [];

 // Cambia esta parte en tu componente TypeScript
snackbar = {
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'warning'  // Agrega 'warning'
};

// Agrega estas variables después de las que ya tienes
showHistorialModal: boolean = false;
historialData: any[] = [];
clienteHistorial: string = '';
loadingHistorial: boolean = false;

  constructor(
    private clienteMembresiaService: ClienteMembresiaService,
    private http: HttpClient // Inyecta HttpClient
  ) { }

  ngOnInit(): void {
    this.verificarMembresiasDisponibles(); // Primero verifica las membresías disponibles
    this.cargarMembresiasActivas();
  }

  // NUEVO MÉTODO: Verificar membresías disponibles en el backend
  verificarMembresiasDisponibles(): void {
    console.log('Verificando membresías disponibles...');
    
    this.http.get('http://localhost:8081/api/membresias').subscribe({
      next: (membresias: any) => {
        console.log('Membresías disponibles en la base de datos:', membresias);
        
        if (membresias && Array.isArray(membresias) && membresias.length > 0) {
          // Mapear las membresías reales del backend
          this.tipoMembresias = membresias.map((memb: any) => ({
            value: memb.id_membresia || memb.idMembresia,
            label: memb.tipo || memb.descripcion || memb.id_membresia
          }));
          
          console.log('Tipos de membresía actualizados:', this.tipoMembresias);
          
          // Establecer el primer tipo como valor por defecto
          if (this.tipoMembresias.length > 0) {
            this.asignarFormData.idMembresia = this.tipoMembresias[0].value;
          }
          
          this.mostrarSnackbar(`${this.tipoMembresias.length} tipos de membresía cargados`, 'success');
        } else {
          console.warn('No hay tipos de membresía configurados en el sistema');
          this.tipoMembresias = [];
          this.mostrarSnackbar('No hay tipos de membresía configurados en el sistema', 'warning');
        }
      },
      error: (error) => {
        console.error('Error al obtener membresías:', error);
        this.tipoMembresias = [];
        this.mostrarSnackbar('Error al cargar tipos de membresía disponibles', 'error');
      }
    });
  }

  // NUEVO MÉTODO: Crear membresías de prueba si no existen
  crearMembresiasDePrueba(): void {
    console.log('Creando membresías de prueba...');
    
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
          console.log(`Membresía ${membresia.tipo} creada:`, response);
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

cargarMembresiasActivas(): void {
  this.loading = true;
  this.clienteMembresiaService.obtenerMembresiasActivas().subscribe({
    next: (data: any) => {
      console.log('Datos recibidos del servicio:', data);
      
      if (data && data.membresias && Array.isArray(data.membresias)) {
        // Mapear correctamente la estructura del backend
        this.membresias = data.membresias.map((item: any) => this.mapearMembresiaBackend(item));
      } else if (data && Array.isArray(data)) {
        this.membresias = data.map((item: any) => this.mapearMembresiaBackend(item));
      } else {
        console.warn('Formato de respuesta inesperado:', data);
        this.membresias = [];
      }
      
      console.log('Membresías después del mapeo:', this.membresias);
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

private mapearMembresiaBackend(backendData: any): ClienteMembresia {
  console.log('Mapeando datos del backend:', backendData);
  
  return {
    id_membresia_cliente: backendData.idMembresiaCliente || backendData.id_membresia_cliente,
    folio_cliente: backendData.cliente?.folioCliente || backendData.folio_cliente || 'Desconocido',
    id_membresia: backendData.membresia?.idMembresia || backendData.id_membresia || 'Desconocida',
    fecha_inicio: backendData.fechaInicio || backendData.fecha_inicio || '',
    fecha_fin: backendData.fechaFin || backendData.fecha_fin || '',
    estatus: backendData.estatus || 'Desconocido',
    fecha_registro: backendData.fechaRegistro || backendData.fecha_registro || '',
    fecha_actualizacion: backendData.fechaActualizacion || backendData.fecha_actualizacion || ''
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
    // Verificar si hay tipos de membresía disponibles antes de abrir el diálogo
    if (this.tipoMembresias.length === 0) {
      this.mostrarSnackbar('No hay tipos de membresía disponibles. Configure membresías primero.', 'error');
      return;
    }

    this.asignarFormData = {
      folioCliente: '',
      idMembresia: this.tipoMembresias.length > 0 ? this.tipoMembresias[0].value : '',
      fechaInicio: new Date().toISOString().split('T')[0]
    };
    this.showAsignarDialog = true;
  }

  asignarMembresia(): void {
    // Validación adicional
    if (!this.asignarFormData.folioCliente || !this.asignarFormData.idMembresia) {
      this.mostrarSnackbar('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    this.loading = true;
    console.log('Asignando membresía con datos:', this.asignarFormData);

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
        console.error('Error completo al asignar membresía:', error);
        
        let mensajeError = 'Error al asignar la membresía';
        if (error.error?.message) {
          mensajeError += ': ' + error.error.message;
        } else if (error.status === 400) {
          mensajeError += ': Datos inválidos enviados al servidor';
        } else if (error.status === 404) {
          mensajeError += ': Cliente o tipo de membresía no encontrado';
        }
        
        this.mostrarSnackbar(mensajeError, 'error');
        this.loading = false;
      }
    });
  }

  // ... (el resto de tus métodos existentes se mantienen igual)

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

  // POR ESTE MÉTODO MEJORADO:
// REEMPLAZA el método verificarAcceso actual por este:
verificarAcceso(membresia: ClienteMembresia): void {
  this.clienteMembresiaService.verificarAcceso(membresia.folio_cliente).subscribe({
    next: (response: any) => {
      console.log('Respuesta verificar acceso:', response); // Para debug
      
      // El backend retorna {success: true, tieneAcceso: boolean, mensaje: string}
      if (response.success) {
        if (response.tieneAcceso) {
          // ✅ Acceso permitido
          this.mostrarSnackbar(`✅ ${response.mensaje} - ${membresia.folio_cliente}`, 'success');
          this.registrarEntradaCliente(membresia.folio_cliente);
        } else {
          // ❌ Acceso denegado
          const mensaje = response.mensaje || response.message || 'Acceso denegado';
          this.mostrarSnackbar(`❌ ${mensaje}`, 'error');
          
          // Sugerencias - CON VALIDACIÓN SEGURA
          if (mensaje && typeof mensaje === 'string') {
            if (mensaje.includes('expirada')) {
              this.sugerirRenovacion(membresia);
            } else if (mensaje.includes('No tiene membresía') || mensaje.includes('no tiene membresía')) {
              this.sugerirAsignarMembresia(membresia.folio_cliente);
            }
          }
        }
      } else {
        // Error en la respuesta del servidor
        this.mostrarSnackbar('Error en la verificación de acceso', 'error');
      }
    },
    error: (error: any) => {
      console.error('Error al verificar acceso:', error);
      this.mostrarSnackbar('Error al conectar con el servidor', 'error');
    }
  });
}

// AGREGA estos métodos auxiliares:
registrarEntradaCliente(folioCliente: string): void {
  console.log(`📝 Entrada registrada: ${folioCliente} - ${new Date().toLocaleString()}`);
  // Aquí puedes agregar llamada a servicio de registro de entradas
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
// POR ESTE NUEVO MÉTODO:
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

  // Métodos auxiliares para la UI - ACTUALIZADOS
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
  
  // Buscar en la lista real de membresías primero
  const membresiaEncontrada = this.tipoMembresias.find(m => m.value === idMembresia);
  if (membresiaEncontrada) {
    return membresiaEncontrada.label;
  }
  
  // Si no está en la lista, buscar en los datos del backend
  const membresia = this.membresias.find(m => m.id_membresia === idMembresia);
  if (membresia) {
    return idMembresia; // O podrías buscar el nombre en otro lugar
  }
  
  // Fallback para IDs conocidos
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
    
    // Verificar si la fecha es válida
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

  calcularTasaRenovacion(): number {
    return 75;
  }

  hayMembresias(): boolean {
    return Array.isArray(this.membresias) && this.membresias.length > 0;
  }

  // AGREGA este método nuevo:
cerrarModalHistorial(): void {
  this.showHistorialModal = false;
  this.historialData = [];
  this.clienteHistorial = '';
}


// Agrega estos métodos después del método cerrarModalHistorial()

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
}