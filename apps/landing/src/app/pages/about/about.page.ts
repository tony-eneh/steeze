import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-about-page',
  imports: [RouterLink],
  templateUrl: './about.page.html'
})
export class AboutPage {
  constructor(seo: SeoService) {
    seo.apply({
      title: 'About Steeze',
      description:
        'Steeze is a marketplace for bespoke fashion. We handle payments, logistics and disputes so designers can focus on making clothes and customers can order with confidence.',
      path: 'about'
    });
  }
}
