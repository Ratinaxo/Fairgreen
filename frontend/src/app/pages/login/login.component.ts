import { Component, ChangeDetectorRef } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  error = '';

  constructor(
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos.';
      return;
    }
    this.error = '';
    this.isLoading = true;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        // Cargar perfil del usuario y navegar al dashboard
        this.auth.loadMe().subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
            this.cdr.detectChanges();
          },
          error: () => {
            this.router.navigate(['/dashboard']);
            this.cdr.detectChanges();
          },
        });
      },
      error: (err: any) => {
        console.error('Error capturado en LoginComponent:', err);
        this.isLoading = false;
        this.error = err.message || 'Error al iniciar sesión.';
        this.cdr.detectChanges();
      },
    });
  }
}
