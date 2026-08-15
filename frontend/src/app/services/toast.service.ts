import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  removing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 5000) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type, duration };
    
    this.toasts.update(t => [...t, toast]);
    
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string) {
    this.toasts.update(t => t.map(toast => toast.id === id ? { ...toast, removing: true } : toast));
    setTimeout(() => {
      this.toasts.update(t => t.filter(toast => toast.id !== id));
    }, 300); // 300ms matches the fadeOut CSS animation
  }
}
