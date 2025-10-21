import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MembresiaService,Membresia } from '../../../services/membresia/membresia';

@Component({
  selector: 'app-membresia-list',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './membresia-list.html',
  styleUrl: './membresia-list.css'
})
export class MembresiaList implements OnInit {
  membresias: Membresia[] = [];
  membresiasFiltradas: Membresia[] = [];
  filtro: string = '';
  estadisticas: any = {};
  loading: boolean = false;

  constructor(private membresiaService: MembresiaService) { }

  ngOnInit(): void {
    this.cargarMembresias();
    this.cargarEstadisticas();
  }

  cargarMembresias(): void {
    this.loading = true;
    this.membresiaService.getMembresias().subscribe({
      next: (data) => {
        this.membresias = data;
        this.membresiasFiltradas = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar membresías:', error);
        alert('Error al cargar las membresías');
        this.loading = false;
      }
    });
  }

  cargarEstadisticas(): void {
    this.membresiaService.getEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas = data;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  aplicarFiltro(): void {
    if (!this.filtro) {
      this.membresiasFiltradas = this.membresias;
      return;
    }

    const filtroLower = this.filtro.toLowerCase();
    this.membresiasFiltradas = this.membresias.filter(membresia =>
      membresia.tipo.toLowerCase().includes(filtroLower) ||
      membresia.descripcion.toLowerCase().includes(filtroLower) ||
      membresia.estatus.toLowerCase().includes(filtroLower) ||
      membresia.idMembresia.toLowerCase().includes(filtroLower)
    );
  }

  desactivarMembresia(id: string): void {
    if (confirm('¿Estás seguro de que deseas desactivar esta membresía?')) {
      this.membresiaService.desactivarMembresia(id).subscribe({
        next: () => {
          this.cargarMembresias();
          this.cargarEstadisticas();
          alert('Membresía desactivada exitosamente');
        },
        error: (error) => {
          console.error('Error al desactivar membresía:', error);
          alert('Error al desactivar la membresía');
        }
      });
    }
  }

  activarMembresia(id: string): void {
    this.membresiaService.activarMembresia(id).subscribe({
      next: () => {
        this.cargarMembresias();
        this.cargarEstadisticas();
        alert('Membresía activada exitosamente');
      },
      error: (error) => {
        console.error('Error al activar membresía:', error);
        alert('Error al activar la membresía');
      }
    });
  }

  limpiarFiltro(): void {
    this.filtro = '';
    this.membresiasFiltradas = this.membresias;
  }
}