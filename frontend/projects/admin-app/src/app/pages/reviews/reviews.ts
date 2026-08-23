import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ReviewAdmin, ReviewStats } from '@dekora/shared';
import { ReviewsApi } from '../../core/api/reviews.api';

@Component({
  selector: 'app-reviews',
  imports: [DatePipe],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss',
})
export class Reviews {
  private readonly reviewsApi = inject(ReviewsApi);

  protected readonly reviews = signal<ReviewAdmin[]>([]);
  protected readonly stats = signal<ReviewStats | null>(null);
  protected readonly minRating = signal(0);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly filteredReviews = computed(() =>
    this.reviews().filter((r) => r.rating >= this.minRating()),
  );

  protected readonly maxBreakdownCount = computed(() =>
    Math.max(1, ...(this.stats()?.breakdown.map((b) => b.count) ?? [1])),
  );

  protected readonly roundedAverage = computed(() => Math.round(this.stats()?.averageRating ?? 0));

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.reviewsApi.getAll().subscribe((reviews) => this.reviews.set(reviews));
    this.reviewsApi.getStats().subscribe((stats) => this.stats.set(stats));
  }

  protected setMinRating(rating: number): void {
    this.minRating.set(rating);
  }

  protected delete(review: ReviewAdmin): void {
    if (!confirm(`Delete this review by ${review.reviewerName}? This can't be undone.`)) return;

    this.deletingId.set(review.id);
    this.reviewsApi.delete(review.id).subscribe(() => {
      this.deletingId.set(null);
      this.reload();
    });
  }
}
