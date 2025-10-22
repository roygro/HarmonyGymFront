import { Routes } from '@angular/router';
import { Recepcionista } from './component/recepcionista/recepcionista';
import { MembresiaList } from './component/membresias/membresia-list/membresia-list';
import { MembresiaForm } from './component/membresias/membresia-form/membresia-form';
import { InstructorComponent } from './component/instructor/instructor-component/instructor-component';
import { RutinaComponent } from './component/instructor/rutina/rutina-component/rutina-component';
import { ClienteComponent } from './component/Cliente/cliente-component/cliente-component';
import { PagoList } from './component/pagos/pago-list/pago-list';
import { PagoDetails } from './component/pagos/pago-details/pago-details';
import { PagoCreate } from './component/pagos/pago-create/pago-create';

export const routes: Routes = [

  // Rutas de Pagos
  { 
    path: 'pagos', 
    component: PagoList 
  },
  { 
    path: 'pagos/crear', 
    component: PagoCreate 
  },
  { 
    path: 'pagos/:id', 
    component: PagoDetails 
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
  // Ruta para instructor
  { 
    path: 'instructores', 
    component: InstructorComponent 
  },
  
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