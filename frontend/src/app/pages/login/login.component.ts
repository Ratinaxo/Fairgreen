import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-shell">
      <!-- Columna izquierda: Hero -->
      <div class="login-hero" role="img" aria-label="Campo de golf aéreo">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="hero-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <h1 class="hero-title">FAIRGREEN</h1>
          <p class="hero-subtitle">Control y Trazabilidad del estado<br>de Campos de Golf</p>
        </div>
        <!-- Golf field SVG illustration overlay -->
        <div class="hero-pattern" aria-hidden="true">
          <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="g1" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stop-color="rgba(76,175,125,0.15)"/>
                <stop offset="100%" stop-color="rgba(28,61,46,0)"/>
              </radialGradient>
            </defs>
            <ellipse cx="400" cy="300" rx="380" ry="260" fill="url(#g1)"/>
            <path d="M100,400 Q200,320 350,380 Q500,440 650,360 Q750,300 800,340 L800,600 L100,600 Z" fill="rgba(28,61,46,0.4)"/>
            <path d="M0,450 Q150,380 300,430 Q450,480 600,410 Q700,360 800,390 L800,600 L0,600 Z" fill="rgba(28,61,46,0.55)"/>
            <!-- Flag -->
            <circle cx="420" cy="295" r="4" fill="rgba(255,255,255,0.5)"/>
            <line x1="420" y1="295" x2="420" y2="245" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
            <polygon points="420,245 440,255 420,265" fill="rgba(76,175,125,0.8)"/>
          </svg>
        </div>
      </div>

      <!-- Columna derecha: Formulario -->
      <div class="login-form-col">
        <div class="login-form-wrapper">
          <!-- Logo marca -->
          <div class="form-logo">
            <div class="form-logo-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <span class="form-logo-text">Fairgreen</span>
          </div>

          <h2 class="form-title">Iniciar Sesión</h2>
          <p class="form-subtitle">Bienvenido al sistema de trazabilidad</p>

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" novalidate>
            <!-- Correo -->
            <div class="form-group">
              <label for="email-input" class="form-label">Correo Electrónico</label>
              <div class="input-group">
                <span class="input-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  id="email-input"
                  type="email"
                  class="input-field"
                  placeholder="usuario@fairgreen.com"
                  [(ngModel)]="email"
                  name="email"
                  required
                  autocomplete="email"
                  aria-required="true"
                />
              </div>
            </div>

            <!-- Contraseña -->
            <div class="form-group">
              <label for="password-input" class="form-label">Contraseña</label>
              <div class="input-group">
                <span class="input-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="password-input"
                  type="password"
                  class="input-field"
                  placeholder="••••••••"
                  [(ngModel)]="password"
                  name="password"
                  required
                  autocomplete="current-password"
                  aria-required="true"
                />
              </div>
            </div>

            <!-- Error -->
            @if (error) {
              <div class="form-error" role="alert">{{ error }}</div>
            }

            <!-- Botón -->
            <button type="submit" class="btn-primary w-100" id="login-submit-btn" [disabled]="isLoading">
              @if (isLoading) {
                <span class="spinner" aria-hidden="true"></span>
                Ingresando...
              } @else {
                Ingresar
              }
            </button>
          </form>

          <!-- Nota informativa -->
          <div class="info-note" role="note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>El acceso a esta plataforma está gestionado por el administrador del sistema. Si no tienes credenciales, contacta a tu responsable.</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-shell {
      display: flex;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }

    /* Hero */
    .login-hero {
      flex: 1;
      position: relative;
      background: #0D2B1A;
      overflow: hidden;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: rgba(10, 30, 18, 0.55);
      z-index: 1;
    }

    .hero-pattern {
      position: absolute;
      inset: 0;
      z-index: 0;
      svg { width: 100%; height: 100%; }
    }

    .hero-content {
      position: absolute;
      bottom: 48px;
      left: 48px;
      z-index: 2;
    }

    .hero-logo {
      color: var(--color-accent);
      margin-bottom: 16px;
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: 36px;
      color: white;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    .hero-subtitle {
      font-size: 13px;
      color: rgba(255,255,255,0.75);
      line-height: 1.6;
    }

    /* Form column */
    .login-form-col {
      width: 480px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }

    .login-form-wrapper { width: 100%; max-width: 340px; }

    /* Logo */
    .form-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 32px;
    }

    .form-logo-icon {
      color: var(--color-primary);
      display: flex;
    }

    .form-logo-text {
      font-family: var(--font-display);
      font-size: 20px;
      color: var(--color-primary);
    }

    /* Title */
    .form-title {
      font-family: var(--font-display);
      font-size: 22px;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .form-subtitle {
      font-size: 13px;
      color: var(--color-text-muted);
      margin-bottom: 28px;
    }

    /* Form groups */
    .form-group { margin-bottom: 18px; }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 6px;
    }

    .w-100 { width: 100%; margin-top: 8px; justify-content: center; }

    /* Error */
    .form-error {
      background: #FEE2E2;
      color: #991B1B;
      border-radius: var(--radius-md);
      padding: 8px 12px;
      font-size: 12px;
      margin-bottom: 12px;
    }

    /* Info note */
    .info-note {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      background: #F0F4F2;
      border-radius: var(--radius-md);
      padding: 10px 12px;
      margin-top: 20px;
      font-size: 12px;
      color: var(--color-text-secondary);
      line-height: 1.5;

      svg { flex-shrink: 0; margin-top: 1px; color: var(--color-primary-light); }
    }

    /* Spinner */
    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .login-hero { display: none; }
      .login-form-col { width: 100%; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  error = '';

  constructor(private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos.';
      return;
    }
    this.error = '';
    this.isLoading = true;
    // Simular autenticación
    setTimeout(() => {
      this.isLoading = false;
      if (this.email === 'admin@fairgreen.com' && this.password === '1234') {
        this.router.navigate(['/dashboard']);
      } else {
        // Para demo, cualquier credencial funciona
        this.router.navigate(['/dashboard']);
      }
    }, 900);
  }
}
