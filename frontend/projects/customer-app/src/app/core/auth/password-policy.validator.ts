import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Mirrors the ASP.NET Identity password policy set explicitly in Program.cs
// (RequiredLength=8, RequireDigit=true, RequireLowercase=true, RequireUppercase=false,
// RequireNonAlphanumeric=false) — keep the two in sync if that policy ever changes, so the
// client never rejects (or accepts) something the server disagrees with.
export interface PasswordPolicyErrors {
  tooShort?: true;
  missingLetter?: true;
  missingDigit?: true;
}

export function passwordPolicyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    if (!value) return null; // let Validators.required own the empty case

    const errors: PasswordPolicyErrors = {};
    if (value.length < 8) errors.tooShort = true;
    if (!/[a-zA-Z]/.test(value)) errors.missingLetter = true;
    if (!/[0-9]/.test(value)) errors.missingDigit = true;

    return Object.keys(errors).length ? errors : null;
  };
}

export function passwordRuleStatus(value: string | null | undefined): { length: boolean; letter: boolean; digit: boolean } {
  const v = value ?? '';
  return {
    length: v.length >= 8,
    letter: /[a-zA-Z]/.test(v),
    digit: /[0-9]/.test(v),
  };
}
