import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../../../services/Auth/AuthService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-component.html',
  styleUrls: ['./login-component.css']
})
export class LoginComponent {
  loginRequest: LoginRequest = {
    username: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.loginRequest.username || !this.loginRequest.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.success) {
          this.redirectToDashboard(response.tipoUsuario);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Error de conexión. Por favor, intente nuevamente.';
        console.error('Login error:', error);
      }
    });
  }
//en esto hay que cambiar la ruta de cada rol de lo que estara visualizando al ingresar
  private redirectToDashboard(tipoUsuario: string | undefined): void {
    switch (tipoUsuario) {
      case 'Administrador':
        this.router.navigate(['/admin']);
        break;
      case 'Recepcionista':
        this.router.navigate(['/recepcionista']);
        break;
      case 'Instructor':
        this.router.navigate(['/instructores']);
        break;
      case 'Cliente':
        this.router.navigate(['/cliente']);
        break;
      default:
        this.router.navigate(['/recepcionista']);
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}