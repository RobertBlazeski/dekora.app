import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistToastService } from '../../core/wishlist/wishlist-toast.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-wishlist-toast',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './wishlist-toast.html',
  styleUrl: './wishlist-toast.scss',
})
export class WishlistToast {
  protected readonly toast = inject(WishlistToastService);
  protected readonly translation = inject(TranslationService);
}
