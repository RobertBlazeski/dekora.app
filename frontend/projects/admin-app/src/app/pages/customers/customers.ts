import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { CustomerListItem } from '@dekora/shared';
import { CustomersApi } from '../../core/api/customers.api';

@Component({
  selector: 'app-customers',
  imports: [DatePipe],
  templateUrl: './customers.html',
  styleUrl: './customers.scss',
})
export class Customers {
  private readonly customersApi = inject(CustomersApi);

  protected readonly search = signal('');
  protected readonly customers = signal<CustomerListItem[]>([]);

  private searchDebounce: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const search = this.search();
      this.customersApi.getAll(search || undefined).subscribe((customers) => this.customers.set(customers));
    });
  }

  protected onSearchInput(value: string): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.search.set(value), 300);
  }
}
