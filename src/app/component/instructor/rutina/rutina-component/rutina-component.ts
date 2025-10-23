import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Rutina, Ejercicio, EjercicioRutina, RutinaService, Cliente, CrearEjercicioRequest } from '../../../../services/instructor/RutinaService';

@Component({
  selector: 'app-rutina',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './rutina-component.html',
  styleUrls: ['./rutina-component.css']
})
export class RutinaComponent implements OnInit {
  // Estados del componente
  rutinas: Rutina[] = [];
  filteredRutinas: Rutina[] = [];
  selectedRutina: Rutina | null = null;
  isCreating = false;
  isEditing = false;
  clientesDisponibles: Cliente[] = [];
  clientesSeleccionados: string[] = [];
  clientesFiltrados: Cliente[] = [];
  filtroCliente: string = '';
  asignando = false;
  clientesAsignados: Cliente[] = [];
  clientesNoAsignados: Cliente[] = [];
  mostrarClientesAsignados = false;
  
  // Búsqueda y filtros
  searchTerm = '';
  filterStatus = '';
  
  // Ejercicios
  ejerciciosDisponibles: Ejercicio[] = [];
  ejercicioSeleccionado: string = '';
  nuevoEjercicio: Partial<EjercicioRutina> = {
    seriesEjercicio: 3,
    repeticionesEjercicio: 10,
    descansoEjercicio: 60,
    instrucciones: ''
  };
  
  // Modales
  showEjercicioModal = false;
  showAsignarModal = false;
  showCrearEjercicioModal = false;
  creandoEjercicio = false;
  
  // Alertas
  alertMessage = '';
  alertType = 'alert-success';

  // Instructor temporal para pruebas
  private instructorTemporal = 'INS003';
  
  // Formularios
  rutinaForm: FormGroup;
  ejercicioForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private rutinaService: RutinaService
  ) {
    this.rutinaForm = this.createRutinaForm();
    this.ejercicioForm = this.createEjercicioForm();
  }

  ngOnInit() {
    this.cargarRutinas();
    this.cargarEjerciciosDisponibles();
  }

  // FORMULARIOS
  createRutinaForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      nivel: [''],
      objetivo: [''],
      estatus: ['Activa'],
      folioInstructor: [this.instructorTemporal, Validators.required]
    });
  }

  createEjercicioForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      tiempo: [null],
      series: [null],
      repeticiones: [null],
      descanso: [null],
      equipoNecesario: ['', Validators.required],
      grupoMuscular: ['', Validators.required],
      instrucciones: ['', Validators.required],
      estatus: ['Activo']
    });
  }

  showAsignarClientes() {
    if (!this.selectedRutina) return;
    
    this.showAsignarModal = true;
    this.clientesSeleccionados = [];
    this.filtroCliente = '';
    
    // Cargar primero clientes asignados, luego los disponibles
    this.cargarClientesAsignados();
  }

  // Método para cargar clientes asignados
  cargarClientesAsignados() {
    if (!this.selectedRutina) return;
    
    this.rutinaService.obtenerClientesAsignadosARutina(this.selectedRutina.folioRutina).subscribe({
      next: (clientes) => {
        this.clientesAsignados = clientes;
        console.log('Clientes asignados cargados:', clientes);
        
        // Una vez cargados los asignados, cargar todos los clientes y filtrar
        this.cargarTodosLosClientesYFiltrar();
      },
      error: (error) => {
        console.error('Error al cargar clientes asignados:', error);
        // Si falla cargar asignados, cargar todos los clientes como disponibles
        this.cargarTodosLosClientesComoDisponibles();
      }
    });
  }

  // Método principal para cargar clientes disponibles
  cargarClientesDisponibles() {
    if (!this.selectedRutina) return;
    
    // Método simplificado: cargar todos los clientes y filtrar manualmente
    this.cargarTodosLosClientesYFiltrar();
  }

  // Método para cargar todos los clientes y filtrar los no asignados
  cargarTodosLosClientesYFiltrar() {
    this.rutinaService.obtenerTodosLosClientes().subscribe({
      next: (todosLosClientes) => {
        // Filtrar clientes que no están asignados
        this.clientesDisponibles = todosLosClientes.filter(cliente => 
          !this.clientesAsignados.some(asignado => asignado.folioCliente === cliente.folioCliente)
        );
        this.clientesFiltrados = this.clientesDisponibles;
        console.log('Clientes disponibles (filtrados):', this.clientesDisponibles);
        console.log('Clientes asignados:', this.clientesAsignados);
      },
      error: (error) => {
        console.error('Error al cargar todos los clientes:', error);
        this.showAlert('Error al cargar la lista de clientes: ' + error.message, 'danger');
      }
    });
  }

  // Método de respaldo si falla cargar asignados
  cargarTodosLosClientesComoDisponibles() {
    this.rutinaService.obtenerTodosLosClientes().subscribe({
      next: (clientes) => {
        this.clientesDisponibles = clientes;
        this.clientesFiltrados = clientes;
        console.log('Clientes cargados como disponibles (sin filtro):', clientes);
      },
      error: (error) => {
        console.error('Error al cargar todos los clientes:', error);
        this.showAlert('Error al cargar la lista de clientes: ' + error.message, 'danger');
      }
    });
  }

  // Método para verificar si un cliente está asignado
  isClienteAsignado(folioCliente: string): boolean {
    return this.clientesAsignados.some(cliente => cliente.folioCliente === folioCliente);
  }

  // Actualizar el método de asignación para refrescar las listas
  asignarRutinaAClientes() {
    if (!this.selectedRutina || this.clientesSeleccionados.length === 0) {
      this.showAlert('Selecciona al menos un cliente para asignar la rutina', 'warning');
      return;
    }

    this.asignando = true;

    const request = {
      foliosClientes: this.clientesSeleccionados,
      folioInstructor: this.instructorTemporal
    };

    this.rutinaService.asignarRutinaAMultiplesClientes(this.selectedRutina.folioRutina, request)
      .subscribe({
        next: (response) => {
          this.asignando = false;
          
          if (response.success) {
            this.showAlert(`Rutina asignada exitosamente a ${response.resultado?.totalExitosas || 0} clientes`, 'success');
            
            if (response.resultado && response.resultado.errores.length > 0) {
              const errores = response.resultado.errores.join(', ');
              this.showAlert(`Algunos clientes no pudieron ser asignados: ${errores}`, 'warning');
            }
            
            // Recargar las listas después de asignar
            this.cargarClientesAsignados();
            
            this.closeAsignarModal();
          } else {
            this.showAlert('Error al asignar la rutina: ' + response.message, 'danger');
          }
        },
        error: (error) => {
          this.asignando = false;
          this.showAlert('Error al asignar la rutina: ' + error.message, 'danger');
        }
      });
  }

  // Método para desasignar clientes
  desasignarCliente(folioCliente: string) {
    if (!this.selectedRutina) return;

    if (confirm('¿Estás seguro de que deseas desasignar este cliente de la rutina?')) {
      this.rutinaService.desasignarRutinaDeCliente(this.selectedRutina.folioRutina, folioCliente)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showAlert('Cliente desasignado exitosamente', 'success');
              // Recargar las listas después de desasignar
              this.cargarClientesAsignados();
            } else {
              this.showAlert('Error al desasignar cliente: ' + response.message, 'danger');
            }
          },
          error: (error) => {
            this.showAlert('Error al desasignar cliente: ' + error.message, 'danger');
          }
        });
    }
  }

  // Método para mostrar/ocultar clientes asignados
  toggleMostrarClientesAsignados() {
    this.mostrarClientesAsignados = !this.mostrarClientesAsignados;
  }

  // MANEJADORES DE EVENTOS PARA FORMULARIOS
  onSearchTermChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    this.filterRutinas();
  }

  onFilterStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filterStatus = value;
    this.filterRutinas();
  }

  onEjercicioSeleccionadoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.ejercicioSeleccionado = value;
  }

  onSeriesChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 3;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      seriesEjercicio: value
    };
  }

  onRepeticionesChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 10;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      repeticionesEjercicio: value
    };
  }

  onDescansoChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 60;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      descansoEjercicio: value
    };
  }

  onInstruccionesChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      instrucciones: value
    };
  }

  onOrdenChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value) || 1;
    this.nuevoEjercicio = {
      ...this.nuevoEjercicio,
      orden: value
    };
  }

  // CARGA DE DATOS
  cargarRutinas() {
    this.rutinaService.obtenerTodasLasRutinas().subscribe({
      next: (rutinas) => {
        this.rutinas = rutinas;
        this.filteredRutinas = rutinas;
        console.log('Rutinas cargadas:', rutinas);
      },
      error: (error) => {
        this.showAlert('Error al cargar las rutinas: ' + error.message, 'danger');
        console.error('Error:', error);
      }
    });
  }

  cargarEjerciciosDisponibles() {
    this.rutinaService.obtenerTodosLosEjercicios().subscribe({
      next: (ejercicios) => {
        this.ejerciciosDisponibles = ejercicios;
        console.log('Ejercicios cargados:', ejercicios);
      },
      error: (error) => {
        console.error('Error al cargar ejercicios:', error);
        this.showAlert('Error al cargar ejercicios disponibles: ' + error.message, 'warning');
      }
    });
  }

  // MÉTODOS PARA ASIGNACIÓN DE CLIENTES
  closeAsignarModal() {
    this.showAsignarModal = false;
    this.clientesSeleccionados = [];
    this.filtroCliente = '';
  }

  // FILTRADO DE CLIENTES
  filtrarClientes() {
    if (!this.filtroCliente) {
      this.clientesFiltrados = this.clientesDisponibles;
      return;
    }

    const termino = this.filtroCliente.toLowerCase();
    this.clientesFiltrados = this.clientesDisponibles.filter(cliente =>
      cliente.nombre.toLowerCase().includes(termino) ||
      cliente.folioCliente.toLowerCase().includes(termino) ||
      cliente.email.toLowerCase().includes(termino)
    );
  }

  onFiltroClienteChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filtroCliente = value;
    this.filtrarClientes();
  }

  // SELECCIÓN DE CLIENTES
  toggleClienteSeleccionado(folioCliente: string) {
    const index = this.clientesSeleccionados.indexOf(folioCliente);
    if (index > -1) {
      this.clientesSeleccionados.splice(index, 1);
    } else {
      this.clientesSeleccionados.push(folioCliente);
    }
  }

  isClienteSeleccionado(folioCliente: string): boolean {
    return this.clientesSeleccionados.includes(folioCliente);
  }

  seleccionarTodosClientes() {
    if (this.clientesSeleccionados.length === this.clientesFiltrados.length) {
      this.clientesSeleccionados = [];
    } else {
      this.clientesSeleccionados = this.clientesFiltrados.map(cliente => cliente.folioCliente);
    }
  }

  // MÉTODOS DE UTILIDAD PARA CLIENTES
  getClientesSeleccionadosCount(): number {
    return this.clientesSeleccionados.length;
  }

  getClienteNombre(folioCliente: string): string {
    const cliente = this.clientesDisponibles.find(c => c.folioCliente === folioCliente);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  }

  calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
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
  }

  // FILTRADO Y BÚSQUEDA
  filterRutinas() {
    this.filteredRutinas = this.rutinas.filter(rutina => {
      const matchesSearch = rutina.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           rutina.descripcion?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.filterStatus || rutina.estatus === this.filterStatus;
      return matchesSearch && matchesStatus;
    });
  }

  // SELECCIÓN Y NAVEGACIÓN
  selectRutina(rutina: Rutina) {
    this.selectedRutina = rutina;
    this.isCreating = false;
    this.isEditing = false;
    this.mostrarClientesAsignados = false; // Resetear la visualización
    
    // Cargar clientes asignados cuando se selecciona una rutina
    this.cargarClientesAsignados();
  }

  showCreateRutinaForm() {
    this.selectedRutina = null;
    this.isCreating = true;
    this.isEditing = false;
    this.rutinaForm.reset({
      estatus: 'Activa',
      folioInstructor: this.instructorTemporal
    });
  }

  editRutina() {
    if (this.selectedRutina) {
      this.isEditing = true;
      this.isCreating = false;
      this.rutinaForm.patchValue(this.selectedRutina);
    }
  }

  cancelEdit() {
    this.isCreating = false;
    this.isEditing = false;
    if (this.selectedRutina) {
      this.cargarRutinaDetalle(this.selectedRutina.folioRutina);
    }
  }

  // OPERACIONES CRUD
  saveRutina() {
    if (this.rutinaForm.invalid) return;

    const rutinaData = {
      ...this.rutinaForm.value,
      folioInstructor: this.instructorTemporal
    };

    if (this.isCreating) {
      this.rutinaService.crearRutina(rutinaData).subscribe({
        next: (nuevaRutina) => {
          this.rutinas.push(nuevaRutina);
          this.selectRutina(nuevaRutina);
          this.isCreating = false;
          this.showAlert('Rutina creada exitosamente', 'success');
          this.filterRutinas();
        },
        error: (error) => {
          this.showAlert('Error al crear la rutina: ' + error.message, 'danger');
          console.error('Error:', error);
        }
      });
    } else if (this.isEditing && this.selectedRutina) {
      this.rutinaService.actualizarRutina(this.selectedRutina.folioRutina, rutinaData).subscribe({
        next: (rutinaActualizada) => {
          const index = this.rutinas.findIndex(r => r.folioRutina === rutinaActualizada.folioRutina);
          if (index !== -1) {
            this.rutinas[index] = rutinaActualizada;
          }
          this.selectedRutina = rutinaActualizada;
          this.isEditing = false;
          this.showAlert('Rutina actualizada exitosamente', 'success');
          this.filterRutinas();
        },
        error: (error) => {
          this.showAlert('Error al actualizar la rutina: ' + error.message, 'danger');
          console.error('Error:', error);
        }
      });
    }
  }

  deleteRutina() {
    if (!this.selectedRutina) return;

    if (confirm(`¿Estás seguro de que deseas eliminar la rutina "${this.selectedRutina.nombre}"?`)) {
      this.rutinaService.eliminarRutina(this.selectedRutina.folioRutina).subscribe({
        next: () => {
          this.rutinas = this.rutinas.filter(r => r.folioRutina !== this.selectedRutina!.folioRutina);
          this.selectedRutina = null;
          this.showAlert('Rutina eliminada exitosamente', 'success');
          this.filterRutinas();
        },
        error: (error) => {
          this.showAlert('Error al eliminar la rutina: ' + error.message, 'danger');
          console.error('Error:', error);
        }
      });
    }
  }

  // GESTIÓN DE EJERCICIOS
  showAgregarEjercicio() {
    if (!this.selectedRutina) return;
    this.showEjercicioModal = true;
    this.ejercicioSeleccionado = '';
    this.nuevoEjercicio = {
      seriesEjercicio: 3,
      repeticionesEjercicio: 10,
      descansoEjercicio: 60,
      orden: (this.selectedRutina.ejercicios?.length || 0) + 1,
      instrucciones: ''
    };
  }

  closeEjercicioModal() {
    this.showEjercicioModal = false;
  }

  // MÉTODOS PARA CREAR NUEVOS EJERCICIOS
  showCrearEjercicioModalFromAgregar() {
    this.showEjercicioModal = false;
    this.showCrearEjercicioModal = true;
  }

  showCrearEjercicio() {
    this.showCrearEjercicioModal = true;
  }

  closeCrearEjercicioModal() {
    this.showCrearEjercicioModal = false;
    this.ejercicioForm.reset({
      estatus: 'Activo'
    });
  }

  crearEjercicio() {
    if (this.ejercicioForm.invalid) return;

    this.creandoEjercicio = true;
    const ejercicioData: CrearEjercicioRequest = this.ejercicioForm.value;

    this.rutinaService.crearEjercicio(ejercicioData).subscribe({
      next: (nuevoEjercicio) => {
        this.creandoEjercicio = false;
        this.showCrearEjercicioModal = false;
        
        // Agregar el nuevo ejercicio a la lista de disponibles
        this.ejerciciosDisponibles.push(nuevoEjercicio);
        
        // Si venimos del modal de agregar ejercicio, seleccionar automáticamente el nuevo ejercicio
        if (this.showEjercicioModal) {
          this.ejercicioSeleccionado = nuevoEjercicio.idEjercicio;
          this.showEjercicioModal = true;
        }
        
        this.showAlert('Ejercicio creado exitosamente', 'success');
        this.ejercicioForm.reset({
          estatus: 'Activo'
        });
      },
      error: (error) => {
        this.creandoEjercicio = false;
        this.showAlert('Error al crear el ejercicio: ' + error.message, 'danger');
        console.error('Error:', error);
      }
    });
  }

  isEjercicioEnRutina(idEjercicio: string): boolean {
    if (!this.selectedRutina?.ejercicios) return false;
    return this.selectedRutina.ejercicios.some(ej => ej.idEjercicio === idEjercicio);
  }

  getEjercicioInfo(idEjercicio: string): Ejercicio | null {
    return this.ejerciciosDisponibles.find(e => e.idEjercicio === idEjercicio) || null;
  }

  esEjercicioValido(): boolean {
    return !!this.ejercicioSeleccionado && 
           !!this.nuevoEjercicio.seriesEjercicio && 
           this.nuevoEjercicio.seriesEjercicio > 0 &&
           !!this.nuevoEjercicio.repeticionesEjercicio && 
           this.nuevoEjercicio.repeticionesEjercicio > 0 &&
           !!this.nuevoEjercicio.descansoEjercicio && 
           this.nuevoEjercicio.descansoEjercicio >= 0 &&
           !!this.nuevoEjercicio.orden && 
           this.nuevoEjercicio.orden > 0;
  }

  calcularTiempoEjercicio(): number {
    if (!this.ejercicioSeleccionado || !this.nuevoEjercicio.seriesEjercicio) return 0;
    
    const ejercicio = this.getEjercicioInfo(this.ejercicioSeleccionado);
    const tiempoPorSerie = ejercicio?.tiempo || 45;
    const series = this.nuevoEjercicio.seriesEjercicio;
    const descansoPorSerie = this.nuevoEjercicio.descansoEjercicio || 60;
    
    const tiempoTotal = (tiempoPorSerie * series) + (descansoPorSerie * (series - 1));
    return Math.ceil(tiempoTotal / 60);
  }

  agregarEjercicio() {
    if (!this.selectedRutina || !this.ejercicioSeleccionado) return;

    if (this.isEjercicioEnRutina(this.ejercicioSeleccionado)) {
      this.showAlert('Este ejercicio ya está en la rutina. No se pueden agregar duplicados.', 'warning');
      return;
    }

    if (!this.esEjercicioValido()) {
      this.showAlert('Por favor completa todos los campos requeridos correctamente.', 'warning');
      return;
    }

    const ejercicioRutina: EjercicioRutina = {
      idEjercicio: this.ejercicioSeleccionado,
      orden: this.nuevoEjercicio.orden || (this.selectedRutina.ejercicios?.length || 0) + 1,
      seriesEjercicio: this.nuevoEjercicio.seriesEjercicio || 3,
      repeticionesEjercicio: this.nuevoEjercicio.repeticionesEjercicio || 10,
      descansoEjercicio: this.nuevoEjercicio.descansoEjercicio || 60,
      instrucciones: this.nuevoEjercicio.instrucciones || this.getEjercicioInfo(this.ejercicioSeleccionado)?.instrucciones || ''
    };

    this.rutinaService.agregarEjercicioARutina(this.selectedRutina.folioRutina, ejercicioRutina).subscribe({
      next: (rutinaActualizada) => {
        this.selectedRutina = rutinaActualizada;
        this.showEjercicioModal = false;
        this.showAlert('Ejercicio agregado exitosamente', 'success');
        
        const index = this.rutinas.findIndex(r => r.folioRutina === rutinaActualizada.folioRutina);
        if (index !== -1) {
          this.rutinas[index] = rutinaActualizada;
        }
      },
      error: (error) => {
        console.error('Error al agregar ejercicio:', error);
        
        if (error.message.includes('duplicate key') || error.message.includes('ya existe')) {
          this.showAlert('Este ejercicio ya está en la rutina. No se pueden agregar duplicados.', 'warning');
        } else {
          this.showAlert('Error al agregar el ejercicio: ' + error.message, 'danger');
        }
      }
    });
  }

  eliminarEjercicio(idEjercicio: string) {
    if (!this.selectedRutina) return;

    if (confirm('¿Estás seguro de que deseas eliminar este ejercicio de la rutina?')) {
      this.rutinaService.eliminarEjercicioDeRutina(this.selectedRutina.folioRutina, idEjercicio).subscribe({
        next: (rutinaActualizada) => {
          this.selectedRutina = rutinaActualizada;
          this.showAlert('Ejercicio eliminado exitosamente', 'success');
          
          const index = this.rutinas.findIndex(r => r.folioRutina === rutinaActualizada.folioRutina);
          if (index !== -1) {
            this.rutinas[index] = rutinaActualizada;
          }
        },
        error: (error) => {
          this.showAlert('Error al eliminar el ejercicio: ' + error.message, 'danger');
          console.error('Error:', error);
        }
      });
    }
  }

  getEjercicioNombre(idEjercicio: string): string {
    const ejercicio = this.ejerciciosDisponibles.find(e => e.idEjercicio === idEjercicio);
    return ejercicio ? ejercicio.nombre : 'Ejercicio no encontrado';
  }

  // UTILIDADES
  cargarRutinaDetalle(folioRutina: string) {
    this.rutinaService.obtenerRutinaPorId(folioRutina).subscribe({
      next: (rutina) => {
        this.selectedRutina = rutina;
      },
      error: (error) => {
        this.showAlert('Error al cargar los detalles de la rutina: ' + error.message, 'danger');
        console.error('Error:', error);
      }
    });
  }

  getStatusBadgeClass(estatus: string): string {
    switch (estatus) {
      case 'Activa': return 'bg-success';
      case 'Inactiva': return 'bg-secondary';
      default: return 'bg-info';
    }
  }

  getNivelBadgeClass(nivel: string): string {
    switch (nivel) {
      case 'Principiante': return 'bg-success';
      case 'Intermedio': return 'bg-warning';
      case 'Avanzado': return 'bg-danger';
      default: return 'bg-info';
    }
  }

  showAlert(message: string, type: 'success' | 'danger' | 'warning') {
    this.alertMessage = message;
    this.alertType = `alert-${type}`;
    
    setTimeout(() => {
      this.clearAlert();
    }, 5000);
  }

  clearAlert() {
    this.alertMessage = '';
  }

  // MÉTODOS ADICIONALES
  duplicarRutina(rutina: Rutina): void {
    if (!rutina) return;

    const rutinaDuplicada = {
      nombre: `${rutina.nombre} (Copia)`,
      descripcion: rutina.descripcion,
      nivel: rutina.nivel,
      objetivo: rutina.objetivo,
      estatus: 'Activa',
      folioInstructor: this.instructorTemporal,
      ejercicios: rutina.ejercicios ? [...rutina.ejercicios] : []
    };

    this.rutinaService.crearRutina(rutinaDuplicada).subscribe({
      next: (nuevaRutina) => {
        this.rutinas.push(nuevaRutina);
        this.selectRutina(nuevaRutina);
        this.showAlert('Rutina duplicada exitosamente', 'success');
        this.filterRutinas();
      },
      error: (error) => {
        this.showAlert('Error al duplicar la rutina: ' + error.message, 'danger');
        console.error('Error:', error);
      }
    });
  }

  cambiarEstadoRutina(rutina: Rutina, nuevoEstado: string): void {
    if (!rutina) return;

    this.rutinaService.cambiarEstatusRutina(rutina.folioRutina, nuevoEstado).subscribe({
      next: () => {
        rutina.estatus = nuevoEstado;
        this.showAlert(`Rutina ${nuevoEstado.toLowerCase()} exitosamente`, 'success');
        this.filterRutinas();
      },
      error: (error) => {
        this.showAlert('Error al cambiar el estado de la rutina: ' + error.message, 'danger');
        console.error('Error:', error);
      }
    });
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterRutinas();
  }

  // TrackBy functions para mejor rendimiento
  trackByRutina(index: number, rutina: Rutina): string {
    return rutina.folioRutina;
  }

  trackByEjercicio(index: number, ejercicio: EjercicioRutina): string {
    return `${ejercicio.idEjercicio}-${ejercicio.orden}`;
  }

  trackByEjercicioDisponible(index: number, ejercicio: Ejercicio): string {
    return ejercicio.idEjercicio;
  }

  trackByCliente(index: number, cliente: Cliente): string {
    return cliente.folioCliente;
  }
}