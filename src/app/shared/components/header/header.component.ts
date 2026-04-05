import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="header-content">
        <div class="logo">↯ ReActívate</div>
        <nav class="nav-links" *ngIf="isAuthenticated">
          <a class="nav-link" routerLink="/app/health" routerLinkActive="active">Salud</a>
          <a class="nav-link" routerLink="/app/exercises" routerLinkActive="active">Ejercicios</a>
          <a class="nav-link" routerLink="/app/blog" routerLinkActive="active">Blog</a>
          <a class="nav-link" routerLink="/app/forum" routerLinkActive="active">Foro</a>
          <a class="nav-link" routerLink="/app/parks" routerLinkActive="active">Parques</a>
        </nav>
        <div class="auth-actions" *ngIf="!isAuthenticated">
          <a class="auth-link" routerLink="/login" routerLinkActive="active">Iniciar Sesión</a>
          <a class="auth-link register" routerLink="/register" routerLinkActive="active">Registrarse</a>
        </div>
        <div class="header-actions">
          <button class="theme-toggle" (click)="toggleTheme()" [title]="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
            <span class="theme-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
          </button>
          <button class="logout-btn" *ngIf="isAuthenticated" (click)="logout()">Salir</button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: linear-gradient(125deg, #4f46e5, #7c3aed);
      color: #fff;
      padding: 0;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: background 0.3s ease;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .dark-mode .header {
      background: linear-gradient(125deg, #1a1a2e, #16213e);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 2rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
    }

    .nav-links {
      display: flex;
      gap: 2.5rem;
      align-items: center;
    }

    .nav-link {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      font-weight: 500;
      padding: 0.8rem 1.5rem;
      border-radius: 12px;
      transition: all 0.2s ease;
      font-size: 1.1rem;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      transform: translateY(-1px);
    }

    .nav-link.active {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      font-weight: 600;
    }

    .auth-actions {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .auth-link {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      font-weight: 500;
      padding: 0.8rem 1.5rem;
      border-radius: 12px;
      transition: all 0.2s ease;
      font-size: 1.1rem;
    }

    .auth-link:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      transform: translateY(-1px);
    }

    .auth-link.active {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    .auth-link.register {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .auth-link.register:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .theme-toggle {
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #fff;
    }

    .theme-toggle:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
      transform: scale(1.05);
    }

    .theme-icon {
      font-size: 1.4rem;
    }

    .logout-btn {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      padding: 0.8rem 1.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1.1rem;
    }

    .logout-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-links {
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
      }

      .auth-actions {
        flex-direction: column;
        gap: 0.5rem;
      }

      .header-actions {
        order: -1;
        justify-content: center;
      }
    }
  `]
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isDarkMode(): boolean {
    return this.themeService.isDarkMode();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
