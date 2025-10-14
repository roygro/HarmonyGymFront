import { Routes } from '@angular/router';
import { Recepcionista } from './component/recepcionista/recepcionista';


export const routes: Routes = [
  // Ruta principal para empleados
  {
    
        path: 'recepcionista', 
        component: Recepcionista
      },
      // Puedes agregar más rutas aquí después
      { 
        path: '', 
        redirectTo: 'recepcionista', 
        pathMatch: 'full' 
      }
    ]
  
  
