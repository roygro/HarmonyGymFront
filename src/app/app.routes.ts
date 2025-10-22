import { Routes } from '@angular/router';
import { Recepcionista } from './component/recepcionista/recepcionista';
import { InstructorComponent } from './component/instructor/instructor-component/instructor-component';
import { RutinaComponent } from './component/instructor/rutina/rutina-component/rutina-component';
import { ClienteComponent } from './component/Cliente/cliente-component/cliente-component';

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
  { path: 'rutinas', component: RutinaComponent },

    { path: 'cliente', component: ClienteComponent },
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