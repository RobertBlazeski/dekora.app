import { Component, computed, inject, input, output, signal } from '@angular/core';
import { resolveAssetUrl } from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { UploadsApi } from '../../core/api/uploads.api';

// Small reusable upload control — used wherever the admin needs to attach a real photo (product
// images, homepage banner) instead of pasting a URL. Handles the upload call, shows a preview
// once one exists, and reports the resulting URL back to the parent via urlChange.
@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
})
export class ImageUpload {
  private readonly uploadsApi = inject(UploadsApi);

  readonly url = input<string | null>(null);
  readonly urlChange = output<string | null>();

  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly previewUrl = computed(() => resolveAssetUrl(environment.apiUrl, this.url()));

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.uploading.set(true);
    this.error.set(null);

    this.uploadsApi.uploadImage(file).subscribe({
      next: (res) => {
        this.urlChange.emit(res.url);
        this.uploading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Upload failed — try a smaller JPEG or PNG.');
        this.uploading.set(false);
      },
    });
  }

  protected remove(): void {
    this.urlChange.emit(null);
  }
}
