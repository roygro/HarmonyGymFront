import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, animate, transition, keyframes } from '@angular/animations';
import { AuthService, LoginRequest } from '../../../services/Auth/AuthService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-component.html',
  styleUrls: ['./login-component.css'],
  animations: [
    trigger('shake', [
      transition('* => *', [
        animate('0.5s', keyframes([
          style({ transform: 'translateX(0)', offset: 0 }),
          style({ transform: 'translateX(-10px)', offset: 0.1 }),
          style({ transform: 'translateX(10px)', offset: 0.2 }),
          style({ transform: 'translateX(-10px)', offset: 0.3 }),
          style({ transform: 'translateX(10px)', offset: 0.4 }),
          style({ transform: 'translateX(-10px)', offset: 0.5 }),
          style({ transform: 'translateX(10px)', offset: 0.6 }),
          style({ transform: 'translateX(-10px)', offset: 0.7 }),
          style({ transform: 'translateX(10px)', offset: 0.8 }),
          style({ transform: 'translateX(-10px)', offset: 0.9 }),
          style({ transform: 'translateX(0)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  loginRequest: LoginRequest = {
    username: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';
  serverStatus = '';
  showPassword = false;
  particles: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkServerConnection();
  }

  ngOnInit(): void {
    this.createParticles();
  }

  // Crear partículas decorativas
  createParticles(): void {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 6 + 2}px`,
        height: `${Math.random() * 6 + 2}px`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${Math.random() * 10 + 10}s`
      });
    }
  }

  // Verificar conexión con el servidor al inicializar
  checkServerConnection(): void {
    console.log('🔍 Verificando conexión con el servidor...');
    this.authService.checkServerStatus().subscribe({
      next: (response) => {
        this.serverStatus = 'Conectado';
        console.log('✅ Servidor conectado:', response);
      },
      error: (error) => {
        this.serverStatus = 'Desconectado';
        console.error('❌ No se puede conectar al servidor:', error);
      }
    });
  }

  // Alternar visibilidad de contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.loginRequest.username || !this.loginRequest.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('📤 Enviando login request:', {
      username: this.loginRequest.username,
      password: '***' // No loguear la contraseña completa por seguridad
    });

    this.authService.login(this.loginRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('📥 Respuesta completa del servidor:', response);
        
        if (response.success) {
          console.log('✅ Login exitoso!');
          console.log('👤 Datos del usuario:', {
            idUsuario: response.idUsuario,
            username: response.username,
            tipoUsuario: response.tipoUsuario,
            nombreCompleto: response.nombreCompleto,
            nombreRol: response.nombreRol
          });
          
          this.redirectToDashboard(response.tipoUsuario);
        } else {
          console.log('❌ Login fallido:', response.message);
          this.errorMessage = response.message || 'Credenciales incorrectas';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Error en la solicitud de login:', error);
        
        // Mensajes de error más específicos
        if (error.status === 401) {
          this.errorMessage = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. Verifique que el backend esté ejecutándose en http://localhost:8081';
        } else if (error.status === 500) {
          this.errorMessage = 'Error interno del servidor. Por favor, contacte al administrador.';
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error de conexión. Por favor, intente nuevamente.';
        }
        
        console.error('🔍 Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
      },
      complete: () => {
        console.log('🔚 Observable de login completado');
      }
    });
  }

  // Método para probar con datos de prueba (actualizado con usuarios reales)
  fillTestCredentials(role: string): void {
    const testCredentials: { [key: string]: { username: string, password: string } } = {
      admin: { username: 'admin', password: '$2a$10$8K1p/a0k' }, // Usa la contraseña hasheada real
      recepcionista: { username: 'maria.gonzalez', password: '$2a$10$8K1p/a0k' },
      instructor: { username: 'ana.martinez', password: '$2a$10$8K1p/a0k' },
      cliente: { username: 'ana.rodriguez', password: '$2a$10$8K1p/a0k' }
    };

    const credentials = testCredentials[role];
    if (credentials) {
      this.loginRequest.username = credentials.username;
      this.loginRequest.password = credentials.password;
      console.log(`🧪 Credenciales de ${role} cargadas:`, {
        username: credentials.username,
        password: '***' // No mostrar contraseña real en logs
      });
    }
  }

  // Método para limpiar el formulario
  clearForm(): void {
    this.loginRequest = { username: '', password: '' };
    this.errorMessage = '';
    console.log('🧹 Formulario limpiado');
  }

  private redirectToDashboard(tipoUsuario: string | undefined): void {
    console.log('🔄 Redirigiendo a dashboard para:', tipoUsuario);
    
    // Mapeo de tipos de usuario a rutas
    const routeMap: { [key: string]: string } = {
      'Administrador': '/membresias',
      'Recepcionista': '/pagos', 
      'Instructor': '/actividades',
      'Cliente': '/cliente/dashboard'
    };

    const route = routeMap[tipoUsuario || ''] || '/recepcionista';
    console.log('📍 Navegando a:', route);
    
    this.router.navigate([route]);
  }

  navigateToRegister(): void {
    console.log('📝 Navegando a registro');
    this.router.navigate(['/register']);
  }

  // Método para verificar disponibilidad de username
  checkUsernameAvailability(): void {
    if (this.loginRequest.username) {
      console.log('🔍 Verificando disponibilidad de username:', this.loginRequest.username);
      this.authService.checkUsernameAvailability(this.loginRequest.username).subscribe({
        next: (response) => {
          console.log('✅ Disponibilidad username:', response);
          if (response.disponible) {
            console.log('✅ Username disponible');
          } else {
            console.log('❌ Username no disponible');
          }
        },
        error: (error) => {
          console.error('❌ Error verificando username:', error);
        }
      });
    }
  }

  // Método para probar la conexión manualmente
  testConnection(): void {
    console.log('🧪 Probando conexión con el servidor...');
    this.checkServerConnection();
  }
}