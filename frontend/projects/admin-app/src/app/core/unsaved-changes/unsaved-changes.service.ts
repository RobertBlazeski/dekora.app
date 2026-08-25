import { Injectable } from '@angular/core';

// A page with an editable form registers a check here (a plain "is anything unsaved right now"
// function) while its form is open, and unregisters it when the form closes or the component is
// destroyed. AppComponent's single beforeunload listener asks this service, rather than each
// page needing its own window-level listener — closing/refreshing/navigating away from the tab
// is the single most common way admin work gets lost silently, and this catches it regardless of
// which page it happens on.
@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  private readonly checks = new Set<() => boolean>();

  register(check: () => boolean): () => void {
    this.checks.add(check);
    return () => this.checks.delete(check);
  }

  get hasUnsavedChanges(): boolean {
    for (const check of this.checks) {
      if (check()) return true;
    }
    return false;
  }
}
