import { Routes } from '@angular/router';
import { Recepcionista } from './component/recepcionista/recepcionista';
import { InstructorComponent } from './component/instructor/instructor-component/instructor-component';

export const routes: Routes = [
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