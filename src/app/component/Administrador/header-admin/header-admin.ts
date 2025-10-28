// header-admin.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';

// Componente del diálogo de confirmación (el mismo)
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title>Confirmar Cierre de Sesión</h2>
      <mat-dialog-content>
        <p>¿Estás seguro de que deseas cerrar sesión?</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onNoClick()">Cancelar</button>
        <button mat-raised-button color="warn" (click)="onYesClick()" cdkFocusInitial>
          Cerrar Sesión
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 300px;
    }
    mat-dialog-content p {
      margin: 0;
      font-size: 16px;
      color: #666;
    }
    mat-dialog-actions {
      gap: 8px;
      margin-top: 16px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}

// Componente principal del header del administrador
@Component({
  selector: 'app-header-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatDialogModule],
  templateUrl: './header-admin.html',
  styleUrls: ['./header-admin.css']
})
export class HeaderAdministradorComponent implements OnInit {
  isMobileMenuOpen = false;
  currentPageTitle = 'Harmony Gym';
  currentPageSubtitle = 'Panel de administración';
  
  // Definir los títulos para cada ruta DEL ADMINISTRADOR - ACTUALIZADO
  private pageTitles: { [key: string]: { title: string; subtitle: string } } = {
    '/membresias': {
      title: 'Gestión de Membresías',
      subtitle: 'Administra y controla las membresías del gimnasio'
    },
    '/instructores': {
      title: 'Gestión de Instructores',
      subtitle: 'Administra y organiza el personal de instructores'
    },
    '/administradores': {
      title: 'Gestión de Administradores',
      subtitle: 'Administra los usuarios administradores del sistema'
    },
    '/recepcionista': {
      title: 'Gestión de Recepcionistas',
      subtitle: 'Administra el personal de recepción'
    },
    '/pagos': {
      title: 'Gestión de Pagos',
      subtitle: 'Controla y monitorea los pagos del gimnasio'
    }
  };
  
  constructor(
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Escuchar cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.url);
      });

    // Actualizar título inicial
    this.updatePageTitle(this.router.url);
  }

  private updatePageTitle(url: string): void {
    // Buscar la ruta en el mapeo
    const route = Object.keys(this.pageTitles).find(route => url.includes(route));
    
    if (route && this.pageTitles[route]) {
      const pageInfo = this.pageTitles[route];
      this.currentPageTitle = pageInfo.title;
      this.currentPageSubtitle = pageInfo.subtitle;
    } else {
      // Valores por defecto
      this.currentPageTitle = 'Harmony Gym';
      this.currentPageSubtitle = 'Panel de administración';
    }
  }

  confirmLogout(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.logout();
      }
    });
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    this.router.navigate(['/login']);
  }

  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
}