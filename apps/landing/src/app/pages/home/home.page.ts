import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home.page.html'
})
export class HomePage {
  constructor(seo: SeoService) {
    seo.apply({
      title: 'Bespoke fashion, made for you | Steeze',
      description:
        'Order custom clothing from trusted designers. Choose your fabric and finish, send measurements once, and pay into escrow that only releases when you confirm delivery.',
      path: ''
    });
  }
}
