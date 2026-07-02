import { Component, ChangeDetectorRef } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit() {
    if (!this.email) {
      this.errorMessage = 'Por favor ingresa tu correo electrónico.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.auth.requestPasswordReset(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.detail || 'Si el correo electrónico está registrado, recibirás un enlace de recuperación pronto.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error solicitando recuperación:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'Ocurrió un error al procesar tu solicitud.';
        this.cdr.detectChanges();
      }
    });
  }
}
