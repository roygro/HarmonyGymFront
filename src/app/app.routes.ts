import { Routes } from '@angular/router';
import { Recepcionista } from './component/recepcionista/recepcionista';
import { MembresiaList } from './component/membresias/membresia-list/membresia-list';
import { MembresiaForm } from './component/membresias/membresia-form/membresia-form';

export const routes: Routes = [
  // Ruta principal para empleados
  { 
    path: 'recepcionista', 
    component: Recepcionista
  },
  
  // Rutas de Membresías
  { 
    path: 'membresias', 
    component: MembresiaList 
  },
  { 
    path: 'membresias/nueva', 
    component: MembresiaForm 
  },
  { 
    path: 'membresias/editar/:id', 
    component: MembresiaForm 
  },
  
  // Ruta por defecto
  { 
    path: '', 
    redirectTo: 'recepcionista', 
    pathMatch: 'full' 
  }
];