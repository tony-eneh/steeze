import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-faq-page',
  imports: [RouterLink],
  templateUrl: './faq.page.html'
})
export class FaqPage {
  constructor(seo: SeoService) {
    seo.apply({
      title: 'Frequently asked questions',
      description:
        'Answers on escrow payments, the 2-day return window, measurements, delivery times, designer payouts and ratings on Steeze.',
      path: 'faq'
    });
  }
}
