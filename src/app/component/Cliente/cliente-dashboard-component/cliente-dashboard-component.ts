import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Servicios
import { AuthService } from '../../../services/Auth/AuthService';
import { ActividadService, Actividad, RealizaActividad } from '../../../services/instructor/ActividadService';
import { RutinaService, Rutina, EjercicioRutina, Ejercicio } from '../../../services/instructor/RutinaService';
import { ClienteService } from '../../../services/cliente/ClienteService';

// Componentes de Angular Material
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Instructor, InstructorService } from '../../../services/instructor/instructorService';

@Component({
  selector: 'app-cliente-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './cliente-dashboard-component.html',
  styleUrls: ['./cliente-dashboard-component.css']
})
export class ClienteDashboardComponent implements OnInit, OnDestroy {
  // Estado de la aplicación
  tabActiva: 'actividades' | 'rutinas' | 'perfil' = 'actividades';
  isLoading = false;
  
  // Datos del usuario
  currentUser: any;
  clienteData: any;
  
  // Actividades
  actividades: Actividad[] = [];
  actividadesFiltradas: Actividad[] = [];
  actividadesHoy: Actividad[] = [];
  actividadesInscritas: RealizaActividad[] = [];
  actividadesDisponibles: Actividad[] = [];
  
  // Rutinas
  rutinas: Rutina[] = [];
  ejerciciosCatalogo: Ejercicio[] = [];
  
  // Instructores
  instructores: Instructor[] = [];
  
  // Filtros y búsqueda
  searchTerm = '';
  filtroActivo: string = 'todas';
  
  // Formularios
  perfilForm: FormGroup;
  
  // Estadísticas
  estadisticasActividades: any = {};

  mostrarInputFotoFlag: boolean = false;
  nuevaFotoUrl: string = '';
  @ViewChild('fotoInput') fotoInput: any;

  // ===== NUEVAS PROPIEDADES PARA EL CALENDARIO Y CONTADOR =====
  private contadorActual = 0;
  private intervaloContador: any;
  semana: Date[] = [];
  diaSeleccionado: Date = new Date();

  constructor(
    private authService: AuthService,
    private actividadService: ActividadService,
    private rutinaService: RutinaService,
    private clienteService: ClienteService,
    private instructorService: InstructorService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.perfilForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      genero: ['']
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.verificarServidor();
    this.cargarDatosIniciales();
    this.inicializarSemana();
  }

  // ===== VERIFICACIÓN DEL SERVIDOR =====

  private verificarServidor(): void {
    console.log('🔍 Verificando conexión con el servidor...');
    this.clienteService.verificarServidor().subscribe({
      next: () => {
        console.log('✅ Servidor está disponible');
      },
      error: (error) => {
        console.error('❌ Servidor no disponible:', error);
        this.mostrarError('Error de conexión', 'No se puede conectar al servidor. Verifica que el backend esté funcionando en http://localhost:8081');
      }
    });
  }

  // ===== MÉTODOS PARA CAMBIAR FOTO CON URL =====

  mostrarInputFoto(): void {
    this.mostrarInputFotoFlag = true;
    this.nuevaFotoUrl = this.clienteData?.fotoUrl || '';
    
    // Enfocar el input después de que se renderice
    setTimeout(() => {
      if (this.fotoInput) {
        this.fotoInput.nativeElement.focus();
      }
    }, 100);
  }

  aplicarNuevaFoto(): void {
  if (!this.nuevaFotoUrl.trim()) {
    this.mostrarError('Error', 'Por favor ingresa una URL válida');
    return;
  }

  // Validar que sea una URL válida
  try {
    new URL(this.nuevaFotoUrl);
  } catch (e) {
    this.mostrarError('Error', 'La URL ingresada no es válida');
    return;
  }

  this.isLoading = true;
  const folioCliente = this.obtenerFolioCliente();
  
  if (!folioCliente) {
    this.mostrarError('Error', 'No se pudo identificar tu perfil');
    this.isLoading = false;
    return;
  }

  const urlCompleta = this.nuevaFotoUrl.trim();

  console.log('🔄 Guardando URL de foto en base de datos:', {
    folioCliente,
    urlCompleta,
    longitud: urlCompleta.length
  });

  // Usar el endpoint CORRECTO que ya tienes en tu controller
  this.clienteService.actualizarFotoUrl(folioCliente, urlCompleta)
    .subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          // Actualizar los datos locales
          this.clienteData = { 
            ...this.clienteData, 
            ...response.cliente,
            nombreArchivoFoto: urlCompleta
          };
          this.mostrarInputFotoFlag = false;
          this.nuevaFotoUrl = '';
          this.mostrarExito('¡Foto actualizada!', 'Tu foto de perfil se ha actualizado correctamente');
          console.log('✅ URL guardada en base de datos:', urlCompleta);
          
          // Recargar los datos para verificar
          setTimeout(() => {
            this.cargarPerfilCliente();
          }, 1000);
        } else {
          this.mostrarError('Error', response.message || 'Error al actualizar la foto');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Error al guardar URL:', error);
        
        let mensajeError = 'No se pudo guardar la URL de la foto';
        if (error.message?.includes('longa') || error.message?.includes('longitud')) {
          mensajeError = 'La URL es demasiado larga. Intenta con una URL más corta.';
        } else if (error.message?.includes('formato')) {
          mensajeError = 'La URL no tiene un formato válido. Debe comenzar con http:// o https://';
        } else if (error.message) {
          mensajeError = error.message;
        }
        
        this.mostrarError('Error', mensajeError);
      }
    });
}
  cancelarCambioFoto(): void {
    this.mostrarInputFotoFlag = false;
    this.nuevaFotoUrl = '';
  }

  // Método auxiliar para obtener la URL de la foto
  getFotoPerfil(): string {
    console.log('📸 Obteniendo foto de perfil:', {
      tieneNombreArchivoFoto: !!this.clienteData?.nombreArchivoFoto,
      nombreArchivoFoto: this.clienteData?.nombreArchivoFoto,
      clienteData: this.clienteData
    });

    // Si tenemos nombreArchivoFoto y es una URL válida, usarla
    if (this.clienteData?.nombreArchivoFoto) {
      const fotoUrl = this.clienteData.nombreArchivoFoto;
      
      // Verificar si es una URL válida
      if (fotoUrl.startsWith('http://') || fotoUrl.startsWith('https://')) {
        console.log('✅ Usando URL de foto:', fotoUrl);
        return fotoUrl;
      } else {
        console.log('⚠ nombreArchivoFoto no es una URL completa:', fotoUrl);
      }
    }
    
    console.log('🔄 Usando foto por defecto');
    return this.getFotoPorDefecto();
  }

  getFotoPorDefecto(): string {
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face';
  }

  manejarErrorImagen(event: any): void {
    console.error('❌ Error al cargar la imagen:', event);
    // Forzar el uso de la imagen por defecto
    event.target.src = this.getFotoPorDefecto();
  }


  // ===== MÉTODO CERRAR SESIÓN =====
cerrarSesion(): void {
  this.isLoading = true;
  
  // Mostrar confirmación
  const confirmar = confirm('¿Estás seguro de que quieres cerrar sesión?');
  
  if (!confirmar) {
    this.isLoading = false;
    return;
  }

  // Limpiar intervalos
  if (this.intervaloContador) {
    clearInterval(this.intervaloContador);
  }
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1000);

      
      // Redirigir al login
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1000);
    }
// ===== MÉTODO MEJORADO PARA CERRAR SESIÓN =====
confirmarCerrarSesion(): void {
  this.mostrarConfirmacionCerrarSesion();
}

private mostrarConfirmacionCerrarSesion(): void {
  // Crear elemento de modal personalizado
  const modal = document.createElement('div');
  modal.className = 'logout-modal-overlay';
  modal.innerHTML = `
    <div class="logout-modal">
      <div class="logout-modal-header">
        <div class="logout-icon">
          <i class="fas fa-sign-out-alt"></i>
        </div>
        <h3>¿Cerrar Sesión?</h3>
      </div>
      
      <div class="logout-modal-body">
        <p>¿Estás seguro de que quieres salir de tu cuenta?</p>
        <div class="logout-user-info">
          <img src="${this.getFotoPerfil()}" alt="Foto de perfil" class="logout-user-avatar">
          <div class="logout-user-details">
            <strong>${this.clienteData?.nombre || 'Usuario'}</strong>
            <span>${this.clienteData?.email || this.currentUser?.email || ''}</span>
          </div>
        </div>
      </div>
      
      <div class="logout-modal-actions">
        <button class="btn btn-cancel" id="cancelLogout">
          <i class="fas fa-times"></i>
          Cancelar
        </button>
        <button class="btn btn-confirm-logout" id="confirmLogout">
          <i class="fas fa-sign-out-alt"></i>
          Sí, Cerrar Sesión
        </button>
      </div>
    </div>
  `;

  // Agregar estilos si no existen
  this.agregarEstilosModal();

  // Agregar al DOM
  document.body.appendChild(modal);

  // Configurar event listeners
  const confirmBtn = document.getElementById('confirmLogout');
  const cancelBtn = document.getElementById('cancelLogout');

  const cerrarModal = () => {
    document.body.removeChild(modal);
  };

  confirmBtn?.addEventListener('click', () => {
    cerrarModal();
    this.ejecutarCerrarSesion();
  });

  cancelBtn?.addEventListener('click', cerrarModal);

  // Cerrar al hacer clic fuera del modal
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      cerrarModal();
    }
  });

  // Cerrar con ESC
  const keyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      cerrarModal();
      document.removeEventListener('keydown', keyHandler);
    }
  };
  document.addEventListener('keydown', keyHandler);
}

private ejecutarCerrarSesion(): void {
  this.isLoading = true;
  
  // Limpiar intervalos
  if (this.intervaloContador) {
    clearInterval(this.intervaloContador);
  }

  // Mostrar mensaje de despedida
  this.mostrarMensajeDespedida();

  // Cerrar sesión después de un breve delay
  setTimeout(() => {
    this.authService.logout();
    this.router.navigate(['/login']);
  }, 1500);
}

private mostrarMensajeDespedida(): void {
  this.snackBar.open('¡Hasta pronto! Cerrando sesión...', '', {
    duration: 1500,
    panelClass: ['snackbar-info'],
    verticalPosition: 'top'
  });
}

private agregarEstilosModal(): void {
  if (document.getElementById('logout-modal-styles')) return;

  const styles = `
    .logout-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    }

    .logout-modal {
      background: white;
      border-radius: 16px;
      padding: 0;
      width: 90%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
      overflow: hidden;
    }

    .logout-modal-header {
      background: linear-gradient(135deg, #ff6b6b, #ee5a52);
      color: white;
      padding: 24px;
      text-align: center;
      position: relative;
    }

    .logout-icon {
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 24px;
    }

    .logout-modal-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .logout-modal-body {
      padding: 24px;
      text-align: center;
    }

    .logout-modal-body p {
      margin: 0 0 20px 0;
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }

    .logout-user-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      margin-top: 16px;
    }

    .logout-user-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #e9ecef;
    }

    .logout-user-details {
      text-align: left;
    }

    .logout-user-details strong {
      display: block;
      color: #333;
      font-size: 14px;
    }

    .logout-user-details span {
      font-size: 12px;
      color: #666;
    }

    .logout-modal-actions {
      padding: 20px 24px;
      display: flex;
      gap: 12px;
      background: #f8f9fa;
    }

    .logout-modal-actions .btn {
      flex: 1;
      padding: 12px 20px;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-cancel {
      background: white;
      color: #666;
      border: 2px solid #e0e0e0;
    }

    .btn-cancel:hover {
      background: #f5f5f5;
      border-color: #ccc;
    }

    .btn-confirm-logout {
      background: linear-gradient(135deg, #ff6b6b, #ee5a52);
      color: white;
    }

    .btn-confirm-logout:hover {
      background: linear-gradient(135deg, #ff5252, #e53935);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .logout-modal {
        margin: 20px;
        width: calc(100% - 40px);
      }
      
      .logout-modal-actions {
        flex-direction: column;
      }
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.id = 'logout-modal-styles';
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
// ===== MÉTODOS DE CARGA DE DATOS =====

  cargarDatosIniciales(): void {
    this.isLoading = true;
    
    // Cargar datos en paralelo
    Promise.all([
      this.cargarPerfilCliente(),
      this.cargarActividades(),
      this.cargarRutinas(),
      this.cargarActividadesInscritas(),
      this.cargarEstadisticas(),
      this.cargarInstructores()
    ]).finally(() => {
      this.isLoading = false;
      this.inicializarSemana();
      
      setTimeout(() => {
        this.iniciarAnimacionContador(this.getTotalActividadesInscritas());
      }, 500);
    });
  }

  cargarPerfilCliente(): Promise<void> {
    return new Promise((resolve) => {
      const folioCliente = this.obtenerFolioCliente();
      if (folioCliente) {
        this.clienteService.obtenerClientePorId(folioCliente).subscribe({
          next: (cliente) => {
            this.clienteData = cliente;
            this.cargarDatosEnFormulario();
            console.log('📸 Datos del cliente cargados:', {
              nombreArchivoFoto: cliente.nombreArchivoFoto,
              clienteCompleto: cliente
            });
            resolve();
          },
          error: (error) => {
            console.error('Error al cargar perfil:', error);
            this.mostrarError('Error', 'No se pudo cargar el perfil del cliente');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  cargarActividades(): Promise<void> {
    return new Promise((resolve) => {
      this.actividadService.obtenerActividadesActivas().subscribe({
        next: (actividades) => {
          this.actividades = actividades;
          this.actividadesFiltradas = [...actividades];
          this.filtrarActividades();
          this.actividadesDisponibles = actividades.filter(actividad => 
            this.actividadService.esActividadDisponible(actividad)
          );
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar actividades:', error);
          this.actividades = [];
          this.actividadesFiltradas = [];
          this.mostrarError('Error', 'No se pudieron cargar las actividades');
          resolve();
        }
      });
    });
  }

  cargarRutinas(): Promise<void> {
    return new Promise((resolve) => {
      const folioCliente = this.obtenerFolioCliente();
      if (folioCliente) {
        this.rutinaService.obtenerRutinasAsignadasACliente(folioCliente).subscribe({
          next: (rutinas) => {
            this.rutinas = rutinas;
            this.cargarEjerciciosParaRutinas();
            resolve();
          },
          error: (error) => {
            console.error('Error al cargar rutinas:', error);
            this.rutinas = [];
            this.mostrarError('Error', 'No se pudieron cargar las rutinas');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  cargarActividadesInscritas(): Promise<void> {
    return new Promise((resolve) => {
      const folioCliente = this.obtenerFolioCliente();
      if (folioCliente) {
        this.actividadService.obtenerActividadesInscritas(folioCliente).subscribe({
          next: (response) => {
            if (response.success) {
              this.actividadesInscritas = response.data;
            }
            resolve();
          },
          error: (error) => {
            console.error('Error al cargar actividades inscritas:', error);
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  cargarEstadisticas(): Promise<void> {
    return new Promise((resolve) => {
      const folioCliente = this.obtenerFolioCliente();
      if (folioCliente) {
        this.actividadService.obtenerEstadisticasCliente(folioCliente).subscribe({
          next: (response) => {
            if (response.success) {
              this.estadisticasActividades = response.data;
            }
            resolve();
          },
          error: (error) => {
            console.error('Error al cargar estadísticas:', error);
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  cargarInstructores(): Promise<void> {
    return new Promise((resolve) => {
      this.instructorService.obtenerInstructoresActivos().subscribe({
        next: (instructores) => {
          this.instructores = instructores;
          console.log('✅ Instructores cargados:', instructores.length);
          resolve();
        },
        error: (error) => {
          console.error('❌ Error al cargar instructores:', error);
          this.instructorService.obtenerInstructores().subscribe({
            next: (instructores) => {
              this.instructores = instructores;
              console.log('✅ Instructores cargados (fallback):', instructores.length);
              resolve();
            },
            error: (error2) => {
              console.error('❌ Error al cargar instructores (fallback):', error2);
              this.mostrarError('Error', 'No se pudieron cargar los datos de instructores');
              resolve();
            }
          });
        }
      });
    });
  }

  cargarEjerciciosParaRutinas(): void {
    this.rutinas.forEach(rutina => {
      if (rutina.folioRutina) {
        this.rutinaService.obtenerEjerciciosDeRutina(rutina.folioRutina).subscribe({
          next: (ejercicios) => {
            rutina.ejercicios = ejercicios;
          },
          error: (error) => {
            console.error(`Error al cargar ejercicios para rutina ${rutina.folioRutina}:`, error);
          }
        });
      }
    });
  }

  // ===== MÉTODOS PARA EL CONTADOR ANIMADO =====

  getContadorActual(): number {
    return this.contadorActual;
  }

  iniciarAnimacionContador(valorFinal: number, duracion: number = 2000): void {
    this.contadorActual = 0;
    const incremento = valorFinal / (duracion / 50);
    
    if (this.intervaloContador) {
      clearInterval(this.intervaloContador);
    }
    
    this.intervaloContador = setInterval(() => {
      this.contadorActual += incremento;
      if (this.contadorActual >= valorFinal) {
        this.contadorActual = valorFinal;
        clearInterval(this.intervaloContador);
      }
    }, 50);
  }

  // ===== MÉTODOS PARA EL CALENDARIO SEMANAL =====

  private inicializarSemana(): void {
    const hoy = new Date();
    this.diaSeleccionado = hoy;
    
    const inicioSemana = new Date(hoy);
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    inicioSemana.setDate(diff);
    
    this.semana = [];
    for (let i = 0; i < 7; i++) {
      const diaSemana = new Date(inicioSemana);
      diaSemana.setDate(inicioSemana.getDate() + i);
      this.semana.push(diaSemana);
    }
  }

  // ===== MÉTODOS DE FORMATO CORREGIDOS PARA FECHAS =====

  formatearFecha(fecha: string | Date): string {
    return this.formatearFechaConZonaHoraria(fecha);
  }

  formatearFechaConZonaHoraria(fecha: string | Date): string {
    if (!fecha) return 'Fecha no definida';
    
    try {
      // Crear fecha en zona horaria local
      const fechaLocal = new Date(fecha);
      
      // Ajustar para compensar la diferencia de zona horaria
      const fechaAjustada = new Date(fechaLocal.getTime() + fechaLocal.getTimezoneOffset() * 60000);
      
      return fechaAjustada.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, fecha);
      return 'Fecha inválida';
    }
  }

  // Método alternativo más simple para fechas
  formatearFechaSimple(fecha: string | Date): string {
    if (!fecha) return 'Fecha no definida';
    
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha simple:', error, fecha);
      return 'Fecha inválida';
    }
  }

  formatearHora(hora: string): string {
    if (!hora) return 'Horario no definido';
    
    try {
      // Para horas en formato HH:MM:SS o HH:MM
      const [horas, minutos] = hora.split(':');
      return `${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}`;
    } catch (error) {
      console.error('Error formateando hora:', error, hora);
      return 'Hora inválida';
    }
  }

  // ===== MÉTODOS PARA COMPARACIONES DE FECHAS CORREGIDOS =====

  esHoy(dia: Date): boolean {
    const hoy = new Date();
    const diaLocal = new Date(dia);
    
    // Comparar solo año, mes y día
    return diaLocal.getFullYear() === hoy.getFullYear() &&
           diaLocal.getMonth() === hoy.getMonth() &&
           diaLocal.getDate() === hoy.getDate();
  }

  tieneActividadesDia(dia: Date): boolean {
    const diaStr = this.obtenerFechaLocalString(dia);
    return this.actividades.some(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividadStr = this.obtenerFechaLocalString(new Date(actividad.fechaActividad));
      return fechaActividadStr === diaStr;
    });
  }

  tieneInscripcionesDia(dia: Date): boolean {
    const diaStr = this.obtenerFechaLocalString(dia);
    return this.actividadesInscritas.some(inscripcion => {
      const actividad = this.actividades.find(a => a.idActividad === inscripcion.idActividad);
      if (!actividad?.fechaActividad) return false;
      const fechaActividadStr = this.obtenerFechaLocalString(new Date(actividad.fechaActividad));
      return fechaActividadStr === diaStr && inscripcion.estatus === 'Inscrito';
    });
  }

  // Método auxiliar para obtener fecha en string local (YYYY-MM-DD)
  obtenerFechaLocalString(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  seleccionarDia(dia: Date): void {
    this.diaSeleccionado = dia;
    this.filtrarActividadesPorDia(dia);
  }

  getDiaSemana(dia: Date): string {
    const dias = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    return dias[dia.getDay()];
  }

  getDiaMes(dia: Date): string {
    return dia.getDate().toString();
  }

  getActividadesDia(dia: Date): any[] {
    const diaStr = this.obtenerFechaLocalString(dia);
    return this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividadStr = this.obtenerFechaLocalString(new Date(actividad.fechaActividad));
      return fechaActividadStr === diaStr;
    }).map(actividad => ({
      nombre: actividad.nombreActividad,
      hora: actividad.horaInicio? this.formatearHora(actividad.horaInicio) : 'Horario no definido',
      tipo: 'actividad'
    }));
  }

  private filtrarActividadesPorDia(dia: Date): void {
    const diaStr = this.obtenerFechaLocalString(dia);
    this.actividadesFiltradas = this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividadStr = this.obtenerFechaLocalString(new Date(actividad.fechaActividad));
      return fechaActividadStr === diaStr;
    });
  }

  // ===== MÉTODOS DE NAVEGACIÓN Y PESTAÑAS =====

  cambiarTab(tab: 'actividades' | 'rutinas' | 'perfil'): void {
    this.tabActiva = tab;
  }

  // ===== MÉTODOS DE ACTIVIDADES =====

  buscarActividades(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      this.actividadesFiltradas = this.actividades.filter(actividad =>
        actividad.nombreActividad?.toLowerCase().includes(term) ||
        actividad.lugar?.toLowerCase().includes(term) ||
        this.getNombreInstructor(actividad).toLowerCase().includes(term)
      );
    } else {
      this.actividadesFiltradas = [...this.actividades];
    }
    this.filtrarActividades();
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.actividadesFiltradas = [...this.actividades];
    this.filtrarActividades();
  }

  // ===== MÉTODOS DE FILTRADO CORREGIDOS =====

  mostrarTodasActividades(): void {
    this.filtroActivo = 'todas';
    this.actividadesFiltradas = [...this.actividades];
    this.filtrarActividades();
  }

  mostrarActividadesHoy(): void {
    this.filtroActivo = 'hoy';
    const hoyStr = this.obtenerFechaLocalString(new Date());
    
    this.actividadesFiltradas = this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividadStr = this.obtenerFechaLocalString(new Date(actividad.fechaActividad));
      return fechaActividadStr === hoyStr;
    });
    
    this.filtrarActividades();
  }

  mostrarProximasActividades(): void {
    this.filtroActivo = 'proximas';
    const hoy = new Date();
    // Establecer hora a 0 para comparar solo fechas
    hoy.setHours(0, 0, 0, 0);
    
    this.actividadesFiltradas = this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividad = new Date(actividad.fechaActividad);
      fechaActividad.setHours(0, 0, 0, 0);
      return fechaActividad >= hoy;
    });
    
    this.filtrarActividades();
  }

  mostrarActividadesInscritas(): void {
    this.filtroActivo = 'inscritas';
    const idsActividadesInscritas = this.actividadesInscritas
      .filter(inscripcion => inscripcion.estatus === 'Inscrito')
      .map(inscripcion => inscripcion.idActividad);
    
    this.actividadesFiltradas = this.actividades.filter(actividad => 
      idsActividadesInscritas.includes(actividad.idActividad)
    );
    this.filtrarActividades();
  }

  filtrarActividades(): void {
    const hoyStr = this.obtenerFechaLocalString(new Date());
    this.actividadesHoy = this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividadStr = this.obtenerFechaLocalString(new Date(actividad.fechaActividad));
      return fechaActividadStr === hoyStr;
    });
  }

  // ===== MÉTODOS DE INSCRIPCIÓN =====

  inscribirseEnActividad(actividad: Actividad): void {
    const folioCliente = this.obtenerFolioCliente();
    if (!folioCliente) {
      this.mostrarError('Error', 'No se pudo identificar tu perfil');
      return;
    }

    this.isLoading = true;
    this.actividadService.inscribirClienteEnActividad(folioCliente, actividad.idActividad)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.mostrarExito('¡Inscripción exitosa!', response.message);
            this.cargarActividadesInscritas();
            this.cargarActividades();
            setTimeout(() => {
              this.iniciarAnimacionContador(this.getTotalActividadesInscritas());
            }, 500);
          } else {
            this.mostrarError('Error', response.message);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al inscribirse:', error);
          this.mostrarError('Error', 'No se pudo completar la inscripción');
        }
      });
  }

  cancelarInscripcion(actividad: Actividad): void {
    const folioCliente = this.obtenerFolioCliente();
    if (!folioCliente) {
      this.mostrarError('Error', 'No se pudo identificar tu perfil');
      return;
    }

    this.isLoading = true;
    this.actividadService.cancelarInscripcion(folioCliente, actividad.idActividad, 'Cancelado por el cliente')
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.mostrarExito('Inscripción cancelada', response.message);
            this.cargarActividadesInscritas();
            this.cargarActividades();
            setTimeout(() => {
              this.iniciarAnimacionContador(this.getTotalActividadesInscritas());
            }, 500);
          } else {
            this.mostrarError('Error', response.message);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al cancelar inscripción:', error);
          this.mostrarError('Error', 'No se pudo cancelar la inscripción');
        }
      });
  }

  // ===== MÉTODOS DE RUTINAS =====

  verRutinaCompleta(rutina: Rutina): void {
    this.mostrarInfo('Rutina Completa', `Mostrando detalles completos de: ${rutina.nombre}`);
  }

  iniciarRutina(rutina: Rutina): void {
    this.mostrarExito('Rutina Iniciada', `Iniciando rutina: ${rutina.nombre}`);
  }

  verDetallesEjercicio(ejercicio: EjercicioRutina): void {
    this.mostrarInfo('Ejercicio', `Detalles del ejercicio: ${this.getNombreEjercicio(ejercicio.idEjercicio)}`);
  }

  // ===== MÉTODOS DE PERFIL =====

  cargarDatosEnFormulario(): void {
    this.perfilForm.patchValue({
      nombre: this.clienteData?.nombre || '',
      email: this.clienteData?.email || '',
      telefono: this.clienteData?.telefono || '',
      genero: this.clienteData?.genero || ''
    });
    this.perfilForm.markAsPristine();
  }

  guardarPerfil(): void {
    if (this.perfilForm.valid) {
      this.isLoading = true;
      const folioCliente = this.obtenerFolioCliente();
      
      if (!folioCliente) {
        this.mostrarError('Error', 'No se pudo identificar tu perfil');
        this.isLoading = false;
        return;
      }

      const datosActualizados = this.perfilForm.value;
      
      console.log('🔄 Actualizando perfil del cliente:', {
        folioCliente,
        datos: datosActualizados
      });
      
      this.clienteService.actualizarCliente(folioCliente, datosActualizados)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.success) {
              this.clienteData = { ...this.clienteData, ...response.cliente };
              this.perfilForm.markAsPristine();
              this.mostrarExito('¡Perfil actualizado!', response.message);
              console.log('✅ Perfil actualizado exitosamente:', response.cliente);
            } else {
              this.mostrarError('Error', response.message || 'Error al actualizar el perfil');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('❌ Error completo al actualizar perfil:', error);
            
            let mensajeError = 'No se pudieron guardar los cambios';
            
            if (error.status === 0) {
              mensajeError = 'Error de conexión. Verifica que el servidor esté funcionando en http://localhost:8081';
            } else if (error.message) {
              mensajeError = error.message;
            }
            
            this.mostrarError('Error', mensajeError);
          }
        });
    } else {
      this.mostrarError('Error', 'Por favor completa todos los campos requeridos correctamente');
    }
  }

  cancelarEdicion(): void {
    this.cargarDatosEnFormulario();
  }

  cambiarFoto(): void {
    this.mostrarInfo('Cambiar Foto', 'Esta funcionalidad estará disponible pronto');
  }

  contactarInstructor(): void {
    this.mostrarInfo('Contactar Instructor', 'Ponte en contacto con recepción para solicitar una rutina personalizada');
  }

  // ===== MÉTODOS PARA ESTADÍSTICAS =====

  verEstadisticasCompletas(): void {
    this.mostrarInfo('Estadísticas Completas', 'Aquí puedes ver un reporte detallado de tu progreso y participación en actividades.');
  }

  getTotalActividadesHoy(): number {
    const hoyStr = this.obtenerFechaLocalString(new Date());
    return this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividadStr = this.obtenerFechaLocalString(new Date(actividad.fechaActividad));
      return fechaActividadStr === hoyStr;
    }).length;
  }

  getTotalActividadesInscritas(): number {
    return this.actividadesInscritas.filter(inscripcion => 
      inscripcion.estatus === 'Inscrito'
    ).length;
  }

  getProximaActividad(): Actividad | null {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const actividadesFuturas = this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividad = new Date(actividad.fechaActividad);
      fechaActividad.setHours(0, 0, 0, 0);
      return fechaActividad >= hoy;
    }).sort((a, b) => {
      const fechaA = new Date(a.fechaActividad!);
      const fechaB = new Date(b.fechaActividad!);
      return fechaA.getTime() - fechaB.getTime();
    });
    
    return actividadesFuturas.length > 0 ? actividadesFuturas[0] : null;
  }

  // ===== MÉTODOS DE UTILIDAD =====

  obtenerFolioCliente(): string {
    return this.currentUser?.idPersona || this.clienteData?.folioCliente || '';
  }

  estaInscritoEnActividad(idActividad: string): boolean {
    return this.actividadesInscritas.some(inscripcion => 
      inscripcion.idActividad === idActividad && inscripcion.estatus === 'Inscrito'
    );
  }

  esActividadFutura(actividad: Actividad): boolean {
    if (!actividad.fechaActividad) return false;
    const fechaActividad = new Date(actividad.fechaActividad);
    fechaActividad.setHours(0, 0, 0, 0);
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return fechaActividad >= hoy;
  }

  getEstadoActividad(actividad: Actividad): { texto: string, clase: string } {
    return this.actividadService.obtenerEstadoActividad(actividad);
  }

  // MÉTODO ACTUALIZADO: Obtener nombre completo del instructor
  getNombreInstructor(actividad: Actividad): string {
    if (!actividad || !actividad.folioInstructor) {
      return 'Instructor no asignado';
    }

    // Buscar el instructor en la lista cargada
    const instructor = this.instructores.find(inst => inst.folioInstructor === actividad.folioInstructor);
    
    if (instructor) {
      // Construir nombre completo: nombre + app + apm
      const nombreCompleto = `${instructor.nombre} ${instructor.app || ''} ${instructor.apm || ''}`.trim();
      return nombreCompleto || 'Instructor';
    }
    
    // Si no se encuentra el instructor, mostrar el folio temporalmente
    console.warn(`Instructor no encontrado: ${actividad.folioInstructor}`);
    return `Instructor ${actividad.folioInstructor}`;
  }

  getNombreEjercicio(idEjercicio: string): string {
    return `Ejercicio ${idEjercicio}`;
  }

  contarEjerciciosRutina(rutina: Rutina): number {
    return rutina.ejercicios?.length || 0;
  }

  formatearDuracionRutina(rutina: Rutina): string {
    if (rutina.duracionEstimada) {
      return this.rutinaService.formatearTiempo(rutina.duracionEstimada);
    }
    return 'No especificada';
  }

  getColorNivel(nivel: string): string {
    const colores: { [key: string]: string } = {
      'Principiante': '#4CAF50',
      'Intermedio': '#FF9800',
      'Avanzado': '#F44336'
    };
    return colores[nivel] || '#757575';
  }

  getTituloSeccionActividades(): string {
    const titulos: { [key: string]: string } = {
      'todas': 'Todas las Actividades',
      'hoy': 'Actividades de Hoy',
      'proximas': 'Próximas Actividades',
      'inscritas': 'Mis Inscripciones'
    };
    return titulos[this.filtroActivo] || 'Actividades';
  }

  getMensajeNoActividades(): string {
    const mensajes: { [key: string]: string } = {
      'todas': 'No hay actividades disponibles en este momento.',
      'hoy': 'No hay actividades programadas para hoy.',
      'proximas': 'No hay actividades próximas programadas.',
      'inscritas': 'No estás inscrito en ninguna actividad.'
    };
    return mensajes[this.filtroActivo] || 'No hay actividades para mostrar.';
  }

  getImagenActividad(actividad: Actividad): string {
    return actividad.imagenUrl || this.getImagenPorDefecto(actividad.nombreActividad);
  }

  getImagenPorDefecto(nombreActividad: string): string {
    const defaultImages = [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      'https://images.unsplash.com/photo-1549060279-7e168fce7090?w=400',
    ];
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
  }

  // ===== MÉTODOS DE ACCIÓN =====

  actualizarDatos(): void {
    this.cargarDatosIniciales();
  }

  verDetallesActividad(actividad: Actividad): void {
    this.mostrarInfo(actividad.nombreActividad, actividad.descripcion || 'Sin descripción disponible');
  }

  // ===== MÉTODOS DE NOTIFICACIÓN =====

  private mostrarExito(titulo: string, mensaje: string): void {
    this.snackBar.open(`${titulo}: ${mensaje}`, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-success']
    });
  }

  private mostrarError(titulo: string, mensaje: string): void {
    this.snackBar.open(`${titulo}: ${mensaje}`, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error']
    });
  }

  private mostrarInfo(titulo: string, mensaje: string): void {
    this.snackBar.open(`${titulo}: ${mensaje}`, 'Cerrar', {
      duration: 5000
    });
  }

  // ===== CLEANUP =====

  ngOnDestroy(): void {
    if (this.intervaloContador) {
      clearInterval(this.intervaloContador);
    }
  }
}