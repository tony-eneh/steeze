import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-pricing-page',
  imports: [RouterLink],
  templateUrl: './pricing.page.html'
})
export class PricingPage {
  constructor(seo: SeoService) {
    seo.apply({
      title: 'Pricing and fees',
      description:
        'No listing fees and no monthly subscription. Steeze takes a commission on completed orders, and return courier fees are a flat published rate.',
      path: 'pricing'
    });
  }
}
