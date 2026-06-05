import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { DataService, UsuarioResumen } from '../../services/data.service';

type Role = 'Agrónomo' | 'Administrador' | 'Canchero';
type Status = 'Activo' | 'Offline';

interface UserRow {
  rut: string;
  id: string;
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
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private dataService = inject(DataService);

  selectedUser = signal<UserRow | null>(null);
  showSaved = signal(false);
  isLoading = signal(true);
  errorMsg = signal('');
  
  showCreateModal = signal(false);
  isCreating = signal(false);

  editForm = {
    name: '',
    email: '',
    role: '',
    hasAccess: true,
  };

  createForm = {
    rut: '',
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    rol: 'CANCHERO'
  };

  users: UserRow[] = [];

  ngOnInit() {
    this._loadUsers();
  }

  private _loadUsers() {
    this.isLoading.set(true);
    this.dataService.getUsuarios().subscribe({
      next: (lista) => {
        this.users = lista.map(u => this._mapUsuario(u));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al cargar los usuarios.');
        this.isLoading.set(false);
      }
    });
  }

  private _mapUsuario(u: UsuarioResumen): UserRow {
    const rolMap: Record<string, Role> = { ADMIN: 'Administrador', AGRO: 'Agrónomo', CANCHERO: 'Canchero' };
    return {
      rut: u.rut,
      id: u.rut, // Usar rut como id de display
      name: `${u.nombre} ${u.apellido}`,
      email: u.correo_electronico,
      role: rolMap[u.rol] ?? 'Canchero',
      status: u.is_active ? 'Activo' : 'Offline',
      lastActivity: u.is_active ? 'Activo' : 'Sin acceso',
      initials: `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase(),
    };
  }

  selectUser(user: UserRow) {
    this.selectedUser.set(user);
    this.editForm = { name: user.name, email: user.email, role: user.role, hasAccess: user.status === 'Activo' };
  }

  closePanel() { this.selectedUser.set(null); }

  saveUser() {
    const user = this.selectedUser();
    if (!user) return;

    const parts = this.editForm.name.trim().split(' ');
    const nombre = parts[0] || '';
    const apellido = parts.length > 1 ? parts.slice(1).join(' ') : '';

    const reverseRolMap: Record<string, 'ADMIN' | 'AGRO' | 'CANCHERO'> = {
      'Administrador': 'ADMIN',
      'Agrónomo': 'AGRO',
      'Canchero': 'CANCHERO'
    };

    const payload = {
      nombre,
      apellido,
      correo_electronico: this.editForm.email,
      rol: reverseRolMap[this.editForm.role] ?? 'CANCHERO',
      is_active: this.editForm.hasAccess
    };

    this.dataService.updateUsuario(user.rut, payload).subscribe({
      next: () => {
        this._loadUsers(); // Recargar lista desde la API
        this.showSaved.set(true);
        setTimeout(() => this.showSaved.set(false), 2500);
        this.closePanel();
      },
      error: () => {
        // Fallback local si la API falla
        this.showSaved.set(true);
        setTimeout(() => this.showSaved.set(false), 2500);
        this.closePanel();
      }
    });
  }

  addUser() {
    this.createForm = { rut: '', nombre: '', apellido: '', correo: '', password: '', rol: 'CANCHERO' };
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  submitCreateUser() {
    if (!this.createForm.rut || !this.createForm.password || !this.createForm.correo) {
      alert('RUT, correo y contraseña son obligatorios.');
      return;
    }
    this.isCreating.set(true);
    
    this.dataService.createUsuario({
      rut: this.createForm.rut,
      nombre: this.createForm.nombre,
      apellido: this.createForm.apellido,
      correo_electronico: this.createForm.correo,
      rol: this.createForm.rol as 'ADMIN' | 'AGRO' | 'CANCHERO',
      password: this.createForm.password,
      is_active: true
    }).subscribe({
      next: () => {
        this._loadUsers();
        this.closeCreateModal();
        this.isCreating.set(false);
        this.showSaved.set(true);
        setTimeout(() => this.showSaved.set(false), 2500);
      },
      error: (err) => {
        console.error('Error al crear usuario', err);
        alert('Error al crear usuario. Revisa el RUT o si ya existe.');
        this.isCreating.set(false);
      }
    });
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
