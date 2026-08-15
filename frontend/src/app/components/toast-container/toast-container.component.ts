import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type" [class.toast-removing]="toast.removing" role="alert" aria-live="polite">
          <div style="display: flex; align-items: center; gap: 8px;">
            @if (toast.type === 'success') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            } @else if (toast.type === 'error') {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            }
            <span style="font-size: 14px; font-weight: 500;">{{ toast.message }}</span>
          </div>
          <button type="button" class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Cerrar notificación">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }
    .toast-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out forwards;
      min-width: 250px;
      max-width: 400px;
    }
    .toast-removing {
      animation: fadeOut 0.3s ease-in forwards;
    }
    .toast-success {
      border-left: 4px solid var(--color-primary, #10b981);
      color: var(--color-primary, #10b981);
    }
    .toast-error {
      border-left: 4px solid var(--color-error, #ef4444);
      color: var(--color-error, #ef4444);
    }
    .toast-info {
      border-left: 4px solid var(--color-accent, #3b82f6);
      color: var(--color-accent, #3b82f6);
    }
    .toast-success span, .toast-error span, .toast-info span {
      color: var(--color-text-primary, #1e293b);
    }
    .toast-close {
      background: none;
      border: none;
      color: var(--color-text-muted, #64748b);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    .toast-close:hover {
      background: var(--color-background-soft, #f1f5f9);
      color: var(--color-text-primary, #1e293b);
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
