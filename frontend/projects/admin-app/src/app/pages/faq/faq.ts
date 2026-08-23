import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactInfo, FaqEntry, UpsertFaqEntryRequest } from '@dekora/shared';
import { ContactInfoApi, FaqApi } from '../../core/api/faq.api';

interface FaqFormState {
  id: string | null;
  question: string;
  questionEn: string;
  questionSq: string;
  answer: string;
  answerEn: string;
  answerSq: string;
}

function emptyForm(): FaqFormState {
  return { id: null, question: '', questionEn: '', questionSq: '', answer: '', answerEn: '', answerSq: '' };
}

@Component({
  selector: 'app-faq',
  imports: [FormsModule],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class Faq {
  private readonly faqApi = inject(FaqApi);
  private readonly contactInfoApi = inject(ContactInfoApi);

  protected readonly entries = signal<FaqEntry[]>([]);
  protected readonly formOpen = signal(false);
  protected readonly form = signal<FaqFormState>(emptyForm());
  protected readonly showTranslations = signal(false);
  protected readonly saving = signal(false);

  protected readonly contact = signal<ContactInfo>({ instagramHandle: '', email: '', location: '', phoneNumbers: [] });
  protected readonly contactSaving = signal(false);
  protected readonly contactSaved = signal(false);

  constructor() {
    this.reload();
    this.contactInfoApi.get().subscribe((info) => this.contact.set(info));
  }

  private reload(): void {
    this.faqApi.getAll().subscribe((entries) => this.entries.set(entries));
  }

  protected openCreate(): void {
    this.form.set({ ...emptyForm(), question: '', answer: '' });
    this.showTranslations.set(false);
    this.formOpen.set(true);
  }

  protected openEdit(entry: FaqEntry): void {
    this.form.set({
      id: entry.id,
      question: entry.question,
      questionEn: entry.questionEn ?? '',
      questionSq: entry.questionSq ?? '',
      answer: entry.answer,
      answerEn: entry.answerEn ?? '',
      answerSq: entry.answerSq ?? '',
    });
    this.showTranslations.set(false);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected toggleTranslations(): void {
    this.showTranslations.update((v) => !v);
  }

  protected updateField<K extends keyof FaqFormState>(field: K, value: FaqFormState[K]): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  protected save(): void {
    const f = this.form();
    if (!f.question.trim() || !f.answer.trim()) return;

    const request: UpsertFaqEntryRequest = {
      question: f.question,
      questionEn: f.questionEn.trim() || null,
      questionSq: f.questionSq.trim() || null,
      answer: f.answer,
      answerEn: f.answerEn.trim() || null,
      answerSq: f.answerSq.trim() || null,
      sortOrder: f.id ? (this.entries().find((e) => e.id === f.id)?.sortOrder ?? 0) : this.entries().length,
    };

    this.saving.set(true);
    const save$ = f.id ? this.faqApi.update(f.id, request) : this.faqApi.create(request);
    save$.subscribe(() => {
      this.saving.set(false);
      this.formOpen.set(false);
      this.reload();
    });
  }

  protected remove(entry: FaqEntry): void {
    if (!confirm(`Delete "${entry.question}"?`)) return;
    this.faqApi.delete(entry.id).subscribe(() => this.reload());
  }

  protected moveUp(index: number): void {
    if (index === 0) return;
    this.reorder(index, index - 1);
  }

  protected moveDown(index: number): void {
    if (index === this.entries().length - 1) return;
    this.reorder(index, index + 1);
  }

  private reorder(fromIndex: number, toIndex: number): void {
    const list = [...this.entries()];
    [list[fromIndex], list[toIndex]] = [list[toIndex], list[fromIndex]];
    this.entries.set(list);

    list.forEach((entry, i) => {
      if (entry.sortOrder === i) return;
      this.faqApi
        .update(entry.id, {
          question: entry.question,
          questionEn: entry.questionEn,
          questionSq: entry.questionSq,
          answer: entry.answer,
          answerEn: entry.answerEn,
          answerSq: entry.answerSq,
          sortOrder: i,
        })
        .subscribe();
    });
  }

  protected updateContactField<K extends keyof ContactInfo>(field: K, value: ContactInfo[K]): void {
    this.contact.update((c) => ({ ...c, [field]: value }));
  }

  protected addPhoneNumber(): void {
    this.contact.update((c) => ({ ...c, phoneNumbers: [...c.phoneNumbers, ''] }));
  }

  protected updatePhoneNumber(index: number, value: string): void {
    this.contact.update((c) => ({
      ...c,
      phoneNumbers: c.phoneNumbers.map((p, i) => (i === index ? value : p)),
    }));
  }

  protected removePhoneNumber(index: number): void {
    this.contact.update((c) => ({ ...c, phoneNumbers: c.phoneNumbers.filter((_, i) => i !== index) }));
  }

  protected saveContact(): void {
    this.contactSaving.set(true);
    this.contactSaved.set(false);
    const request = { ...this.contact(), phoneNumbers: this.contact().phoneNumbers.map((p) => p.trim()).filter(Boolean) };
    this.contactInfoApi.update(request).subscribe((info) => {
      this.contact.set(info);
      this.contactSaving.set(false);
      this.contactSaved.set(true);
      setTimeout(() => this.contactSaved.set(false), 2000);
    });
  }
}
