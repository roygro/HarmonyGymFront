import { NivelDificultad } from './nivel-dificultad';

export class Avanzado implements NivelDificultad {
  getNombre(): string { return 'avanzado'; }
  getIntensidad(): number { return 9; }
  getColor(): string { return '#F44336'; } // Rojo
  getDuracionRecomendada(duracionBase: number): number { 
    return Math.round(duracionBase * 0.9); // -10%
  }
  getRequisitos(): string[] { 
    return ['6+ meses de experiencia', 'Evaluación física', 'Técnica avanzada']; 
  }
  puedeParticipar(usuario: any): boolean { 
  if (!usuario?.tieneMembresiaActiva) return false;
  
  const experiencia = usuario.experienciaMeses || 0;
  const evaluacionAprobada = usuario.evaluacionAprobada || false;
  const clasesCompletadas = usuario.clasesCompletadas || 0;
  
  return experiencia >= 6 && 
         evaluacionAprobada && 
         clasesCompletadas >= 20;
}
  getDescripcion(): string { 
    return 'Para atletas experimentados buscando máximo rendimiento.'; 
  }
  getBadgeClass(): string { return 'badge-avanzado'; }
}