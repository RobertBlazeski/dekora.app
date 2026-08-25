import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './layout/sidebar/sidebar';
import { Topbar } from './layout/topbar/topbar';
import { OrderToastStack } from './components/order-toast-stack/order-toast-stack';
import { AuthService } from './core/auth/auth.service';
import { UnsavedChangesService } from './core/unsaved-changes/unsaved-changes.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, Topbar, OrderToastStack],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly unsavedChanges = inject(UnsavedChangesService);

  // Closing the tab, refreshing, or typing a new URL are all ways to silently lose an open edit
  // — this is the browser's own "are you sure" prompt for exactly that, and it only fires when
  // some page has actually registered unsaved changes (see UnsavedChangesService).
  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.unsavedChanges.hasUnsavedChanges) return;
    event.preventDefault();
    event.returnValue = '';
  }
}
