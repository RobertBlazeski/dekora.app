import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OrderNotifications } from '../../core/orders/order-notifications.service';
import { NAV_LINKS } from '../nav-links';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected readonly auth = inject(AuthService);
  protected readonly notifications = inject(OrderNotifications);
  private readonly router = inject(Router);

  protected signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  protected readonly navLinks = NAV_LINKS;
}
