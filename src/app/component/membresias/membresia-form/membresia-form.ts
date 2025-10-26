import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MembresiaService, Membresia, TipoMembresia } from '../../../services/membresia/membresia';
import { HeaderAdministradorComponent } from '../../Administrador/header-admin/header-admin';

@Component({
  selector: 'app-membresia-form',
  imports: [CommonModule, FormsModule, RouterModule, HeaderAdministradorComponent],
  templateUrl: './membresia-form.html',
  styleUrl: './membresia-form.css'
})
export class MembresiaForm implements OnInit {
  membresia: Membresia = {
    idMembresia: '',
    tipo: TipoMembresia.Basica,
    precio: 0,
    duracion: 30,
    descripcion: '',
    beneficios: '',
    estatus: 'Activa',
    fechaCreacion: ''
  };

  modoEdicion: boolean = false;
  loading: boolean = false;
  tiposMembresia = Object.values(TipoMembresia);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private membresiaService: MembresiaService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'nueva') {
      this.modoEdicion = true;
      this.cargarMembresia(id);
    }
  }

  cargarMembresia(id: string): void {
    this.loading = true;
    this.membresiaService.getMembresiaById(id).subscribe({
      next: (data) => {
        this.membresia = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar membresía:', error);
        alert('Error al cargar la membresía');
        this.loading = false;
        this.router.navigate(['/membresias']);
      }
    });
  }

  guardarMembresia(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.loading = true;

    if (this.modoEdicion) {
      this.actualizarMembresia();
    } else {
      this.crearMembresia();
    }
  }

  crearMembresia(): void {
    this.membresiaService.createMembresia(this.membresia).subscribe({
      next: (response) => {
        this.loading = false;
        alert('Membresía creada exitosamente');
        this.router.navigate(['/membresias']);
      },
      error: (error) => {
        console.error('Error al crear membresía:', error);
        this.loading = false;
        alert('Error al crear la membresía: ' + (error.error?.message || error.message));
      }
    });
  }

  actualizarMembresia(): void {
    this.membresiaService.updateMembresia(this.membresia.idMembresia, this.membresia).subscribe({
      next: (response) => {
        this.loading = false;
        alert('Membresía actualizada exitosamente');
        this.router.navigate(['/membresias']);
      },
      error: (error) => {
        console.error('Error al actualizar membresía:', error);
        this.loading = false;
        alert('Error al actualizar la membresía: ' + (error.error?.message || error.message));
      }
    });
  }

  validarFormulario(): boolean {
    if (!this.membresia.tipo) {
      alert('El tipo de membresía es requerido');
      return false;
    }

    if (!this.membresia.precio || this.membresia.precio <= 0) {
      alert('El precio debe ser mayor a 0');
      return false;
    }

    if (!this.membresia.duracion || this.membresia.duracion <= 0) {
      alert('La duración debe ser mayor a 0 días');
      return false;
    }

    if (!this.membresia.descripcion?.trim()) {
      alert('La descripción es requerida');
      return false;
    }

    return true;
  }

  cancelar(): void {
    if (confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
      this.router.navigate(['/membresias']);
    }
  }

  get tituloFormulario(): string {
    return this.modoEdicion ? 'Editar Membresía' : 'Nueva Membresía';
  }

  get textoBotonGuardar(): string {
    return this.modoEdicion ? 'Actualizar' : 'Crear';
  }
}