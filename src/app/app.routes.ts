import { Routes } from '@angular/router';
import { Recepcionista } from './component/recepcionista/recepcionista';
import { MembresiaList } from './component/membresias/membresia-list/membresia-list';
import { MembresiaForm } from './component/membresias/membresia-form/membresia-form';
import { InstructorComponent } from './component/instructor/instructor-component/instructor-component';

export const routes: Routes = [

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
  

  // Ruta para actividades PRIMERO - usando loadComponent
  {
    path: 'actividades', 
    loadComponent: () => import('./component/instructor/actividades-component/actividades-component').then(m => m.ActividadesComponent)
  },
  // Ruta para recepcionista
  {
    path: 'recepcionista', 
    loadComponent: () => import('./component/recepcionista/recepcionista').then(m => m.Recepcionista)
  },
// Ruta para instructor
  { path: 'instructores', component: InstructorComponent },
  // Ruta por defecto
  { 
    path: '', 
    redirectTo: 'recepcionista', 
    pathMatch: 'full' 
  },
  // Ruta comodín
  {
    path: '**',
    redirectTo: 'recepcionista'

  }
];