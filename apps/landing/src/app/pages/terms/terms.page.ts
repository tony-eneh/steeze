import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-terms-page',
  imports: [RouterLink],
  templateUrl: './terms.page.html'
})
export class TermsPage {
  constructor(seo: SeoService) {
    seo.apply({
      title: 'Terms of service',
      description:
        'The terms that govern use of the Steeze marketplace by customers and designers, including payments, escrow, returns and account rules.',
      path: 'terms'
    });
  }
}
