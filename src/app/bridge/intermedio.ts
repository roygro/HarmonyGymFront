import { NivelDificultad } from './nivel-dificultad';

export class Intermedio implements NivelDificultad {
  getNombre(): string { return 'intermedio'; }
  getIntensidad(): number { return 6; }
  getColor(): string { return '#FF9800'; } // Naranja
  getDuracionRecomendada(duracionBase: number): number { 
    return duracionBase; // Duración estándar
  }
  getRequisitos(): string[] { 
    return ['3+ meses de experiencia', 'Técnica básica dominada']; 
  }
puedeParticipar(usuario: any): boolean { 
  if (!usuario?.tieneMembresiaActiva) return false;
  
  // Usa datos REALES del usuario
  const experiencia = usuario.experienciaMeses || 0;
  const clasesCompletadas = usuario.clasesCompletadas || 0;
  
  return experiencia >= 3 || clasesCompletadas >= 10;
}
  getDescripcion(): string { 
    return 'Para quienes buscan llevar su entrenamiento al siguiente nivel.'; 
  }
  getBadgeClass(): string { return 'badge-intermedio'; }
}