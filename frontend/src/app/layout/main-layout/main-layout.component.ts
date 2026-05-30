import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell">
      <app-sidebar #sidebar />
      <div class="shell-main">
        <app-topbar (toggleSidebarEvent)="sidebar.isOpen.set(!sidebar.isOpen())" />
        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .shell-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: 220px;
      min-width: 0;
      overflow: hidden;
      transition: margin-left 280ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      background: var(--color-bg);
    }

    @media (max-width: 1199px) {
      .shell-main { margin-left: 60px; }
    }

    @media (max-width: 1023px) {
      .shell-main { margin-left: 0; }
    }
  `]
})
export class MainLayoutComponent {}
