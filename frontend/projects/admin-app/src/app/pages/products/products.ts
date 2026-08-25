import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Category,
  ProductCategory,
  ProductListItem,
  SavedColor,
  UpsertProductColorGroupRequest,
  UpsertProductColorRequest,
  UpsertProductExtraRequest,
  UpsertProductImageRequest,
  UpsertProductRequest,
  UpsertProductSizeRequest,
  resolveAssetUrl,
} from '@dekora/shared';
import { environment } from '../../../environments/environment';
import { ImageUpload } from '../../components/image-upload/image-upload';
import { TranslateButton } from '../../components/translate-button/translate-button';
import { CategoriesApi } from '../../core/api/categories.api';
import { ProductsApi } from '../../core/api/products.api';
import { SavedColorsApi } from '../../core/api/saved-colors.api';
import { UnsavedChangesService } from '../../core/unsaved-changes/unsaved-changes.service';

interface CategoryDraft {
  name: string;
  nameEn: string | null;
  nameSq: string | null;
  isProductType: boolean;
}

interface ProductFormState {
  id: string | null;
  name: string;
  nameEn: string;
  nameSq: string;
  description: string;
  descriptionEn: string;
  descriptionSq: string;
  basePrice: number;
  discountedPrice: number | null;
  categories: ProductCategory[];
  showcaseCategories: string[];
  tags: string;
  soldOut: boolean;
  sizesEnabled: boolean;
  customSizeEnabled: boolean;
  customSizeUnitPrice: number | null;
  customSizeUnitLabel: string;
  customSizeBaseFee: number | null;
  extrasEnabled: boolean;
  customTextEnabled: boolean;
  isTrending: boolean;
  trendingOrder: number | null;
  isFeatured: boolean;
  images: UpsertProductImageRequest[];
  sizes: UpsertProductSizeRequest[];
  colorGroups: UpsertProductColorGroupRequest[];
  extras: UpsertProductExtraRequest[];
}

function emptyForm(): ProductFormState {
  return {
    id: null,
    name: '',
    nameEn: '',
    nameSq: '',
    description: '',
    descriptionEn: '',
    descriptionSq: '',
    basePrice: 0,
    discountedPrice: null,
    categories: [],
    showcaseCategories: [],
    tags: '',
    soldOut: false,
    sizesEnabled: false,
    customSizeEnabled: false,
    customSizeUnitPrice: null,
    customSizeUnitLabel: '',
    customSizeBaseFee: null,
    extrasEnabled: false,
    customTextEnabled: false,
    isTrending: false,
    trendingOrder: null,
    isFeatured: false,
    images: [],
    sizes: [],
    colorGroups: [],
    extras: [],
  };
}

@Component({
  selector: 'app-products',
  imports: [FormsModule, ImageUpload, TranslateButton],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  private readonly productsApi = inject(ProductsApi);
  private readonly savedColorsApi = inject(SavedColorsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly unsavedChanges = inject(UnsavedChangesService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly allCategories = signal<Category[]>([]);
  protected readonly newCategoryName = signal('');
  protected readonly newCategoryNameEn = signal<string | null>(null);
  protected readonly newCategoryNameSq = signal<string | null>(null);
  protected readonly newCategoryIsProductType = signal(false);
  protected readonly manageCategoriesOpen = signal(false);
  protected readonly editingCategoryId = signal<string | null>(null);
  protected readonly categoryDraft = signal<CategoryDraft | null>(null);
  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly form = signal<ProductFormState>(emptyForm());
  protected readonly showTranslations = signal(false);
  protected readonly savedColors = signal<SavedColor[]>([]);

  // Splits the picker to match how the storefront itself groups categories (see the homepage's
  // "shop by type" vs "shop by occasion") — without this split, "which chip actually puts this
  // product in the Bouquets/Balloons section" was genuinely not discoverable, since it looked
  // identical to every occasion chip next to it.
  protected readonly occasionCategoryOptions = computed(() => this.allCategories().filter((c) => !c.isProductType));
  protected readonly typeCategoryOptions = computed(() => this.allCategories().filter((c) => c.isProductType));

  protected readonly categorySearch = signal('');
  protected readonly statusFilter = signal<'' | 'trending' | 'featured'>('');
  protected readonly filteredProducts = computed(() => {
    const term = this.categorySearch();
    const status = this.statusFilter();
    return this.products().filter((p) => {
      if (term && !p.categories.includes(term)) return false;
      if (status === 'trending' && !p.isTrending) return false;
      if (status === 'featured' && !p.isFeatured) return false;
      return true;
    });
  });

  // Mirrors how the customer product page prices things, so the preview panel shows a
  // realistic starting price as the owner fills the form in — not the full checkout pricing
  // logic (that also depends on customer-picked extras/colors), just a representative figure.
  protected readonly previewPrice = computed(() => {
    const f = this.form();
    if (f.customSizeEnabled && f.customSizeUnitPrice) {
      return f.customSizeUnitPrice + (f.customSizeBaseFee ?? 0);
    }
    if (f.sizesEnabled && f.sizes.length > 0) {
      const first = f.sizes[0];
      return first.discountedPrice ?? first.price;
    }
    return f.discountedPrice ?? f.basePrice;
  });

  protected readonly previewRegularPrice = computed(() => {
    const f = this.form();
    if (f.sizesEnabled && f.sizes.length > 0) {
      return f.sizes[0].price;
    }
    return f.basePrice;
  });

  protected readonly previewIsDiscounted = computed(() => this.previewPrice() < this.previewRegularPrice());

  protected readonly previewImageUrl = computed(() => {
    const url = this.form().images[this.previewImageIndex()]?.url ?? this.form().images[0]?.url;
    return resolveAssetUrl(environment.apiUrl, url ?? null);
  });

  protected readonly previewImageIndex = signal(0);

  // Compared against the form's live JSON on every change so the browser's unload warning (and
  // the confirm-before-discard guard in closeForm) only fire when something would actually be
  // lost — reset to the current form whenever it's loaded fresh or successfully saved.
  private lastSavedFormJson = JSON.stringify(emptyForm());
  protected readonly isDirty = computed(() => this.formOpen() && JSON.stringify(this.form()) !== this.lastSavedFormJson);

  constructor() {
    this.reload();
    this.savedColorsApi.getAll().subscribe((colors) => this.savedColors.set(colors));
    this.categoriesApi.getAll().subscribe((categories) => this.allCategories.set(categories));
    this.destroyRef.onDestroy(this.unsavedChanges.register(() => this.isDirty()));
  }

  protected addCategory(): void {
    const name = this.newCategoryName().trim();
    if (!name) return;

    this.categoriesApi
      .create({ name, nameEn: this.newCategoryNameEn(), nameSq: this.newCategoryNameSq(), isProductType: this.newCategoryIsProductType() })
      .subscribe((category) => {
        this.allCategories.update((list) =>
          list.some((c) => c.id === category.id) ? list : [...list, category].sort((a, b) => a.sortOrder - b.sortOrder),
        );
        this.toggleCategory(category.name);
        this.newCategoryName.set('');
        this.newCategoryNameEn.set(null);
        this.newCategoryNameSq.set(null);
        this.newCategoryIsProductType.set(false);
      });
  }

  // Create only covers what's set at the moment a category is first added — this is how a typo
  // gets fixed, a translation gets added later, or a category gets moved between "occasion" and
  // "type" after the fact, without deleting and recreating it (which isn't even offered, since
  // that would silently orphan the category label on every product already using it).
  protected startEditCategory(category: Category): void {
    this.editingCategoryId.set(category.id);
    this.categoryDraft.set({
      name: category.name,
      nameEn: category.nameEn,
      nameSq: category.nameSq,
      isProductType: category.isProductType,
    });
  }

  protected cancelEditCategory(): void {
    this.editingCategoryId.set(null);
    this.categoryDraft.set(null);
  }

  protected updateCategoryDraft<K extends keyof CategoryDraft>(field: K, value: CategoryDraft[K]): void {
    this.categoryDraft.update((d) => (d ? { ...d, [field]: value } : d));
  }

  protected saveCategoryEdit(): void {
    const id = this.editingCategoryId();
    const draft = this.categoryDraft();
    const name = draft?.name.trim();
    if (!id || !draft || !name) return;

    this.categoriesApi.update(id, { ...draft, name }).subscribe((updated) => {
      this.allCategories.update((list) =>
        list.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.sortOrder - b.sortOrder),
      );
      this.editingCategoryId.set(null);
      this.categoryDraft.set(null);
    });
  }

  private reload(): void {
    this.productsApi.getAll().subscribe((products) => this.products.set(products));
  }

  protected openCreate(): void {
    this.form.set(emptyForm());
    this.lastSavedFormJson = JSON.stringify(this.form());
    this.previewImageIndex.set(0);
    this.showTranslations.set(false);
    this.formOpen.set(true);
  }

  protected openEdit(productId: string): void {
    this.productsApi.getById(productId).subscribe((product) => {
      this.form.set({
        id: product.id,
        name: product.name,
        nameEn: product.nameEn ?? '',
        nameSq: product.nameSq ?? '',
        description: product.description,
        descriptionEn: product.descriptionEn ?? '',
        descriptionSq: product.descriptionSq ?? '',
        basePrice: product.basePrice,
        discountedPrice: product.discountedPrice,
        categories: [...product.categories],
        showcaseCategories: [...product.showcaseCategories],
        tags: product.tags.join(', '),
        soldOut: product.soldOut,
        sizesEnabled: product.sizesEnabled,
        customSizeEnabled: product.customSizeEnabled,
        customSizeUnitPrice: product.customSizeUnitPrice,
        customSizeUnitLabel: product.customSizeUnitLabel ?? '',
        customSizeBaseFee: product.customSizeBaseFee,
        extrasEnabled: product.extrasEnabled,
        customTextEnabled: product.customTextEnabled,
        isTrending: product.isTrending,
        trendingOrder: null,
        isFeatured: product.isFeatured,
        images: product.images.map((i) => ({ url: i.url, colorTag: i.colorTag })),
        sizes: product.sizes.map((s) => ({
          name: s.name,
          description: s.description,
          price: s.price,
          discountedPrice: s.discountedPrice,
        })),
        colorGroups: product.colorGroups.map((g) => ({
          name: g.name,
          sortOrder: g.sortOrder,
          colors: g.colors.map((c) => ({ name: c.name, hexValue: c.hexValue, soldOut: c.soldOut })),
        })),
        extras: product.extras.map((x) => ({
          name: x.name,
          nameEn: x.nameEn,
          nameSq: x.nameSq,
          price: x.price,
          customTextEnabled: x.customTextEnabled,
        })),
      });
      this.lastSavedFormJson = JSON.stringify(this.form());
      this.previewImageIndex.set(0);
      this.showTranslations.set(false);
      this.formOpen.set(true);
    });
  }

  protected toggleTranslations(): void {
    this.showTranslations.update((v) => !v);
  }

  protected resolveUrl(url: string | null | undefined): string | null {
    return resolveAssetUrl(environment.apiUrl, url ?? null);
  }

  protected closeForm(): void {
    if (this.isDirty() && !confirm('Discard unsaved changes to this product?')) return;
    this.formOpen.set(false);
  }

  protected toggleCategory(category: ProductCategory): void {
    this.form.update((f) => {
      const has = f.categories.includes(category);
      return {
        ...f,
        categories: has ? f.categories.filter((c) => c !== category) : [...f.categories, category],
        // Unpicking a category can't leave it as the showcase pick for a tile it's not even in.
        showcaseCategories: has ? f.showcaseCategories.filter((c) => c !== category) : f.showcaseCategories,
      };
    });
  }

  // Marks (or unmarks) this product's photo as the one shown on the homepage "shop by
  // occasion" tile for the given category — only meaningful for a category the product is
  // actually assigned to (the checkbox only appears for those).
  protected toggleShowcaseCategory(category: string): void {
    this.form.update((f) => {
      const has = f.showcaseCategories.includes(category);
      return {
        ...f,
        showcaseCategories: has ? f.showcaseCategories.filter((c) => c !== category) : [...f.showcaseCategories, category],
      };
    });
  }

  protected addImage(): void {
    this.form.update((f) => ({ ...f, images: [...f.images, { url: '', colorTag: null }] }));
  }

  protected removeImage(index: number): void {
    this.form.update((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  protected updateImage(index: number, field: 'url' | 'colorTag', value: string): void {
    this.form.update((f) => ({
      ...f,
      images: f.images.map((img, i) => (i === index ? { ...img, [field]: field === 'colorTag' ? value || null : value } : img)),
    }));
  }

  // The first photo is the one shown as the product's main photo everywhere on the storefront
  // (see the hint text above the grid) — moving a photo to the front is how the owner picks it.
  protected moveImageUp(index: number): void {
    if (index === 0) return;
    this.reorderImages(index, index - 1);
  }

  protected moveImageDown(index: number): void {
    if (index === this.form().images.length - 1) return;
    this.reorderImages(index, index + 1);
  }

  private reorderImages(fromIndex: number, toIndex: number): void {
    this.form.update((f) => {
      const images = [...f.images];
      [images[fromIndex], images[toIndex]] = [images[toIndex], images[fromIndex]];
      return { ...f, images };
    });
  }

  protected addSize(): void {
    this.form.update((f) => ({
      ...f,
      sizes: [...f.sizes, { name: '', description: null, price: 0, discountedPrice: null }],
    }));
  }

  protected removeSize(index: number): void {
    this.form.update((f) => ({ ...f, sizes: f.sizes.filter((_, i) => i !== index) }));
  }

  protected updateSize(index: number, field: keyof UpsertProductSizeRequest, value: string | number | null): void {
    this.form.update((f) => ({ ...f, sizes: f.sizes.map((s, i) => (i === index ? { ...s, [field]: value } : s)) }));
  }

  // Owner names the group (e.g. "Box color", "Rose color", "Balloon color") — only groups
  // actually added here show up on the product page.
  protected addColorGroup(): void {
    this.form.update((f) => ({
      ...f,
      colorGroups: [...f.colorGroups, { name: '', sortOrder: f.colorGroups.length, colors: [] }],
    }));
  }

  protected removeColorGroup(groupIndex: number): void {
    this.form.update((f) => ({ ...f, colorGroups: f.colorGroups.filter((_, i) => i !== groupIndex) }));
  }

  protected updateColorGroupName(groupIndex: number, name: string): void {
    this.form.update((f) => ({
      ...f,
      colorGroups: f.colorGroups.map((g, i) => (i === groupIndex ? { ...g, name } : g)),
    }));
  }

  protected addColor(groupIndex: number): void {
    this.form.update((f) => ({
      ...f,
      colorGroups: f.colorGroups.map((g, i) =>
        i === groupIndex ? { ...g, colors: [...g.colors, { name: '', hexValue: '#cccccc', soldOut: false }] } : g,
      ),
    }));
  }

  protected removeColor(groupIndex: number, colorIndex: number): void {
    this.form.update((f) => ({
      ...f,
      colorGroups: f.colorGroups.map((g, i) => (i === groupIndex ? { ...g, colors: g.colors.filter((_, ci) => ci !== colorIndex) } : g)),
    }));
  }

  protected updateColor(groupIndex: number, colorIndex: number, field: keyof UpsertProductColorRequest, value: string | boolean): void {
    this.form.update((f) => ({
      ...f,
      colorGroups: f.colorGroups.map((g, i) =>
        i === groupIndex
          ? { ...g, colors: g.colors.map((c, ci) => (ci === colorIndex ? { ...c, [field]: value } : c)) }
          : g,
      ),
    }));

    // Typing a name that matches a saved color picks up its exact hex automatically — the
    // whole point of the palette is not having to re-eyeball "the beige we always use."
    if (field === 'name' && typeof value === 'string') {
      const match = this.savedColors().find((c) => c.name.toLowerCase() === value.trim().toLowerCase());
      if (match) {
        this.form.update((f) => ({
          ...f,
          colorGroups: f.colorGroups.map((g, i) =>
            i === groupIndex
              ? { ...g, colors: g.colors.map((c, ci) => (ci === colorIndex ? { ...c, hexValue: match.hexValue } : c)) }
              : g,
          ),
        }));
      }
    }
  }

  protected saveColorToPalette(groupIndex: number, colorIndex: number): void {
    const color = this.form().colorGroups[groupIndex]?.colors[colorIndex];
    if (!color || !color.name.trim()) return;

    this.savedColorsApi.save({ name: color.name.trim(), hexValue: color.hexValue }).subscribe((saved) => {
      this.savedColors.update((colors) => [...colors.filter((c) => c.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
    });
  }

  protected addExtra(): void {
    this.form.update((f) => ({
      ...f,
      extras: [...f.extras, { name: '', nameEn: null, nameSq: null, price: 0, customTextEnabled: false }],
    }));
  }

  protected removeExtra(index: number): void {
    this.form.update((f) => ({ ...f, extras: f.extras.filter((_, i) => i !== index) }));
  }

  protected updateExtra(index: number, field: keyof UpsertProductExtraRequest, value: string | number | boolean | null): void {
    this.form.update((f) => ({ ...f, extras: f.extras.map((x, i) => (i === index ? { ...x, [field]: value } : x)) }));
  }

  protected save(): void {
    const f = this.form();
    const request: UpsertProductRequest = {
      name: f.name,
      nameEn: f.nameEn.trim() || null,
      nameSq: f.nameSq.trim() || null,
      description: f.description,
      descriptionEn: f.descriptionEn.trim() || null,
      descriptionSq: f.descriptionSq.trim() || null,
      basePrice: f.basePrice,
      discountedPrice: f.sizesEnabled ? null : f.discountedPrice,
      categories: f.categories,
      showcaseCategories: f.showcaseCategories,
      tags: f.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      soldOut: f.soldOut,
      sizesEnabled: f.sizesEnabled,
      customSizeEnabled: f.customSizeEnabled,
      customSizeUnitPrice: f.customSizeEnabled ? f.customSizeUnitPrice : null,
      customSizeUnitLabel: f.customSizeEnabled ? f.customSizeUnitLabel || null : null,
      customSizeBaseFee: f.customSizeEnabled ? f.customSizeBaseFee : null,
      extrasEnabled: f.extrasEnabled,
      customTextEnabled: f.customTextEnabled,
      images: f.images.filter((i) => i.url.trim()),
      sizes: f.sizes.filter((s) => s.name.trim()),
      colorGroups: f.colorGroups
        .filter((g) => g.name.trim() && g.colors.some((c) => c.name.trim()))
        .map((g) => ({ ...g, colors: g.colors.filter((c) => c.name.trim()) })),
      extras: f.extras.filter((x) => x.name.trim()),
    };

    this.saving.set(true);
    const save$ = f.id ? this.productsApi.update(f.id, request) : this.productsApi.create(request);

    save$.subscribe((saved) => {
      this.productsApi.setTrending(saved.id, f.isTrending, f.trendingOrder).subscribe();
      this.productsApi.setFeatured(saved.id, f.isFeatured).subscribe(() => {
        this.saving.set(false);
        this.lastSavedFormJson = JSON.stringify(this.form());
        this.formOpen.set(false);
        this.reload();
      });
    });
  }

  protected toggleSoldOut(product: ProductListItem): void {
    this.productsApi.setSoldOut(product.id, !product.soldOut).subscribe(() => this.reload());
  }

  protected deleteProduct(product: ProductListItem): void {
    const confirmed = confirm(`Delete "${product.name}" permanently? This can't be undone.`);
    if (!confirmed) return;

    this.productsApi.delete(product.id).subscribe(() => this.reload());
  }
}
