import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

type Role = 'Agrónomo' | 'Administrador' | 'Canchero';
type Status = 'Activo' | 'Offline';

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: Status;
  lastActivity: string;
  initials: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="users-page">
      <!-- Header -->
      <div class="page-header d-flex align-center justify-between">
        <h1 style="font-family:var(--font-display);font-size:24px;">Gestión de Usuarios</h1>
        <button class="btn-primary" id="add-user-btn" (click)="addUser()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
          AÑADIR NUEVO USUARIO
        </button>
      </div>

      <div class="users-layout">
        <!-- Users table -->
        <div class="card users-table-card" style="overflow:hidden;flex:1;">
          <div style="overflow-x:auto;">
            <table class="data-table" aria-label="Lista de usuarios">
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Rol</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Última Actividad</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users; track user.id) {
                  <tr
                    [class.selected-row]="selectedUser()?.id === user.id"
                    (click)="selectUser(user)"
                    style="cursor:pointer;"
                    [attr.aria-selected]="selectedUser()?.id === user.id"
                    [id]="'user-row-' + user.id"
                  >
                    <td>
                      <div style="display:flex;align-items:center;gap:10px;">
                        <div
                          class="avatar avatar-sm"
                          [ngClass]="avatarClass(user.role)"
                          aria-hidden="true"
                        >{{ user.initials }}</div>
                        <div>
                          <div style="font-size:13px;font-weight:500;color:var(--color-text-primary);">{{ user.name }}</div>
                          <div style="font-size:12px;color:var(--color-text-muted);">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="role-badge" [ngClass]="roleClass(user.role)">{{ user.role }}</span>
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:6px;">
                        <span class="status-dot" [ngClass]="user.status === 'Activo' ? 'dot-activo' : 'dot-offline'" aria-hidden="true"></span>
                        <span style="font-size:13px;color:var(--color-text-secondary);">{{ user.status }}</span>
                      </div>
                    </td>
                    <td style="font-size:13px;color:var(--color-text-muted);">{{ user.lastActivity }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Edit panel (slide in) -->
        <aside
          class="edit-panel"
          [class.edit-panel-open]="!!selectedUser()"
          aria-label="Panel de edición de usuario"
          [attr.aria-hidden]="!selectedUser()"
        >
          @if (selectedUser(); as user) {
            <div class="edit-panel-header">
              <span style="font-size:14px;font-weight:600;color:var(--color-text-primary);">Editar Usuario</span>
              <button
                class="close-btn"
                (click)="closePanel()"
                id="close-edit-panel-btn"
                aria-label="Cerrar panel de edición"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>

            <!-- Avatar grande -->
            <div style="text-align:center;margin-bottom:16px;">
              <div style="position:relative;display:inline-block;">
                <div
                  class="avatar avatar-lg"
                  [ngClass]="avatarClassStr(editForm.role)"
                  aria-hidden="true"
                  style="margin:0 auto;"
                >{{ user.initials }}</div>
                <button
                  style="position:absolute;bottom:0;right:0;width:24px;height:24px;background:var(--color-primary);border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;"
                  aria-label="Cambiar foto de usuario"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
              </div>
              <div style="margin-top:10px;font-size:15px;font-weight:600;color:var(--color-text-primary);">{{ user.name }}</div>
              <div style="font-size:12px;color:var(--color-text-muted);">{{ user.email }}</div>
            </div>

            <!-- Form fields -->
            <div class="edit-form">
              <div class="form-group">
                <label for="edit-name" class="form-label">Nombre Completo</label>
                <input id="edit-name" type="text" class="form-control" [(ngModel)]="editForm.name" name="edit-name" aria-required="true"/>
              </div>
              <div class="form-group">
                <label for="edit-email" class="form-label">Correo Electrónico</label>
                <input id="edit-email" type="email" class="form-control" [(ngModel)]="editForm.email" name="edit-email" aria-required="true"/>
              </div>
              <div class="form-group">
                <label for="edit-role" class="form-label">Rol de la cuenta</label>
                <div class="select-wrapper">
                  <select id="edit-role" class="form-control" [(ngModel)]="editForm.role" name="edit-role" aria-required="true">
                    <option>Administrador</option>
                    <option>Agrónomo</option>
                    <option>Canchero</option>
                  </select>
                </div>
              </div>

              <!-- Toggle acceso -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <div>
                  <div style="font-size:13px;font-weight:500;color:var(--color-text-primary);">Acceso al sistema</div>
                  <div style="font-size:11px;color:var(--color-text-muted);">Permitir que el usuario inicie sesión</div>
                </div>
                <label class="toggle" [attr.aria-label]="'Acceso al sistema de ' + editForm.name">
                  <input type="checkbox" [(ngModel)]="editForm.hasAccess" name="edit-access"/>
                  <div class="toggle-track"></div>
                </label>
              </div>

              <button class="btn-primary w-full" id="save-user-btn" (click)="saveUser()" style="justify-content:center;margin-bottom:10px;">
                GUARDAR CAMBIOS
              </button>
              <button class="btn-text w-full" (click)="closePanel()" style="justify-content:center;">
                CANCELAR
              </button>
            </div>
          }
        </aside>
      </div>
    </div>

    <!-- Success toast -->
    @if (showSaved()) {
      <div class="toast-success" role="alert" aria-live="polite">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Cambios guardados exitosamente
      </div>
    }
  `,
  styles: [`
    .users-page { animation: fadeSlideUp 250ms ease; }

    .users-layout {
      display: flex;
      gap: 0;
      position: relative;
      overflow: hidden;
      border-radius: var(--radius-lg);
    }

    .users-table-card { border-radius: var(--radius-lg) 0 0 var(--radius-lg); }

    .selected-row {
      background: var(--color-surface-alt) !important;
      td { border-left: 2px solid var(--color-primary); }
    }

    /* Edit panel */
    .edit-panel {
      width: 0;
      flex-shrink: 0;
      background: var(--color-surface);
      border-left: 1px solid var(--color-border);
      overflow: hidden;
      transition: width var(--transition-normal);
    }

    .edit-panel-open { width: 300px; }

    .edit-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border);
    }

    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      transition: color var(--transition-fast), background var(--transition-fast);
      &:hover { color: var(--color-text-primary); background: var(--color-surface-alt); }
    }

    .edit-form {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group { display: flex; flex-direction: column; }

    .form-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-secondary);
      margin-bottom: 5px;
    }

    .w-full {
      width: 100%;
      justify-content: center;
      display: flex;
      align-items: center;
    }

    /* Toast */
    .toast-success {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--color-primary);
      color: white;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: var(--shadow-modal);
      animation: fadeSlideUp 200ms ease;
      z-index: 200;
    }
  `]
})
export class UsersComponent {
  selectedUser = signal<User | null>(null);
  showSaved = signal(false);

  editForm = {
    name: '',
    email: '',
    role: '',
    hasAccess: true,
  };

  users: User[] = [
    { id: 1, name: 'Carlos Mendoza', email: 'c.mendoza@fairgreen.com', role: 'Agrónomo', status: 'Activo', lastActivity: 'Ahora', initials: 'CM' },
    { id: 2, name: 'Ana Rodríguez', email: 'a.rodriguez@fairgreen.com', role: 'Administrador', status: 'Activo', lastActivity: 'Hace 3 horas', initials: 'AR' },
    { id: 3, name: 'Luis Torres', email: 'l.torres@fairgreen.com', role: 'Canchero', status: 'Activo', lastActivity: 'Hace 1 hora', initials: 'LT' },
    { id: 4, name: 'María García', email: 'm.garcia@fairgreen.com', role: 'Agrónomo', status: 'Offline', lastActivity: 'Hace 2 días', initials: 'MG' },
    { id: 5, name: 'Pedro Silva', email: 'p.silva@fairgreen.com', role: 'Canchero', status: 'Activo', lastActivity: 'Hace 30 min', initials: 'PS' },
    { id: 6, name: 'Valentina Cruz', email: 'v.cruz@fairgreen.com', role: 'Administrador', status: 'Offline', lastActivity: 'Hace 5 días', initials: 'VC' },
    { id: 7, name: 'Sebastián López', email: 's.lopez@fairgreen.com', role: 'Agrónomo', status: 'Activo', lastActivity: 'Hace 2 horas', initials: 'SL' },
    { id: 8, name: 'Camila Fernández', email: 'c.fernandez@fairgreen.com', role: 'Canchero', status: 'Offline', lastActivity: 'Hace 1 semana', initials: 'CF' },
  ];

  selectUser(user: User) {
    this.selectedUser.set(user);
    this.editForm = { name: user.name, email: user.email, role: user.role, hasAccess: user.status === 'Activo' };
  }

  closePanel() { this.selectedUser.set(null); }

  saveUser() {
    const user = this.selectedUser();
    if (!user) return;
    const idx = this.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.users[idx] = {
        ...this.users[idx],
        name: this.editForm.name,
        email: this.editForm.email,
        role: this.editForm.role as Role,
        status: this.editForm.hasAccess ? 'Activo' : 'Offline',
        initials: this.editForm.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase(),
      };
    }
    this.showSaved.set(true);
    setTimeout(() => this.showSaved.set(false), 2500);
    this.closePanel();
  }

  addUser() {
    const newUser: User = {
      id: this.users.length + 1,
      name: 'Nuevo Usuario',
      email: 'nuevo@fairgreen.com',
      role: 'Canchero',
      status: 'Activo',
      lastActivity: 'Ahora',
      initials: 'NU',
    };
    this.users = [...this.users, newUser];
    this.selectUser(newUser);
  }

  avatarClassStr(role: string): string {
    return this.avatarClass(role as Role);
  }

  avatarClass(role: Role): string {
    const map: Record<Role, string> = {
      'Agrónomo': 'avatar-agronomo',
      'Administrador': 'avatar-administrador',
      'Canchero': 'avatar-canchero',
    };
    return map[role] ?? 'avatar-agronomo';
  }

  roleClass(role: Role): string {
    const map: Record<Role, string> = {
      'Agrónomo': 'role-agronomo',
      'Administrador': 'role-administrador',
      'Canchero': 'role-canchero',
    };
    return map[role] ?? '';
  }
}
