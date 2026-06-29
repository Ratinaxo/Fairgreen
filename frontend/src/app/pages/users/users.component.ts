import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { DataService, UsuarioResumen } from '../../services/data.service';

type Role = 'Agrónomo' | 'Administrador' | 'Canchero';
type Status = 'Activo' | 'Suspendido';

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
export class UsersComponent implements OnInit, OnDestroy {
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

  users = signal<UserRow[]>([]);
  private refreshInterval: any;

  ngOnInit() {
    this._loadUsers();
    
    // Auto-refrescar la lista silenciosamente cada 60 segundos
    // para mantener actualizados los estados de "En línea"
    this.refreshInterval = setInterval(() => {
      this._loadUsers(true);
    }, 60000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private _loadUsers(silent = false) {
    if (!silent) this.isLoading.set(true);
    this.dataService.getUsuarios().subscribe({
      next: (lista) => {
        this.users.set(lista.map(u => this._mapUsuario(u)));
        if (!silent) this.isLoading.set(false);
      },
      error: () => {
        if (!silent) this.errorMsg.set('Error al cargar los usuarios.');
        if (!silent) this.isLoading.set(false);
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
      status: u.is_active ? 'Activo' : 'Suspendido',
      lastActivity: u.is_online ? 'En línea' : this._formatLastLogin(u.last_login),
      initials: `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase(),
    };
  }

  private _formatLastLogin(lastLogin: string | null): string {
    if (!lastLogin) return 'Nunca';
    const date = new Date(lastLogin);
    if (isNaN(date.getTime())) return 'Nunca';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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
        alert('Error al guardar el usuario. Verifica los datos e inténtalo de nuevo.');
      }
    });
  }

  deleteUser() {
    const user = this.selectedUser();
    if (!user) return;

    if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.name}?`)) {
      this.dataService.deleteUsuario(user.rut).subscribe({
        next: () => {
          this._loadUsers();
          this.closePanel();
          this.showSaved.set(true);
          setTimeout(() => this.showSaved.set(false), 2500);
        },
        error: (err) => {
          console.error('Error al eliminar usuario', err);
          alert('Error al eliminar usuario. Puede que tenga datos asociados.');
        }
      });
    }
  }

  addUser() {
    this.createForm = { rut: '', nombre: '', apellido: '', correo: '', password: '', rol: 'CANCHERO' };
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  onRutInput(event: Event) {
    const input = event.target as HTMLInputElement;
    // Remueve cualquier carácter que no sea un número o la letra k/K
    let cleaned = input.value.replace(/[^0-9kK]/g, '').toUpperCase();
    
    // No permitir más de 9 caracteres limpios
    if (cleaned.length > 9) {
      cleaned = cleaned.substring(0, 9);
    }
    
    this.createForm.rut = cleaned;
    input.value = cleaned;
  }

  formatRut() {
    let rut = this.createForm.rut.replace(/[^0-9K]/g, '');
    if (rut.length <= 1) return;
    
    const dv = rut.slice(-1);
    let numbers = rut.slice(0, -1);
    numbers = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    this.createForm.rut = `${numbers}-${dv}`;
  }

  submitCreateUser() {
    if (!this.createForm.rut || !this.createForm.password || !this.createForm.correo || !this.createForm.nombre || !this.createForm.apellido) {
      alert('Todos los campos con asterisco (*) son obligatorios.');
      return;
    }
    
    const cleanRut = this.createForm.rut.replace(/[^0-9K]/g, '');
    if (!/^[0-9]{8}[0-9K]$/.test(cleanRut)) {
      alert('El RUT debe tener exactamente 9 caracteres (8 números seguidos de un número o letra K).');
      return;
    }
    this.isCreating.set(true);
    
    this.dataService.createUsuario({
      rut: cleanRut,
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
        const msg = err.error ? JSON.stringify(err.error) : 'Error al crear usuario.';
        alert(`Error: ${msg}\nRevisa que el RUT y correo no existan ya en el sistema.`);
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
