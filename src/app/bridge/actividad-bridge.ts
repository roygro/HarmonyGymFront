import { Actividad } from '../services/instructor/ActividadService';
import { NivelDificultad } from './nivel-dificultad';

export class ActividadBridge {
  constructor(
    private actividad: Actividad,
    private nivel: NivelDificultad
  ) {}

  // Métodos que usan el Bridge
  getInfoNivel() {
    return {
      nombre: this.nivel.getNombre(),
      intensidad: this.nivel.getIntensidad(),
      color: this.nivel.getColor(),
      duracionRecomendada: this.nivel.getDuracionRecomendada(60), // 60 mins base
      requisitos: this.nivel.getRequisitos(),
      descripcion: this.nivel.getDescripcion(),
      badgeClass: this.nivel.getBadgeClass()
    };
  }

  puedeUnirseUsuario(usuario: any): boolean {
    return this.nivel.puedeParticipar(usuario);
  }

  getRecomendacionUsuario(usuario: any): string {
    if (this.puedeUnirseUsuario(usuario)) {
      return `✅ Perfecto para tu nivel actual`;
    } else {
      return `❌ Requiere: ${this.nivel.getRequisitos().join(', ')}`;
    }
  }

  // Métodos de delegación para acceder a la actividad original
  getActividad(): Actividad {
    return this.actividad;
  }
}