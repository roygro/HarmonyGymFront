import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';

// Componente del diálogo de confirmación
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

// Componente principal del header
@Component({
  selector: 'app-header-instructor',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatDialogModule],
  templateUrl: './header-instructor.html',
  styleUrls: ['./header-instructor.css']
})
export class HeaderInstructorComponent implements OnInit {
  isMobileMenuOpen = false;
  currentPageTitle = 'Harmony Gym';
  currentPageSubtitle = 'Sistema de gestión deportiva';
  currentPageIcon = 'fas fa-dumbbell';
  
  // Definir los títulos para cada ruta
  private pageTitles: { [key: string]: { title: string; subtitle: string; icon: string } } = {
    '/actividades': {
      title: 'Mis Actividades',
      subtitle: 'Gestiona y organiza tus actividades deportivas',
      icon: 'fas fa-dumbbell'
    },
    '/rutinas': {
      title: 'Gestión de Rutinas y Ejercicios',
      subtitle: 'Crea y gestiona rutinas de entrenamiento personalizadas',
      icon: 'fas fa-dumbbell'
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
      this.currentPageIcon = pageInfo.icon;
    } else {
      // Valores por defecto
      this.currentPageTitle = 'Harmony Gym';
      this.currentPageSubtitle = 'Sistema de gestión deportiva';
      this.currentPageIcon = 'fas fa-dumbbell';
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