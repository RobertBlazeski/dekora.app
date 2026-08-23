import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductListItem } from '@dekora/shared';

import { ProductCard } from './product-card';

describe('ProductCard', () => {
  let component: ProductCard;
  let fixture: ComponentFixture<ProductCard>;

  const sampleProduct: ProductListItem = {
    id: 'p1',
    name: 'Sample',
    nameEn: null,
    nameSq: null,
    basePrice: 100,
    lowestPrice: 100,
    isDiscounted: false,
    discountPercent: null,
    categories: ['Birthdays'],
    soldOut: false,
    isTrending: false,
    isFeatured: false,
    primaryImageUrl: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCard);
    component = fixture.componentInstance;
    component.product = sampleProduct;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
