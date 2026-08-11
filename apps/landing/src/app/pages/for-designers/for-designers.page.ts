import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-for-designers-page',
  imports: [RouterLink],
  templateUrl: './for-designers.page.html'
})
export class ForDesignersPage {
  constructor(seo: SeoService) {
    seo.apply({
      title: 'Sell your designs on Steeze',
      description:
        'List your catalogue, set fabric and add-on pricing, accept orders and get paid once the customer confirms delivery. Steeze handles payments, couriers and disputes.',
      path: 'for-designers'
    });
  }
}
