import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Analytics } from './analytics';

describe('Analytics', () => {
  let component: Analytics;
  let fixture: ComponentFixture<Analytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Analytics],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Analytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
