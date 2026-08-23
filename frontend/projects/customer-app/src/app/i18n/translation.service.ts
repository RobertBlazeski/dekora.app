import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { DEFAULT_LOCALE, Locale } from './locale';
import en from './translations/en.json';
import mk from './translations/mk.json';
import sq from './translations/sq.json';

type Dictionary = Record<string, unknown>;

const DICTIONARIES: Record<Locale, Dictionary> = { mk, en, sq };

// Translates static UI chrome (nav, headings, buttons) only. Product Name/Description come
// straight from the API untouched — the owner writes them once, in one language, and they
// display the same regardless of the selected UI language.
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly document = inject(DOCUMENT);
  private readonly locale = signal<Locale>(DEFAULT_LOCALE);

  readonly currentLocale = this.locale.asReadonly();

  constructor() {
    // Runs during SSR too — DOCUMENT is the server's virtual document there, so the
    // rendered HTML already carries the correct lang attribute for crawlers.
    effect(() => {
      this.document.documentElement.lang = this.locale();
    });
  }

  setLocale(locale: Locale): void {
    this.locale.set(locale);
  }

  translate(key: string, params?: Record<string, string | number>): string {
    const value =
      this.lookup(DICTIONARIES[this.locale()], key) ?? this.lookup(DICTIONARIES[DEFAULT_LOCALE], key);

    if (typeof value !== 'string') return key;
    if (!params) return value;

    return Object.entries(params).reduce(
      (result, [paramKey, paramValue]) => result.replaceAll(`{{${paramKey}}}`, String(paramValue)),
      value,
    );
  }

  private lookup(dictionary: Dictionary, key: string): unknown {
    return key.split('.').reduce<unknown>((node, segment) => {
      if (node && typeof node === 'object' && segment in (node as Dictionary)) {
        return (node as Dictionary)[segment];
      }
      return undefined;
    }, dictionary);
  }
}
