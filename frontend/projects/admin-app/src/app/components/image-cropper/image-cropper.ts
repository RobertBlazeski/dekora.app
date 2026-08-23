import { Component, ElementRef, OnDestroy, OnInit, computed, input, output, signal, viewChild } from '@angular/core';

// The frame is always rendered at some on-screen CSS size, but the exported photo needs a
// fixed real resolution regardless of that — 1200px along the longer side is comfortably above
// anything the storefront displays an image at, while staying well under the server's own
// 1600px resize cap (see UploadsController), so nothing is re-processed a second time.
const OUTPUT_LONG_EDGE = 1200;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

// Lets the owner pan/zoom a photo within the exact aspect ratio it'll actually be displayed at
// (square for product photos, 4:3 for the homepage banner) before it's uploaded — rather than
// silently letting CSS `object-fit: cover` pick an arbitrary crop with no control over it.
//
// The image is positioned with an explicit top-left corner + a from-origin-0,0 scale, rather
// than a centering `translate(-50%,-50%)` transform — that keeps the on-screen preview and the
// final canvas render using the literal same top-left/width/height numbers (see
// `imageBox`/`confirm`), so what the owner sees is guaranteed to be what gets exported.
@Component({
  selector: 'app-image-cropper',
  imports: [],
  templateUrl: './image-cropper.html',
  styleUrl: './image-cropper.scss',
})
export class ImageCropper implements OnInit, OnDestroy {
  readonly file = input.required<File>();
  readonly aspectRatio = input<number>(1);

  readonly cropped = output<Blob>();
  readonly cancelled = output<void>();

  private readonly frameRef = viewChild.required<ElementRef<HTMLDivElement>>('frame');
  private readonly imgRef = viewChild.required<ElementRef<HTMLImageElement>>('img');

  protected imageUrl = '';
  protected readonly imageLoaded = signal(false);
  private naturalWidth = 0;
  private naturalHeight = 0;
  private frameWidth = 0;
  private frameHeight = 0;

  protected readonly zoom = signal(MIN_ZOOM);
  protected readonly offsetX = signal(0);
  protected readonly offsetY = signal(0);
  protected readonly minZoom = MIN_ZOOM;
  protected readonly maxZoom = MAX_ZOOM;

  private readonly baseScale = signal(1);
  protected readonly scale = computed(() => this.baseScale() * this.zoom());
  protected readonly displayedWidth = computed(() => this.naturalWidth * this.scale());
  protected readonly displayedHeight = computed(() => this.naturalHeight * this.scale());

  // The image's top-left corner within the frame, in on-screen frame-pixel space — the single
  // source of truth both the CSS preview and the canvas export are built from.
  protected readonly imageLeft = computed(() => this.frameWidth / 2 + this.offsetX() - this.displayedWidth() / 2);
  protected readonly imageTop = computed(() => this.frameHeight / 2 + this.offsetY() - this.displayedHeight() / 2);

  private dragging = false;
  private dragStartClientX = 0;
  private dragStartClientY = 0;
  private dragStartOffsetX = 0;
  private dragStartOffsetY = 0;

  ngOnInit(): void {
    this.imageUrl = URL.createObjectURL(this.file());
  }

  ngOnDestroy(): void {
    URL.revokeObjectURL(this.imageUrl);
  }

  protected onImageLoad(): void {
    const img = this.imgRef().nativeElement;
    this.naturalWidth = img.naturalWidth;
    this.naturalHeight = img.naturalHeight;
    this.measureFrame();
    // The scale at which the image exactly covers the frame with no gaps — this is the floor;
    // the zoom slider only ever multiplies further in from here.
    this.baseScale.set(Math.max(this.frameWidth / this.naturalWidth, this.frameHeight / this.naturalHeight));
    this.imageLoaded.set(true);
  }

  private measureFrame(): void {
    const rect = this.frameRef().nativeElement.getBoundingClientRect();
    this.frameWidth = rect.width;
    this.frameHeight = rect.height;
  }

  protected onZoomInput(value: string): void {
    this.zoom.set(Number(value));
    this.clampOffset();
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    this.zoom.set(Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom() + delta)));
    this.clampOffset();
  }

  protected onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    this.dragStartClientX = event.clientX;
    this.dragStartClientY = event.clientY;
    this.dragStartOffsetX = this.offsetX();
    this.dragStartOffsetY = this.offsetY();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.offsetX.set(this.dragStartOffsetX + (event.clientX - this.dragStartClientX));
    this.offsetY.set(this.dragStartOffsetY + (event.clientY - this.dragStartClientY));
    this.clampOffset();
  }

  protected onPointerUp(): void {
    this.dragging = false;
  }

  protected reset(): void {
    this.zoom.set(MIN_ZOOM);
    this.offsetX.set(0);
    this.offsetY.set(0);
  }

  // Keeps the image edges from ever pulling in past the frame's edges — the max pan distance on
  // each axis is exactly how much bigger than the frame the scaled image currently is.
  private clampOffset(): void {
    const maxX = Math.max(0, (this.displayedWidth() - this.frameWidth) / 2);
    const maxY = Math.max(0, (this.displayedHeight() - this.frameHeight) / 2);

    this.offsetX.set(Math.min(maxX, Math.max(-maxX, this.offsetX())));
    this.offsetY.set(Math.min(maxY, Math.max(-maxY, this.offsetY())));
  }

  protected confirm(): void {
    const aspect = this.aspectRatio();
    const outputWidth = aspect >= 1 ? OUTPUT_LONG_EDGE : Math.round(OUTPUT_LONG_EDGE * aspect);
    const outputHeight = aspect >= 1 ? Math.round(OUTPUT_LONG_EDGE / aspect) : OUTPUT_LONG_EDGE;
    const ratio = outputWidth / this.frameWidth;

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Same imageLeft/imageTop/displayedWidth/displayedHeight the preview is positioned with,
    // just uniformly scaled up from on-screen frame pixels to the output image's own pixels.
    ctx.drawImage(
      this.imgRef().nativeElement,
      0,
      0,
      this.naturalWidth,
      this.naturalHeight,
      this.imageLeft() * ratio,
      this.imageTop() * ratio,
      this.displayedWidth() * ratio,
      this.displayedHeight() * ratio,
    );

    canvas.toBlob(
      (blob) => {
        if (blob) this.cropped.emit(blob);
      },
      'image/jpeg',
      0.9,
    );
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
