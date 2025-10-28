import { Routes } from '@angular/router';
import { RecepcionistaComponent } from './component/Administrador/recepcionista-component/recepcionista-component';
import { MembresiaList } from './component/membresias/membresia-list/membresia-list';
import { MembresiaForm } from './component/membresias/membresia-form/membresia-form';
import { InstructorComponent } from './component/Administrador/instructor-component/instructor-component';
import { RutinaComponent } from './component/instructor/rutina/rutina-component/rutina-component';
import { ClienteComponent } from './component/Cliente/cliente-component/cliente-component';
import { PagoList } from './component/pagos/pago-list/pago-list';
import { PagoDetails } from './component/pagos/pago-details/pago-details';
import { PagoCreate } from './component/pagos/pago-create/pago-create';
import { LoginComponent } from './component/Auth/login-component/login-component';
import { ClienteMembresiaComponent } from './component/membresias/cliente-membresia/cliente-membresia';
import { HeaderRecepcionistaComponent } from './component/recepcionista/header-recepcionista/header-recepcionista';

export const routes: Routes = [

  // Rutas de Autenticación
  { 
    path: 'login', 
    component: LoginComponent 
  },

 {
   path: 'header', 
    component: HeaderRecepcionistaComponent 
  },
  
  //Rutas del cliente
    // Ruta para dashboard del cliente
  { 
    path: 'cliente/dashboard', 
    loadComponent: () => import('./component/Cliente/cliente-dashboard-component/cliente-dashboard-component').then(m => m.ClienteDashboardComponent)
  },
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


    // Nueva Ruta para Membresías de Clientes
  { 
    path: 'membresias-clientes', 
    component: ClienteMembresiaComponent 
  },

  // Ruta para actividades PRIMERO - usando loadComponent
  {
    path: 'actividades', 
    loadComponent: () => import('./component/instructor/actividades-component/actividades-component').then(m => m.ActividadesComponent)
  },
  
  // Ruta para recepcionista
  {
    path: 'recepcionista', 
    loadComponent: () => import('./component/Administrador/recepcionista-component/recepcionista-component').then(m => m.RecepcionistaComponent)
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
 

  // RUTAS DE ADMINISTRADOR 
  { 
    path: 'administradores', 
    loadComponent: () => import('./component/Administrador/administrador-component/administrador-component').then(m => m.AdministradorComponent)
  },
  { 
    path: 'administradores/dashboard', 
    loadComponent: () => import('./component/Administrador/administrador-dashboard-component/administrador-dashboard-component').then(m => m.AdministradorDashboardComponent)
  },
  
  // Ruta por defecto
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  
  // Ruta comodín
  {
    path: '**',
    redirectTo: 'login'
  }
];