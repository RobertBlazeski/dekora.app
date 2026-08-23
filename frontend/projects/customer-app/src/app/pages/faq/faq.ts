import { Component, computed, inject, signal } from '@angular/core';
import { ContactInfo, FaqEntry, resolveLocalizedText } from '@dekora/shared';
import { ContactInfoApi, FaqApi } from '../../core/api/faq.api';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-faq',
  imports: [TranslatePipe],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class Faq {
  private readonly faqApi = inject(FaqApi);
  private readonly contactInfoApi = inject(ContactInfoApi);
  protected readonly translation = inject(TranslationService);

  protected readonly entries = signal<FaqEntry[]>([]);
  protected readonly contact = signal<ContactInfo | null>(null);
  protected readonly openId = signal<string | null>(null);

  protected readonly resolvedEntries = computed(() => {
    const locale = this.translation.currentLocale();
    return this.entries().map((e) => ({
      id: e.id,
      question: resolveLocalizedText(locale, e.question, e.questionEn, e.questionSq),
      answer: resolveLocalizedText(locale, e.answer, e.answerEn, e.answerSq),
    }));
  });

  constructor() {
    this.faqApi.getAll().subscribe((entries) => this.entries.set(entries));
    this.contactInfoApi.get().subscribe((info) => this.contact.set(info));
  }

  protected toggle(id: string): void {
    this.openId.set(this.openId() === id ? null : id);
  }
}
