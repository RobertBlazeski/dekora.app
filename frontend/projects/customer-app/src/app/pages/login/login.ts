import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { describeAuthError } from '../../core/auth/auth-error.util';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-login',
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly translation = inject(TranslationService);

  protected readonly submitting = signal(false);
  protected readonly errorMessages = signal<string[]>([]);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessages.set([]);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/', this.translation.currentLocale(), 'profile']),
      error: (err) => {
        this.errorMessages.set(describeAuthError(err));
        this.submitting.set(false);
      },
    });
  }
}
