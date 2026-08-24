import { Component, inject, input, output, signal } from '@angular/core';
import { TranslateApi } from '../../core/api/translate.api';

// Dropped next to any English/Albanian field in the admin dashboard — drafts a translation from
// the Macedonian text via Google Translate for the owner to review, rather than making them type
// every name/description/extra three times. Never applies the result automatically; the parent
// page decides where `translated` lands, and the owner can still edit it before saving.
@Component({
  selector: 'app-translate-button',
  imports: [],
  templateUrl: './translate-button.html',
  styleUrl: './translate-button.scss',
})
export class TranslateButton {
  private readonly translateApi = inject(TranslateApi);

  readonly sourceText = input.required<string>();
  readonly targetLanguage = input.required<'en' | 'sq'>();
  readonly translated = output<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected translate(): void {
    const text = this.sourceText().trim();
    if (!text) return;

    this.loading.set(true);
    this.error.set(null);
    this.translateApi.translate(text, this.targetLanguage()).subscribe({
      next: (translated) => {
        this.translated.emit(translated);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Translation failed.');
        this.loading.set(false);
      },
    });
  }
}
