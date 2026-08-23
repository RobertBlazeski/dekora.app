import { Component, computed, inject, input, output, signal } from '@angular/core';
import { resolveAssetUrl } from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { UploadsApi } from '../../core/api/uploads.api';
import { ImageCropper } from '../image-cropper/image-cropper';

// Small reusable upload control — used wherever the admin needs to attach a real photo (product
// images, homepage banner) instead of pasting a URL. A picked file always goes through the
// cropper first (matching the aspect ratio this photo is actually displayed at) before it's
// uploaded — that also replaces what used to be a separate client-side resize/compress step,
// since the cropper's canvas export already produces a properly sized, correctly oriented JPEG.
@Component({
  selector: 'app-image-upload',
  imports: [ImageCropper],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
})
export class ImageUpload {
  private readonly uploadsApi = inject(UploadsApi);

  readonly url = input<string | null>(null);
  readonly urlChange = output<string | null>();
  // 1 (square) matches how product photos are displayed everywhere on the storefront; the
  // homepage banner passes its own 4:3.
  readonly aspectRatio = input<number>(1);

  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly pendingFile = signal<File | null>(null);

  protected readonly previewUrl = computed(() => resolveAssetUrl(environment.apiUrl, this.url()));

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.error.set(null);
    this.pendingFile.set(file);
  }

  protected onCropCancelled(): void {
    this.pendingFile.set(null);
  }

  protected onCropped(blob: Blob): void {
    this.pendingFile.set(null);
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

    this.uploading.set(true);
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
