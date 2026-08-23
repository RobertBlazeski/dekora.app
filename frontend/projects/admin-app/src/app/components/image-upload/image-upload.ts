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

    this.prepareForUpload(file).then((prepared) => {
      this.uploadsApi.uploadImage(prepared).subscribe({
        next: (res) => {
          this.urlChange.emit(res.url);
          this.uploading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.detail ?? 'Upload failed — try a smaller JPEG or PNG.');
          this.uploading.set(false);
        },
      });
    });
  }

  protected remove(): void {
    this.urlChange.emit(null);
  }

  // A phone camera photo is routinely 8-12MB at 4000+px — on a mobile upload connection that's
  // the whole multi-second wait the owner sees. Shrinking it in-browser first (matching the
  // server's own 1600px cap, so nothing is lost by doing this) turns that into a few hundred KB.
  // It also happens to fix a second bug for free: `imageOrientation: 'from-image'` makes the
  // browser bake in the EXIF rotation phones record for portrait shots before we ever draw to
  // the canvas, so the file leaving the browser is already right-side up — the server applies
  // the same EXIF-aware correction independently as a safety net for any upload that skips this.
  private async prepareForUpload(file: File): Promise<File> {
    const skipThresholdBytes = 400 * 1024;
    const maxDimension = 1600;
    if (file.size <= skipThresholdBytes || !file.type.startsWith('image/')) return file;

    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        return file;
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      if (!blob) return file;

      return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
    } catch {
      // Unsupported API or an unreadable file — upload the original; the server-side pass
      // still resizes and orientation-corrects it either way.
      return file;
    }
  }
}
