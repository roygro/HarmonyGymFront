import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Rutina, Ejercicio, EjercicioRutina, RutinaService, Cliente, CrearEjercicioRequest } from '../../../../services/instructor/RutinaService';
import { HeaderInstructorComponent } from "../../header-instructor/header-instructor";

@Component({
  selector: 'app-rutina',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, HeaderInstructorComponent],
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
  
  // REEMPLAZADO: clientesAsignados por clientesPorRutina
  clientesPorRutina: Map<string, Cliente[]> = new Map();
  showVerClientesModal: boolean = false;
  mostrarClientesAsignados = false;
  
  // Búsqueda y filtros
  searchTerm = '';
  filterStatus = '';
  
  // Ejercicios
  ejerciciosDisponibles: Ejercicio[] = [];
  ejerciciosFiltrados: Ejercicio[] = [];
  ejercicioSeleccionado: string = '';
  nuevoEjercicio: Partial<EjercicioRutina> = {
    seriesEjercicio: 3,
    repeticionesEjercicio: 10,
    descansoEjercicio: 60,
    instrucciones: ''
  };
  
  // Filtros para ejercicios
  filtroEjercicioNombre: string = '';
  filtroGrupoMuscular: string = '';
  
  // Opciones para selects
  gruposMusculares: string[] = [
    'Pecho', 'Espalda', 'Hombros', 'Piernas', 'Brazos', 
    'Abdominales', 'Glúteos', 'Cardio', 'Full Body'
  ];
  
  equiposDisponibles: string[] = [
    'Mancuernas', 'Barra', 'Máquina', 'Peso Corporal', 
    'Bandas de Resistencia', 'Kettlebell', 'Balón Medicinal',
    'TRX', 'Polea', 'Press', 'Bicicleta', 'Cinta de Correr',
    'Elíptica', 'Step', 'Bosu', 'Ninguno', 'Otro'
  ];
  
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
  
  // CORREGIDO: Inicializar clientesAsignados como array vacío
  clientesAsignados: Cliente[] = [];

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
      equipoNecesario: [[], Validators.required],
      grupoMuscular: ['', Validators.required],
      instrucciones: ['', Validators.required],
      estatus: ['Activo']
    });
  }

  // NUEVOS MÉTODOS PARA MANEJAR CLIENTES POR RUTINA
  showVerClientesAsignados(): void {
    if (!this.selectedRutina) {
      this.showAlert('No hay rutina seleccionada', 'warning');
      return;
    }
    
    // Mostrar estado de carga
    this.showAlert('Cargando clientes asignados...','success');
    
    // Cargar los clientes asignados para el modal y MOSTRAR el modal después
    this.cargarClientesAsignadosParaModal().then(() => {
      // Cerrar alerta de carga
      this.clearAlert();
      
      if (this.clientesAsignados.length === 0) {
        this.showAlert('No hay clientes asignados para mostrar', 'warning');
        // Pero aún así mostrar el modal vacío para dar opción de asignar
        this.showVerClientesModal = true;
      } else {
        this.showVerClientesModal = true;
      }
    }).catch(error => {
      this.showAlert('Error al cargar clientes asignados', 'danger');
      console.error('Error:', error);
    });
  }

  // Modificar el método para que retorne una Promise
  cargarClientesAsignadosParaModal(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedRutina) {
        this.clientesAsignados = [];
        resolve();
        return;
      }
      
      this.rutinaService.obtenerClientesAsignadosARutina(this.selectedRutina.folioRutina).subscribe({
        next: (clientes) => {
          this.clientesAsignados = clientes || [];
          // También actualizar el mapa
          this.clientesPorRutina.set(this.selectedRutina!.folioRutina, this.clientesAsignados);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar clientes asignados para modal:', error);
          this.clientesAsignados = [];
          this.clientesPorRutina.set(this.selectedRutina!.folioRutina, []);
          reject(error);
        }
      });
    });
  }

  closeVerClientesModal(): void {
    this.showVerClientesModal = false;
  }

  getClientesAsignados(folioRutina: string): Cliente[] {
    if (!folioRutina) return []; // Verificación de seguridad
    return this.clientesPorRutina.get(folioRutina) || [];
  }

  getClientesAsignadosCount(folioRutina: string): number {
    if (!folioRutina) return 0; // Verificación de seguridad
    return this.getClientesAsignados(folioRutina).length;
  }

  // Método para precargar clientes de todas las rutinas
  precargarClientesDeTodasLasRutinas() {
    this.rutinas.forEach(rutina => {
      this.cargarClientesAsignadosParaRutina(rutina.folioRutina);
    });
  }

  // Método modificado para cargar clientes para una rutina específica
  cargarClientesAsignadosParaRutina(folioRutina: string) {
    this.rutinaService.obtenerClientesAsignadosARutina(folioRutina).subscribe({
      next: (clientes) => {
        this.clientesPorRutina.set(folioRutina, clientes);
      },
      error: (error) => {
        console.error('Error al cargar clientes asignados para rutina:', folioRutina, error);
        // Asegurarse de que haya una entrada vacía en el mapa
        this.clientesPorRutina.set(folioRutina, []);
      }
    });
  }

  // MÉTODOS PARA EQUIPOS MÚLTIPLES
  toggleEquipo(equipo: string) {
    const equiposActuales: string[] = this.ejercicioForm.get('equipoNecesario')?.value || [];
    const index = equiposActuales.indexOf(equipo);
    
    if (index > -1) {
      // Remover equipo
      equiposActuales.splice(index, 1);
    } else {
      // Agregar equipo
      equiposActuales.push(equipo);
    }
    
    this.ejercicioForm.patchValue({
      equipoNecesario: [...equiposActuales]
    });
  }

  isEquipoSeleccionado(equipo: string): boolean {
    const equiposActuales: string[] = this.ejercicioForm.get('equipoNecesario')?.value || [];
    return equiposActuales.includes(equipo);
  }

  getEquiposSeleccionadosTexto(): string {
    const equipos: string[] = this.ejercicioForm.get('equipoNecesario')?.value || [];
    return equipos.length > 0 ? equipos.join(', ') : 'Ningún equipo seleccionado';
  }

  // FILTRADO DE EJERCICIOS
  filtrarEjercicios() {
    let ejerciciosFiltrados = this.ejerciciosDisponibles;

    // Filtrar por nombre
    if (this.filtroEjercicioNombre) {
      const termino = this.filtroEjercicioNombre.toLowerCase();
      ejerciciosFiltrados = ejerciciosFiltrados.filter(ejercicio =>
        ejercicio.nombre.toLowerCase().includes(termino)
      );
    }

    // Filtrar por grupo muscular
    if (this.filtroGrupoMuscular) {
      ejerciciosFiltrados = ejerciciosFiltrados.filter(ejercicio =>
        ejercicio.grupoMuscular === this.filtroGrupoMuscular
      );
    }

    this.ejerciciosFiltrados = ejerciciosFiltrados;
  }

  onFiltroEjercicioNombreChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filtroEjercicioNombre = value;
    this.filtrarEjercicios();
  }

  onFiltroGrupoMuscularChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.filtroGrupoMuscular = value;
    this.filtrarEjercicios();
  }

  limpiarFiltrosEjercicios() {
    this.filtroEjercicioNombre = '';
    this.filtroGrupoMuscular = '';
    this.filtrarEjercicios();
  }

  // CONVERSIÓN DE TIEMPO
  convertirMinutosASegundos(minutos: number | null): number | null {
    return minutos !== null ? minutos * 60 : null;
  }

  convertirSegundosAMinutos(segundos: number | null): number | null {
    return segundos !== null ? Math.round(segundos / 60) : null;
  }

  // CÁLCULO CORREGIDO DEL TIEMPO
  calcularTiempoEjercicio(): number {
    if (!this.ejercicioSeleccionado || !this.nuevoEjercicio.seriesEjercicio) return 0;
    
    const ejercicio = this.getEjercicioInfo(this.ejercicioSeleccionado);
    
    // Obtener tiempo por serie (en segundos)
    let tiempoPorSerieSegundos = 45; // Valor por defecto: 45 segundos
    if (ejercicio?.tiempo) {
      tiempoPorSerieSegundos = ejercicio.tiempo;
    }
    
    // Obtener descanso entre series (en segundos)
    let descansoPorSerieSegundos = 60; // Valor por defecto: 60 segundos
    if (this.nuevoEjercicio.descansoEjercicio) {
      descansoPorSerieSegundos = this.nuevoEjercicio.descansoEjercicio;
    }
    
    const series = this.nuevoEjercicio.seriesEjercicio;
    
    // Cálculo correcto: (tiempo por serie * series) + (descanso * (series - 1))
    const tiempoTotalSegundos = (tiempoPorSerieSegundos * series) + (descansoPorSerieSegundos * (series - 1));
    
    // Convertir a minutos
    const tiempoTotalMinutos = tiempoTotalSegundos / 60;
    
    return Math.ceil(tiempoTotalMinutos); // redondear hacia arriba
  }

  getTiempoEjercicioDesglose(): string {
    if (!this.ejercicioSeleccionado || !this.nuevoEjercicio.seriesEjercicio) return '';
    
    const ejercicio = this.getEjercicioInfo(this.ejercicioSeleccionado);
    
    // Obtener valores en segundos
    const tiempoPorSerieSegundos = ejercicio?.tiempo || 45;
    const descansoPorSerieSegundos = this.nuevoEjercicio.descansoEjercicio || 60;
    const series = this.nuevoEjercicio.seriesEjercicio;
    
    // Convertir a minutos para mostrar
    const tiempoPorSerieMinutos = (tiempoPorSerieSegundos / 60).toFixed(2);
    const descansoPorSerieMinutos = (descansoPorSerieSegundos / 60).toFixed(2);
    
    return `${series} series × ${tiempoPorSerieMinutos} min + ${(series - 1)} descansos × ${descansoPorSerieMinutos} min`;
  }

  // Método para formatear tiempo en formato legible
  formatearTiempo(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const minsRestantes = minutos % 60;
      if (minsRestantes === 0) {
        return `${horas} h`;
      } else {
        return `${horas} h ${minsRestantes} min`;
      }
    }
  }

  // NUEVO: Calcular tiempo total de la rutina
  calcularTiempoTotalRutina(): number {
    if (!this.selectedRutina?.ejercicios) return 0;
    
    return this.selectedRutina.ejercicios.reduce((total, ejercicio) => {
      return total + this.calcularTiempoEjercicioIndividual(ejercicio);
    }, 0);
  }

  // NUEVO: Calcular tiempo individual de ejercicio
  calcularTiempoEjercicioIndividual(ejercicio: any): number {
    // Calcular tiempo aproximado por ejercicio
    const tiempoPorSerie = 2; // minutos aproximados por serie
    const descansoPorSerie = ejercicio.descansoEjercicio / 60; // convertir segundos a minutos
    
    return ejercicio.seriesEjercicio * (tiempoPorSerie + descansoPorSerie);
  }

  // NUEVO: Vista previa de rutina
  previewRutina(rutina: any): void {
    // Implementar vista previa de rutina
    console.log('Vista previa de rutina:', rutina);
    this.showAlert(`Vista previa de rutina: ${rutina.nombre}`, 'info');
  }

  // NUEVO: Vista previa de ejercicio
  previewEjercicio(ejercicio: any): void {
    // Implementar vista previa de ejercicio
    console.log('Vista previa de ejercicio:', ejercicio);
    this.showAlert(`Vista previa de ejercicio: ${ejercicio.nombre}`, 'info');
  }

  // NUEVO: Seleccionar ejercicio desde tarjeta
  selectEjercicioCard(idEjercicio: string): void {
    if (this.isEjercicioEnRutina(idEjercicio)) return;
    this.ejercicioSeleccionado = idEjercicio;
  }

  // NUEVO: Funciones de compatibilidad para clientes
  getCompatibilityClass(cliente: any, rutina: any): string {
    // Lógica de compatibilidad basada en nivel, objetivos, etc.
    const nivelCliente = this.getNivelCliente(cliente);
    const nivelRutina = rutina.nivel;
    
    if (nivelCliente === nivelRutina) return 'compatibility-high';
    if (this.isNivelCompatible(nivelCliente, nivelRutina)) return 'compatibility-medium';
    return 'compatibility-low';
  }

  getCompatibilityIcon(cliente: any, rutina: any): string {
    const compatibilityClass = this.getCompatibilityClass(cliente, rutina);
    switch (compatibilityClass) {
      case 'compatibility-high': return 'fa-check-circle';
      case 'compatibility-medium': return 'fa-exclamation-circle';
      case 'compatibility-low': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  getCompatibilityText(cliente: any, rutina: any): string {
    const compatibilityClass = this.getCompatibilityClass(cliente, rutina);
    switch (compatibilityClass) {
      case 'compatibility-high': return 'Alta';
      case 'compatibility-medium': return 'Media';
      case 'compatibility-low': return 'Baja';
      default: return 'No evaluada';
    }
  }

  getNivelCliente(cliente: any): string {
    // Lógica para determinar el nivel del cliente
    return cliente.nivel || 'Principiante';
  }

  isNivelCompatible(nivelCliente: string, nivelRutina: string): boolean {
    const niveles = ['Principiante', 'Intermedio', 'Avanzado'];
    const indexCliente = niveles.indexOf(nivelCliente);
    const indexRutina = niveles.indexOf(nivelRutina);
    
    return indexCliente >= indexRutina - 1 && indexCliente <= indexRutina + 1;
  }

  // NUEVO: Obtener email del cliente
  getClienteEmail(folioCliente: string): string {
    const cliente = this.clientesDisponibles.find(c => c.folioCliente === folioCliente);
    return cliente ? cliente.email : 'Email no encontrado';
  }

  showAsignarClientes() {
    if (!this.selectedRutina) return;
    
    this.showAsignarModal = true;
    this.clientesSeleccionados = [];
    this.filtroCliente = '';
    
    this.cargarClientesAsignados();
  }

  // MÉTODO MODIFICADO: Ahora usa el mapa clientesPorRutina
  cargarClientesAsignados() {
    if (!this.selectedRutina) return;
    
    this.rutinaService.obtenerClientesAsignadosARutina(this.selectedRutina.folioRutina).subscribe({
      next: (clientes) => {
        // Guardar en el mapa
        this.clientesPorRutina.set(this.selectedRutina!.folioRutina, clientes);
        this.cargarTodosLosClientesYFiltrar();
      },
      error: (error) => {
        console.error('Error al cargar clientes asignados:', error);
        this.cargarTodosLosClientesComoDisponibles();
      }
    });
  }

  cargarTodosLosClientesYFiltrar() {
    this.rutinaService.obtenerTodosLosClientes().subscribe({
      next: (todosLosClientes) => {
        const clientesAsignadosActuales = this.getClientesAsignados(this.selectedRutina!.folioRutina);
        this.clientesDisponibles = todosLosClientes.filter(cliente => 
          !clientesAsignadosActuales.some(asignado => asignado.folioCliente === cliente.folioCliente)
        );
        this.clientesFiltrados = this.clientesDisponibles;
      },
      error: (error) => {
        console.error('Error al cargar todos los clientes:', error);
        this.showAlert('Error al cargar la lista de clientes: ' + error.message, 'danger');
      }
    });
  }

  cargarTodosLosClientesComoDisponibles() {
    this.rutinaService.obtenerTodosLosClientes().subscribe({
      next: (clientes) => {
        this.clientesDisponibles = clientes;
        this.clientesFiltrados = clientes;
      },
      error: (error) => {
        console.error('Error al cargar todos los clientes:', error);
        this.showAlert('Error al cargar la lista de clientes: ' + error.message, 'danger');
      }
    });
  }

  isClienteAsignado(folioCliente: string): boolean {
    if (!this.selectedRutina) return false;
    const clientesAsignados = this.getClientesAsignados(this.selectedRutina.folioRutina);
    return clientesAsignados.some(cliente => cliente.folioCliente === folioCliente);
  }

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
            
            // Recargar los clientes asignados para esta rutina
            this.cargarClientesAsignadosParaRutina(this.selectedRutina!.folioRutina);
            // También actualizar el modal si está abierto
            this.cargarClientesAsignadosParaModal();
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

  desasignarCliente(folioCliente: string) {
    if (!this.selectedRutina) return;

    if (confirm('¿Estás seguro de que deseas desasignar este cliente de la rutina?')) {
      this.rutinaService.desasignarRutinaDeCliente(this.selectedRutina.folioRutina, folioCliente)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showAlert('Cliente desasignado exitosamente', 'success');
              // Recargar los clientes asignados para esta rutina
              this.cargarClientesAsignadosParaRutina(this.selectedRutina!.folioRutina);
              // También actualizar el modal si está abierto
              this.cargarClientesAsignadosParaModal();
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

  // CARGA DE DATOS MODIFICADA
  cargarRutinas() {
    this.rutinaService.obtenerTodasLasRutinas().subscribe({
      next: (rutinas) => {
        this.rutinas = rutinas;
        this.filteredRutinas = rutinas;
        // Precargar clientes para todas las rutinas
        this.precargarClientesDeTodasLasRutinas();
      },
      error: (error) => {
        this.showAlert('Error al cargar las rutinas: ' + error.message, 'danger');
      }
    });
  }

  cargarEjerciciosDisponibles() {
    this.rutinaService.obtenerTodosLosEjercicios().subscribe({
      next: (ejercicios) => {
        this.ejerciciosDisponibles = ejercicios;
        this.ejerciciosFiltrados = ejercicios;
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
    this.mostrarClientesAsignados = false;
    
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
          // Inicializar el mapa de clientes para la nueva rutina
          this.clientesPorRutina.set(nuevaRutina.folioRutina, []);
          this.selectRutina(nuevaRutina);
          this.isCreating = false;
          this.showAlert('Rutina creada exitosamente', 'success');
          this.filterRutinas();
        },
        error: (error) => {
          this.showAlert('Error al crear la rutina: ' + error.message, 'danger');
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
        }
      });
    }
  }

  deleteRutina() {
    if (!this.selectedRutina) return;

    if (confirm(`¿Estás seguro de que deseas eliminar la rutina "${this.selectedRutina.nombre}"?`)) {
      this.rutinaService.eliminarRutina(this.selectedRutina.folioRutina).subscribe({
        next: () => {
          // Eliminar también del mapa de clientes
          this.clientesPorRutina.delete(this.selectedRutina!.folioRutina);
          this.rutinas = this.rutinas.filter(r => r.folioRutina !== this.selectedRutina!.folioRutina);
          this.selectedRutina = null;
          this.showAlert('Rutina eliminada exitosamente', 'success');
          this.filterRutinas();
        },
        error: (error) => {
          this.showAlert('Error al eliminar la rutina: ' + error.message, 'danger');
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
    // Limpiar filtros al abrir el modal
    this.filtroEjercicioNombre = '';
    this.filtroGrupoMuscular = '';
    this.filtrarEjercicios();
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
      estatus: 'Activo',
      equipoNecesario: []
    });
  }

  crearEjercicio() {
    if (this.ejercicioForm.invalid) return;

    this.creandoEjercicio = true;
    
    // Convertir tiempos de minutos a segundos para el backend
    const formData = this.ejercicioForm.value;
    const ejercicioData: CrearEjercicioRequest = {
      ...formData,
      tiempo: this.convertirMinutosASegundos(formData.tiempo),
      descanso: this.convertirMinutosASegundos(formData.descanso),
      equipoNecesario: Array.isArray(formData.equipoNecesario) ? 
        formData.equipoNecesario.join(', ') : formData.equipoNecesario
    };

    this.rutinaService.crearEjercicio(ejercicioData).subscribe({
      next: (nuevoEjercicio) => {
        this.creandoEjercicio = false;
        this.showCrearEjercicioModal = false;
        
        // Agregar el nuevo ejercicio a la lista de disponibles
        this.ejerciciosDisponibles.push(nuevoEjercicio);
        this.filtrarEjercicios();
        
        // Si venimos del modal de agregar ejercicio, seleccionar automáticamente el nuevo ejercicio
        if (this.showEjercicioModal) {
          this.ejercicioSeleccionado = nuevoEjercicio.idEjercicio;
          this.showEjercicioModal = true;
        }
        
        this.showAlert('Ejercicio creado exitosamente', 'success');
        this.ejercicioForm.reset({
          estatus: 'Activo',
          equipoNecesario: []
        });
      },
      error: (error) => {
        this.creandoEjercicio = false;
        this.showAlert('Error al crear el ejercicio: ' + error.message, 'danger');
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

  showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info') {
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
        // Inicializar el mapa de clientes para la nueva rutina
        this.clientesPorRutina.set(nuevaRutina.folioRutina, []);
        this.selectRutina(nuevaRutina);
        this.showAlert('Rutina duplicada exitosamente', 'success');
        this.filterRutinas();
      },
      error: (error) => {
        this.showAlert('Error al duplicar la rutina: ' + error.message, 'danger');
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

  cambiarEstatusRutina(rutina: Rutina, nuevoEstatus: string): void {
    const confirmMessage = nuevoEstatus === 'Inactiva' 
      ? `¿Estás seguro de que quieres inactivar la rutina "${rutina.nombre}"?` 
      : `¿Estás seguro de que quieres activar la rutina "${rutina.nombre}"?`;

    if (confirm(confirmMessage)) {
      this.rutinaService.cambiarEstatusRutina(rutina.folioRutina, nuevoEstatus)
        .subscribe({
          next: (response: any) => {
            this.showAlert(`Rutina ${nuevoEstatus === 'Inactiva' ? 'inactivada' : 'activada'} exitosamente`, 'success');
            
            // Actualizar la rutina en la lista
            const index = this.rutinas.findIndex(r => r.folioRutina === rutina.folioRutina);
            if (index !== -1) {
              this.rutinas[index].estatus = nuevoEstatus;
            }
            
            // Si la rutina seleccionada es la que se modificó, actualizarla
            if (this.selectedRutina && this.selectedRutina.folioRutina === rutina.folioRutina) {
              this.selectedRutina.estatus = nuevoEstatus;
            }
            
            // Recargar la lista filtrada
            this.filterRutinas();
          },
          error: (error) => {
            console.error('Error al cambiar estatus:', error);
            this.showAlert('Error al cambiar el estatus de la rutina', 'danger');
          }
        });
    }
  }

  // Método específico para inactivar
  inactivarRutina(rutina: Rutina): void {
    this.cambiarEstatusRutina(rutina, 'Inactiva');
  }

  // Método específico para activar
  activarRutina(rutina: Rutina): void {
    this.cambiarEstatusRutina(rutina, 'Activa');
  }

  // Método para obtener rutinas por estatus (para filtros)
  filtrarPorEstatus(estatus: string): void {
    this.rutinaService.getRutinasPorEstatus(estatus).subscribe({
      next: (rutinas) => {
        this.rutinas = rutinas;
        this.filterRutinas();
      },
      error: (error) => {
        console.error('Error al filtrar rutinas por estatus:', error);
      }
    });
  }
}