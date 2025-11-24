import { NivelDificultad } from './nivel-dificultad';

export class Principiante implements NivelDificultad {
  getNombre(): string { return 'principiante'; }
  getIntensidad(): number { return 3; }
  getColor(): string { return '#4CAF50'; } // Verde
  getDuracionRecomendada(duracionBase: number): number { 
    return Math.round(duracionBase * 1.2); // +20%
  }
  getRequisitos(): string[] { 
    return ['Ninguna experiencia previa requerida', 'Voluntad de aprender']; 
  }
puedeParticipar(usuario: any): boolean { 
  // Verifica que el usuario esté activo y tenga membresía
  return usuario?.tieneMembresiaActiva !== false && 
         usuario?.estatus !== 'Inactivo';
}
  getDescripcion(): string { 
    return 'Perfecto para empezar. Enfoque en técnica y fundamentos.'; 
  }
  getBadgeClass(): string { return 'badge-principiante'; }
}