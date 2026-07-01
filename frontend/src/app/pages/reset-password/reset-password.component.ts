import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  uidb64 = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.uidb64 = params['uid'] || '';
      this.token = params['token'] || '';
      if (!this.uidb64 || !this.token) {
        this.errorMessage = 'El enlace de recuperación es inválido o está incompleto.';
      }
    });
  }

  onSubmit() {
    if (!this.uidb64 || !this.token) {
      this.errorMessage = 'Parámetros de restablecimiento faltantes.';
      return;
    }

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Por favor completa todos los campos.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;

    this.auth.confirmPasswordReset(this.uidb64, this.token, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.detail || 'Tu contraseña ha sido cambiada con éxito.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error restableciendo contraseña:', err);
        this.isLoading = false;
        this.errorMessage = err.error?.detail || 'El enlace de recuperación no es válido o ha expirado.';
        this.cdr.detectChanges();
      }
    });
  }
}
