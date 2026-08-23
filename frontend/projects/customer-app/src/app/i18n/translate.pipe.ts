import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

// Impure: must re-evaluate whenever the active locale changes, not just when `key` changes.
@Pipe({ name: 'translate', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.translation.translate(key, params);
  }
}
