import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ContactInfoApi } from '../../../core/api/faq.api';
import { TranslationService } from '../../../i18n/translation.service';
import { LegalDoc, LegalSection, PRIVACY_CONTENT, REFUND_CONTENT, TERMS_CONTENT } from '../legal-content';

const DOCS: Record<string, Record<string, LegalDoc>> = {
  terms: TERMS_CONTENT,
  privacy: PRIVACY_CONTENT,
  refund: REFUND_CONTENT,
};

@Component({
  selector: 'app-legal-page',
  imports: [],
  templateUrl: './legal-page.html',
  styleUrl: './legal-page.scss',
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);
  private readonly contactInfoApi = inject(ContactInfoApi);
  protected readonly translation = inject(TranslationService);

  private readonly docKey = toSignal(this.route.data.pipe(map((d) => d['doc'] as string)), {
    initialValue: this.route.snapshot.data['doc'] as string,
  });

  // Owner-editable (see the admin FAQ & Contact page) — the static legal text below only ever
  // references these as {{email}}/{{phone}} tokens, substituted at render time, so the pages
  // stay static/prerenderable-in-spirit while never going stale against the real contact info.
  private readonly email = signal('hello@dekora.mk');
  private readonly phone = signal('');

  constructor() {
    this.contactInfoApi.get().subscribe((info) => {
      if (info.email) this.email.set(info.email);
      this.phone.set(info.phoneNumbers.join(' / '));
    });
  }

  protected readonly doc = computed<LegalDoc>(() => {
    const set = DOCS[this.docKey()] ?? TERMS_CONTENT;
    const raw = set[this.translation.currentLocale()] ?? set['en'];
    return {
      ...raw,
      sections: raw.sections.map((section): LegalSection => ({
        ...section,
        paragraphs: section.paragraphs.map((p) => this.resolveTokens(p)),
      })),
    };
  });

  private resolveTokens(text: string): string {
    return text.replaceAll('{{email}}', this.email()).replaceAll('{{phone}}', this.phone());
  }
}
