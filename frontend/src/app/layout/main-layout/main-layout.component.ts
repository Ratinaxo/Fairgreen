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
      <app-sidebar />
      <div class="shell-main">
        <app-topbar />
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
      margin-left: 200px;
      min-width: 0;
      overflow: hidden;
    }
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      background: var(--color-bg);
    }

    @media (max-width: 1200px) {
      .shell-main { margin-left: 56px; }
    }

    @media (max-width: 1024px) {
      .shell-main { margin-left: 0; }
    }
  `]
})
export class MainLayoutComponent {}
