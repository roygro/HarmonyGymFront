import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Actividad, ActividadService } from '../../../services/instructor/ActividadService';
import Swal from 'sweetalert2';
import { HeaderInstructorComponent } from "../header-instructor/header-instructor";

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderInstructorComponent],
  templateUrl: './actividades-component.html',
  styleUrls: ['./actividades-component.css']
})
export class ActividadesComponent implements OnInit {
  actividades: Actividad[] = [];
  actividadesFiltradas: Actividad[] = [];
  actividadForm: FormGroup;
  isEditing = false;
  selectedActividad: Actividad | null = null;
  showForm = false;
  searchTerm = '';
  showCalendar = false;
  horasDisponibles: string[] = [];
  isLoading = false;
  selectedDate: string = '';
  duracionSeleccionada: number = 60;

  // Nueva propiedad para rastrear el horario seleccionado
  horarioSeleccionado: { horaInicio: string, horaFin: string } | null = null;

  // Propiedades para el selector de lugares
  lugaresPredefinidos: string[] = [
    'Sala Principal',
    'Sala de Yoga',
    'Sala de Spinning',
    'Sala de Musculación',
    'Área de Cardio',
    'Estudio de Danza',
    'Piscina',
    'Cancha de Tenis',
    'Cancha de Basketball',
    'Área Exterior',
    'Sala de Entrenamiento Funcional',
    'Sala de Artes Marciales'
  ];
  lugarSeleccionado: string = '';
  mostrarCampoPersonalizado: boolean = false;

  // Instructor fijo
  instructorFijo = 'INS003';

  // NUEVAS PROPIEDADES PARA EL CALENDARIO MODAL
  mostrarCalendarioModal: boolean = false;
  mesActual: Date = new Date();
  diaSeleccionado: Date | null = null;
  diasDelMes: any[] = [];
  diasSemana: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  mostrarSelectorRapido: boolean = false;
  
  // NUEVAS PROPIEDADES PARA SELECTOR DE AÑO Y MES (CORREGIDAS)
  anosDisponibles: number[] = [];
  anoSeleccionado: number = new Date().getFullYear();
  mesesDelAno: string[] = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  mesSeleccionadoRapido: number = new Date().getMonth();

  // Imágenes por defecto para actividades
  defaultImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    'https://images.unsplash.com/photo-1549060279-7e168fce7090?w=400',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400',
  ];

  // Lista de meses para selector rápido (se mantiene por compatibilidad)
  mesesDisponibles: any[] = [];

  constructor(
    private actividadService: ActividadService,
    private fb: FormBuilder
  ) {
    this.actividadForm = this.createForm();
    this.generarHorasDisponibles();
    this.inicializarAnosDisponibles();
    this.inicializarMesesDisponibles(); // Se mantiene por compatibilidad
  }

  ngOnInit(): void {
    console.log('🎯 ActividadesComponent inicializado - Instructor:', this.instructorFijo);
    this.cargarActividadesInstructor();
    this.generarCalendario();
  }

  // NUEVO MÉTODO PARA INICIALIZAR AÑOS DISPONIBLES (CORREGIDO)
  inicializarAnosDisponibles(): void {
    const anoActual = new Date().getFullYear();
    // Incluir años desde 2020 hasta 5 años en el futuro
    this.anosDisponibles = [];
    for (let i = 2020; i <= anoActual + 25; i++) {
      this.anosDisponibles.push(i);
    }
    this.anoSeleccionado = anoActual;
    this.mesSeleccionadoRapido = new Date().getMonth();
  }

  // MÉTODO EXISTENTE (se mantiene por compatibilidad)
  inicializarMesesDisponibles(): void {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const anoActual = new Date().getFullYear();
    const anoSiguiente = anoActual + 1;
    
    this.mesesDisponibles = [];
    
    // Agregar meses del año actual y siguiente
    for (let ano of [anoActual, anoSiguiente]) {
      for (let i = 0; i < 12; i++) {
        this.mesesDisponibles.push({
          value: `${ano}-${(i + 1).toString().padStart(2, '0')}`,
          nombre: `${meses[i]} ${ano}`
        });
      }
    }
  }

  // NUEVO MÉTODO PARA SELECCIONAR AÑO (CORREGIDO)
  seleccionarAno(ano: number): void {
    this.anoSeleccionado = ano;
    console.log('📅 Año seleccionado:', ano);
  }

  // NUEVO MÉTODO PARA SELECCIONAR MES
  seleccionarMes(mes: number): void {
    this.mesSeleccionadoRapido = mes;
    console.log('📅 Mes seleccionado:', this.mesesDelAno[mes]);
  }

  // NUEVO MÉTODO PARA APLICAR LA SELECCIÓN DE AÑO Y MES (CORREGIDO)
  aplicarAnioMesSeleccionado(): void {
    this.mesActual = new Date(this.anoSeleccionado, this.mesSeleccionadoRapido, 1);
    this.diaSeleccionado = null;
    this.actividadesFiltradas = [...this.actividades];
    this.generarCalendario();
    this.mostrarSelectorRapido = false;
    console.log('📅 Cambiando a:', this.mesesDelAno[this.mesSeleccionadoRapido], this.anoSeleccionado);
  }

  // MÉTODO MODIFICADO PARA TOGGLE DEL SELECTOR (nueva versión)
  toggleSelectorAnioMes(): void {
    // Al abrir el selector, establecer los valores actuales
    if (!this.mostrarSelectorRapido) {
      this.anoSeleccionado = this.mesActual.getFullYear();
      this.mesSeleccionadoRapido = this.mesActual.getMonth();
    }
    this.mostrarSelectorRapido = !this.mostrarSelectorRapido;
  }

  // MÉTODO EXISTENTE (se mantiene por compatibilidad)
  toggleSelectorMeses(): void {
    this.mostrarSelectorRapido = !this.mostrarSelectorRapido;
  }

  // MÉTODO EXISTENTE (se mantiene por compatibilidad)
  seleccionarMesRapido(mesValue: string): void {
    if (mesValue) {
      const [ano, mes] = mesValue.split('-');
      this.mesActual = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      this.diaSeleccionado = null;
      this.actividadesFiltradas = [...this.actividades];
      this.generarCalendario();
      this.mostrarSelectorRapido = false;
    }
  }

  // MÉTODO EXISTENTE (se mantiene por compatibilidad)
 cambiarMesRapido(): void {}

  // MÉTODOS PARA EL MODAL
  abrirCalendarioModal(): void {
    this.mostrarCalendarioModal = true;
    console.log('📅 Modal del calendario abierto');
    this.generarCalendario();
  }

  cerrarCalendarioModal(event?: any): void {
    if (event && event.target.classList.contains('calendar-modal-overlay')) {
      this.mostrarCalendarioModal = false;
    } else if (!event) {
      this.mostrarCalendarioModal = false;
    }
  }

  // MÉTODOS EXISTENTES PARA EL CALENDARIO
  generarCalendario(): void {
    this.diasDelMes = [];
    
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth();
    
    // Primer día del mes
    const primerDia = new Date(year, month, 1);
    // Último día del mes
    const ultimoDia = new Date(year, month + 1, 0);
    
    // Días de la semana (0 = Domingo, 1 = Lunes, etc.)
    const primerDiaSemana = primerDia.getDay();
    
    // Agregar días vacíos al inicio si es necesario
    for (let i = 0; i < primerDiaSemana; i++) {
      this.diasDelMes.push(null);
    }
    
    // Agregar todos los días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(year, month, dia);
      const actividadesDelDia = this.contarActividadesPorDia(fecha);
      const esHoy = this.esHoy(fecha);
      const esSeleccionado = this.diaSeleccionado && this.esMismoDia(fecha, this.diaSeleccionado);
      
      this.diasDelMes.push({
        fecha: fecha,
        actividades: actividadesDelDia,
        esHoy: esHoy,
        esSeleccionado: esSeleccionado
      });
    }
  }

  contarActividadesPorDia(fecha: Date): number {
    if (!this.actividadesFiltradas.length) return 0;
    
    const fechaStr = fecha.toISOString().split('T')[0];
    return this.actividadesFiltradas.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividad = new Date(actividad.fechaActividad).toISOString().split('T')[0];
      return fechaActividad === fechaStr && actividad.estatus === 'Activa';
    }).length;
  }

  esHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  }

  esMismoDia(fecha1: Date, fecha2: Date): boolean {
    return fecha1.getDate() === fecha2.getDate() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getFullYear() === fecha2.getFullYear();
  }

  getClaseDia(dia: any): string {
    if (!dia) return 'calendar-day empty';
    
    let clases = 'calendar-day';
    
    if (dia.esHoy) clases += ' today';
    if (dia.esSeleccionado) clases += ' selected';
    if (dia.actividades > 0) clases += ' has-activities';
    if (this.esFinDeSemana(dia.fecha)) clases += ' weekend';
    
    return clases;
  }

  getClaseContador(cantidad: number): string {
    if (cantidad >= 5) return 'count-high';
    if (cantidad >= 3) return 'count-medium';
    return 'count-low';
  }

  esFinDeSemana(fecha: Date): boolean {
    const diaSemana = fecha.getDay();
    return diaSemana === 0 || diaSemana === 6; // 0 = Domingo, 6 = Sábado
  }

  getTooltipDia(dia: any): string {
    if (!dia) return '';
    
    if (dia.actividades === 0) {
      return `${dia.fecha.toLocaleDateString('es-ES')} - Sin actividades`;
    } else {
      return `${dia.fecha.toLocaleDateString('es-ES')} - ${dia.actividades} actividad${dia.actividades !== 1 ? 'es' : ''}`;
    }
  }

  seleccionarDia(dia: any): void {
    if (!dia) return;
    
    this.diaSeleccionado = dia.fecha;
    
    // Filtrar actividades por el día seleccionado
    const fechaStr = dia.fecha.toISOString().split('T')[0];
    this.actividadesFiltradas = this.actividades.filter(actividad => {
      if (!actividad.fechaActividad) return false;
      const fechaActividad = new Date(actividad.fechaActividad).toISOString().split('T')[0];
      return fechaActividad === fechaStr;
    });
    
    // Regenerar calendario para actualizar clases
    this.generarCalendario();
    
    console.log(`📅 Día seleccionado: ${dia.fecha.toLocaleDateString('es-ES')}, actividades: ${dia.actividades}`);
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.diaSeleccionado = null;
    this.actividadesFiltradas = [...this.actividades];
    this.generarCalendario();
  }

  mesSiguiente(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.diaSeleccionado = null;
    this.actividadesFiltradas = [...this.actividades];
    this.generarCalendario();
  }

  irAHoy(): void {
    this.mesActual = new Date();
    this.diaSeleccionado = new Date();
    this.seleccionarDia({ fecha: this.diaSeleccionado });
  }

  // MÉTODOS EXISTENTES DEL FORMULARIO
  createForm(): FormGroup {
    return this.fb.group({
      idActividad: [''],
      nombreActividad: ['', [Validators.required, Validators.minLength(3)]],
      fechaActividad: ['', Validators.required],
      horaInicio: [''],
      horaFin: [''],
      descripcion: [''],
      cupo: [0, [Validators.required, Validators.min(0), Validators.max(50)]],
      lugar: ['', Validators.required],
      folioInstructor: [this.instructorFijo, Validators.required],
      imagenUrl: [this.getRandomDefaultImage()]
    });
  }

  onLugarSeleccionado(event: any): void {
    const valor = event.target.value;
    console.log('📍 Lugar seleccionado del dropdown:', valor);
    
    if (valor === 'personalizado') {
      this.mostrarCampoPersonalizado = true;
      this.lugarSeleccionado = 'personalizado';
      this.actividadForm.patchValue({ lugar: '' });
    } else if (valor && valor !== '') {
      this.mostrarCampoPersonalizado = false;
      this.lugarSeleccionado = valor;
      this.actividadForm.patchValue({ lugar: valor });
      console.log('📍 Lugar predefinido seleccionado:', valor);
    } else {
      this.mostrarCampoPersonalizado = false;
      this.lugarSeleccionado = '';
      this.actividadForm.patchValue({ lugar: '' });
    }
  }

  onLugarPersonalizadoChange(event: any): void {
    const valor = event.target.value;
    this.lugarSeleccionado = valor;
    console.log('📍 Lugar personalizado escrito:', valor);
  }

  limpiarLugarSeleccionado(): void {
    this.lugarSeleccionado = '';
    this.mostrarCampoPersonalizado = false;
    this.actividadForm.patchValue({ lugar: '' });
    console.log('📍 Lugar limpiado');
  }

  configurarLugarParaEdicion(lugar: string): void {
    const esLugarPredefinido = this.lugaresPredefinidos.includes(lugar);
    
    if (esLugarPredefinido) {
      this.lugarSeleccionado = lugar;
      this.mostrarCampoPersonalizado = false;
      console.log('📍 Editando - Lugar predefinido:', lugar);
    } else {
      this.lugarSeleccionado = lugar;
      this.mostrarCampoPersonalizado = true;
      console.log('📍 Editando - Lugar personalizado:', lugar);
    }
  }

  getFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  getRandomDefaultImage(): string {
    const randomIndex = Math.floor(Math.random() * this.defaultImages.length);
    return this.defaultImages[randomIndex];
  }

  generarHorasDisponibles(): void {
    this.horasDisponibles = [];
    for (let i = 6; i <= 22; i++) {
      this.horasDisponibles.push(`${i.toString().padStart(2, '0')}:00`);
    }
  }

  cargarActividadesInstructor(): void {
    this.isLoading = true;
    this.actividadService.obtenerActividadesPorInstructor(this.instructorFijo).subscribe({
      next: (data) => {
        this.actividades = data || [];
        this.actividadesFiltradas = [...this.actividades];
        this.isLoading = false;
        console.log('✅ Actividades del instructor cargadas:', this.actividades.length);
        this.generarCalendario();
      },
      error: (error) => {
        console.error('❌ Error al cargar actividades del instructor:', error);
        this.cargarTodasActividades();
      }
    });
  }

  cargarTodasActividades(): void {
    this.isLoading = true;
    this.actividadService.obtenerTodasActividades().subscribe({
      next: (data) => {
        this.actividades = (data || []).filter(actividad => 
          actividad.folioInstructor === this.instructorFijo
        );
        this.actividadesFiltradas = [...this.actividades];
        this.isLoading = false;
        console.log('✅ Actividades filtradas localmente:', this.actividades.length);
        this.generarCalendario();
      },
      error: (error) => {
        console.error('❌ Error al cargar todas las actividades:', error);
        this.actividades = [];
        this.actividadesFiltradas = [];
        this.isLoading = false;
        this.mostrarError('Error al cargar actividades', 'No se pudieron cargar las actividades. Por favor, intente nuevamente.');
      }
    });
  }

  mostrarFormularioNuevo(): void {
    this.isEditing = false;
    this.selectedActividad = null;
    this.selectedDate = '';
    this.duracionSeleccionada = 60;
    this.horarioSeleccionado = null;
    this.lugarSeleccionado = '';
    this.mostrarCampoPersonalizado = false;
    
    this.actividadForm.reset({
      idActividad: '',
      nombreActividad: '',
      fechaActividad: '',
      horaInicio: '',
      horaFin: '',
      descripcion: '',
      cupo: '',
      lugar: '',
      folioInstructor: this.instructorFijo,
      imagenUrl: this.getRandomDefaultImage()
    });
    
    this.showForm = true;
    this.showCalendar = false;
    console.log('🆔 ID será generado automáticamente por el backend');
  }

  mostrarFormularioEditar(actividad: Actividad): void {
    this.isEditing = true;
    this.selectedActividad = actividad;
    this.selectedDate = actividad.fechaActividad;
    
    const inicio = new Date(`2000-01-01T${actividad.horaInicio}`);
    const fin = new Date(`2000-01-01T${actividad.horaFin}`);
    const diffMs = fin.getTime() - inicio.getTime();
    this.duracionSeleccionada = Math.round(diffMs / (1000 * 60));
    
    this.horarioSeleccionado = {
      horaInicio: actividad.horaInicio.endsWith(':00') ? actividad.horaInicio : actividad.horaInicio + ':00',
      horaFin: actividad.horaFin.endsWith(':00') ? actividad.horaFin : actividad.horaFin + ':00'
    };
    
    console.log('🔄 Cargando actividad para edición:', {
      horario: this.horarioSeleccionado,
      duracion: this.duracionSeleccionada
    });
    
    this.configurarLugarParaEdicion(actividad.lugar);
    
    this.actividadForm.patchValue({
      idActividad: actividad.idActividad,
      nombreActividad: actividad.nombreActividad,
      fechaActividad: actividad.fechaActividad,
      horaInicio: this.horarioSeleccionado.horaInicio,
      horaFin: this.horarioSeleccionado.horaFin,
      descripcion: actividad.descripcion || '',
      cupo: actividad.cupo,
      lugar: actividad.lugar,
      folioInstructor: actividad.folioInstructor,
      imagenUrl: actividad.imagenUrl || this.getRandomDefaultImage()
    });
    
    this.showForm = true;
    this.showCalendar = !!actividad.fechaActividad;
    
    setTimeout(() => {
      this.generarCalendario();
    }, 100);
  }

  onFechaSeleccionada(event: any): void {
    const fecha = event.target.value;
    this.selectedDate = fecha;
    this.horarioSeleccionado = null;
    
    if (fecha) {
      this.showCalendar = true;
      console.log('📅 Fecha seleccionada:', fecha);
    } else {
      this.showCalendar = false;
    }
  }

  cambiarDuracion(duracion: number): void {
    if (this.horarioSeleccionado && this.duracionSeleccionada !== duracion) {
      const horaInicio = this.horarioSeleccionado.horaInicio.substring(0, 5);
      const nuevaHoraFin = this.calcularHoraFin(horaInicio, duracion);
      
      this.actividadForm.patchValue({
        horaFin: nuevaHoraFin + ':00'
      });
      
      this.horarioSeleccionado.horaFin = nuevaHoraFin + ':00';
    }
    
    this.duracionSeleccionada = duracion;
    console.log('⏱️ Duración seleccionada:', duracion, 'minutos');
  }

  esHoraOcupada(hora: string): boolean {
    if (!this.selectedDate) return false;

    const horaInicioSeleccionada = hora;
    const horaFinSeleccionada = this.calcularHoraFin(hora, this.duracionSeleccionada);

    const inicioSeleccionado = new Date(`2000-01-01T${horaInicioSeleccionada}:00`);
    const finSeleccionado = new Date(`2000-01-01T${horaFinSeleccionada}:00`);

    return this.actividades.some(actividad => {
      if (actividad.estatus !== 'Activa') return false;
      if (actividad.fechaActividad !== this.selectedDate) return false;
      if (this.isEditing && actividad.idActividad === this.selectedActividad?.idActividad) return false;
      
      const inicioActividad = actividad.horaInicio?.substring(0, 5) || '';
      const finActividad = actividad.horaFin?.substring(0, 5) || '';
      
      const inicioAct = new Date(`2000-01-01T${inicioActividad}:00`);
      const finAct = new Date(`2000-01-01T${finActividad}:00`);
      
      const hayConflicto = 
        (inicioSeleccionado >= inicioAct && inicioSeleccionado < finAct) ||
        (finSeleccionado > inicioAct && finSeleccionado <= finAct) ||
        (inicioSeleccionado <= inicioAct && finSeleccionado >= finAct);

      return hayConflicto;
    });
  }

  seleccionarHorario(hora: string): void {
    if (!this.esHoraOcupada(hora)) {
      const horaFin = this.calcularHoraFin(hora, this.duracionSeleccionada);
      
      this.actividadForm.patchValue({
        horaInicio: hora + ':00',
        horaFin: horaFin + ':00'
      });
      
      this.horarioSeleccionado = {
        horaInicio: hora + ':00',
        horaFin: horaFin + ':00'
      };
      
      console.log('🕐 Horario seleccionado:', hora, 'a', horaFin, `(${this.duracionSeleccionada} minutos)`);
    } else {
      this.mostrarAdvertencia('Horario Ocupado', 'Este horario ya está ocupado. Por favor selecciona otro.');
    }
  }

  esHorarioCargado(hora: string): boolean {
    if (!this.horarioSeleccionado) return false;
    const horaCargada = this.horarioSeleccionado.horaInicio.substring(0, 5);
    return horaCargada === hora;
  }

  getHourSlotClass(hora: string): string {
    let classes = 'hour-slot';
    
    if (this.esHoraOcupada(hora)) {
      classes += ' occupied';
    } else {
      classes += ' available';
    }
    
    if (this.esHorarioSeleccionado(hora) || this.esHorarioCargado(hora)) {
      classes += ' selected';
    }
    
    return classes;
  }

  esHorarioSeleccionado(hora: string): boolean {
    if (!this.horarioSeleccionado) return false;
    const horaInicioSeleccionada = this.horarioSeleccionado.horaInicio.substring(0, 5);
    return horaInicioSeleccionada === hora;
  }

  getHourStatusIcon(hora: string): string {
    if (this.esHoraOcupada(hora)) {
      return 'fas fa-times-circle';
    } else if (this.esHorarioSeleccionado(hora) || this.esHorarioCargado(hora)) {
      return 'fas fa-check-circle';
    } else {
      return 'fas fa-clock';
    }
  }

  limpiarHorarioSeleccionado(): void {
    this.horarioSeleccionado = null;
    this.actividadForm.patchValue({
      horaInicio: '',
      horaFin: ''
    });
  }

  calcularHoraFin(horaInicio: string, duracion: number): string {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + duracion;
    
    let nuevasHoras = Math.floor(totalMinutos / 60);
    let nuevosMinutos = totalMinutos % 60;
    
    if (nuevasHoras >= 24) {
      nuevasHoras = 23;
      nuevosMinutos = 59;
    }
    
    return `${nuevasHoras.toString().padStart(2, '0')}:${nuevosMinutos.toString().padStart(2, '0')}`;
  }

  getDuracionTexto(duracion: number): string {
    if (duracion === 60) return '1 hora';
    if (duracion === 90) return '1.5 horas';
    if (duracion === 120) return '2 horas';
    if (duracion === 150) return '2.5 horas';
    return `${duracion} min`;
  }

  formatearHoraParaDisplay(hora: string): string {
    if (!hora) return '';
    return hora.substring(0, 5);
  }

  async guardarActividad(): Promise<void> {
    if (!this.horarioSeleccionado) {
      this.mostrarAdvertencia('Horario Requerido', 'Por favor selecciona un horario del calendario');
      return;
    }

    if (this.actividadForm.valid) {
      const actividadData: Actividad = this.actividadForm.value;

      const fechaActividad = new Date(actividadData.fechaActividad);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaActividad < hoy) {
        this.mostrarError('Fecha Inválida', 'La fecha de la actividad no puede ser en el pasado');
        return;
      }

      try {
        let tieneConflicto = false;

        if (this.isEditing && this.selectedActividad) {
          tieneConflicto = await this.verificarConflictoHorarioExcluyendo(
            actividadData.lugar,
            actividadData.fechaActividad,
            actividadData.horaInicio,
            actividadData.horaFin,
            this.selectedActividad.idActividad
          );
        } else {
          tieneConflicto = await this.verificarConflictoHorario(
            actividadData.lugar,
            actividadData.fechaActividad,
            actividadData.horaInicio,
            actividadData.horaFin
          );
        }

        if (tieneConflicto) {
          this.mostrarError('Conflicto de Horario', 'Ya existe una actividad en el mismo lugar y horario');
          return;
        }

        if (this.isEditing && this.selectedActividad) {
          this.actividadService.actualizarActividad(this.selectedActividad.idActividad, actividadData)
            .subscribe({
              next: () => {
                this.mostrarExito('¡Éxito!', 'Actividad actualizada exitosamente');
                this.cancelarEdicion();
                this.cargarActividadesInstructor();
              },
              error: (error) => {
                console.error('❌ Error al actualizar actividad:', error);
                const errorMessage = error.error?.message || error.error || 'Error desconocido';
                this.mostrarError('Error al Actualizar', 'Error al actualizar la actividad: ' + errorMessage);
              }
            });
        } else {
          const { idActividad, ...actividadSinId } = actividadData;
          
          this.actividadService.crearActividad(actividadSinId as Actividad)
            .subscribe({
              next: (nuevaActividad) => {
                this.mostrarExito('¡Éxito!', `Actividad creada exitosamente`);
                this.cancelarEdicion();
                this.cargarActividadesInstructor();
              },
              error: (error) => {
                console.error('❌ Error al crear actividad:', error);
                const errorMessage = error.error?.message || error.error || 'Error desconocido';
                this.mostrarError('Error al Crear', 'Error al crear la actividad: ' + errorMessage);
              }
            });
        }
      } catch (error) {
        console.error('❌ Error al verificar conflicto:', error);
        this.mostrarError('Error de Verificación', 'Error al verificar disponibilidad de horario');
      }
    } else {
      this.marcarCamposInvalidos();
      this.mostrarAdvertencia('Formulario Incompleto', 'Por favor complete todos los campos requeridos correctamente');
    }
  }

  private verificarConflictoHorarioExcluyendo(
    lugar: string, 
    fecha: string, 
    horaInicio: string, 
    horaFin: string, 
    excludeId: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.actividadService.verificarConflictoHorarioExcluyendo(lugar, fecha, horaInicio, horaFin, excludeId)
        .subscribe({
          next: (tieneConflicto) => {
            console.log('🔍 Resultado verificación backend (excluyendo):', tieneConflicto);
            resolve(tieneConflicto);
          },
          error: (error) => {
            console.error('❌ Error en verificación excluyendo:', error);
            resolve(false);
          }
        });
    });
  }

  private verificarConflictoHorario(
    lugar: string, 
    fecha: string, 
    horaInicio: string, 
    horaFin: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.actividadService.verificarConflictoHorario(lugar, fecha, horaInicio, horaFin)
        .subscribe({
          next: (tieneConflicto) => {
            console.log('🔍 Resultado verificación backend:', tieneConflicto);
            resolve(tieneConflicto);
          },
          error: () => resolve(false)
        });
    });
  }

  private marcarCamposInvalidos(): void {
    Object.keys(this.actividadForm.controls).forEach(key => {
      const control = this.actividadForm.get(key);
      if (control?.invalid) {
        control.markAsTouched();
      }
    });
  }

  desactivarActividad(id: string): void {
    this.mostrarConfirmacion(
      '¿Desactivar Actividad?',
      'La actividad ya no estará disponible para los clientes. ¿Está seguro de que desea desactivar esta actividad?',
      'question',
      'Sí, desactivar',
      'Cancelar'
    ).then((result) => {
      if (result.isConfirmed) {
        this.actividadService.desactivarActividad(id)
          .subscribe({
            next: () => {
              this.mostrarExito('¡Desactivada!', 'Actividad desactivada exitosamente');
              this.cargarActividadesInstructor();
            },
            error: (error) => {
              console.error('❌ Error al desactivar actividad:', error);
              this.mostrarError('Error', 'Error al desactivar la actividad');
            }
          });
      }
    });
  }

  activarActividad(id: string): void {
    this.mostrarConfirmacion(
      '¿Activar Actividad?',
      'La actividad estará disponible para los clientes. ¿Está seguro de que desea activar esta actividad?',
      'question',
      'Sí, activar',
      'Cancelar'
    ).then((result) => {
      if (result.isConfirmed) {
        this.actividadService.activarActividad(id)
          .subscribe({
            next: () => {
              this.mostrarExito('¡Activada!', 'Actividad activada exitosamente');
              this.cargarActividadesInstructor();
            },
            error: (error) => {
              console.error('❌ Error al activar actividad:', error);
              this.mostrarError('Error', 'Error al activar la actividad');
            }
          });
      }
    });
  }

  cancelarEdicion(): void {
    this.showForm = false;
    this.isEditing = false;
    this.selectedActividad = null;
    this.selectedDate = '';
    this.showCalendar = false;
    this.duracionSeleccionada = 60;
    this.horarioSeleccionado = null;
    this.lugarSeleccionado = '';
    this.mostrarCampoPersonalizado = false;
    this.actividadForm.reset({
      folioInstructor: this.instructorFijo,
      imagenUrl: this.getRandomDefaultImage()
    });
  }

  buscarActividades(): void {
    if (this.searchTerm.trim()) {
      this.actividadService.buscarActividadesPorNombre(this.searchTerm)
        .subscribe({
          next: (data) => {
            this.actividades = (data || []).filter(actividad => 
              actividad.folioInstructor === this.instructorFijo
            );
            this.actividadesFiltradas = [...this.actividades];
            console.log('🔍 Resultados de búsqueda:', this.actividades.length);
            this.generarCalendario();
            
            if (this.actividadesFiltradas.length === 0) {
              this.mostrarInfo('Búsqueda Sin Resultados', 'No se encontraron actividades que coincidan con tu búsqueda.');
            }
          },
          error: (error) => {
            console.error('❌ Error al buscar actividades:', error);
            this.actividades = [];
            this.actividadesFiltradas = [];
            this.mostrarError('Error en Búsqueda', 'Error al buscar actividades');
          }
        });
    } else {
      this.cargarActividadesInstructor();
    }
  }

  verificarCupo(id: string): void {
    this.actividadService.verificarCupoDisponible(id)
      .subscribe({
        next: (disponible) => {
          if (disponible) {
            this.mostrarExito('Cupo Disponible', 'Hay cupo disponible para esta actividad');
          } else {
            this.mostrarAdvertencia('Cupo Lleno', 'No hay cupo disponible para esta actividad');
          }
        },
        error: (error) => {
          console.error('❌ Error al verificar cupo:', error);
          this.mostrarError('Error', 'Error al verificar la disponibilidad de cupo');
        }
      });
  }

  get actividadesFiltradasParaMostrar(): Actividad[] {
    let actividades = this.actividadesFiltradas;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      actividades = actividades.filter(actividad =>
        actividad.nombreActividad?.toLowerCase().includes(term) ||
        actividad.lugar?.toLowerCase().includes(term) ||
        (actividad.descripcion && actividad.descripcion.toLowerCase().includes(term))
      );
    }

    return actividades;
  }

  getEstatusBadgeClass(estatus: string): string {
    return estatus === 'Activa' ? 'badge-activa' : 'badge-inactiva';
  }

  getImagenActividad(actividad: Actividad): string {
    return actividad.imagenUrl || this.getRandomDefaultImage();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.actividadForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.actividadForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;
      if (field.errors['max']) return `El valor máximo es ${field.errors['max'].max}`;
    }
    return '';
  }

  formatearHora(hora: string): string {
    if (!hora) return '';
    
    const horaSinSegundos = hora.substring(0, 5);
    const [horas, minutos] = horaSinSegundos.split(':').map(Number);
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas % 12 || 12;
    
    return `${horas12}:${minutos.toString().padStart(2, '0')} ${ampm}`;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  limpiarBusqueda(): void {
    this.searchTerm = '';
    this.cargarActividadesInstructor();
  }

  get totalActivas(): number {
    return this.actividadesFiltradasParaMostrar.filter((a: Actividad) => a.estatus === 'Activa').length;
  }

  get totalActividades(): number {
    return this.actividadesFiltradasParaMostrar.length;
  }

  // MÉTODOS SWEETALERT2
  private mostrarExito(titulo: string, mensaje: string): void {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'success',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Aceptar',
      timer: 3000,
      timerProgressBar: true
    });
  }

  private mostrarError(titulo: string, mensaje: string): void {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'error',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Aceptar'
    });
  }

  private mostrarAdvertencia(titulo: string, mensaje: string): void {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'warning',
      confirmButtonColor: '#ffc107',
      confirmButtonText: 'Entendido'
    });
  }

  private mostrarInfo(titulo: string, mensaje: string): void {
    Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'info',
      confirmButtonColor: '#17a2b8',
      confirmButtonText: 'Aceptar'
    });
  }

  private mostrarConfirmacion(
    titulo: string, 
    mensaje: string, 
    icon: 'warning' | 'question' | 'info' | 'success' | 'error' = 'question',
    confirmButtonText: string = 'Confirmar',
    cancelButtonText: string = 'Cancelar'
  ): Promise<any> {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon: icon,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      reverseButtons: true
    });
  }
}