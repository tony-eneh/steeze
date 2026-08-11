import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-privacy-page',
  imports: [RouterLink],
  templateUrl: './privacy.page.html'
})
export class PrivacyPage {
  constructor(seo: SeoService) {
    seo.apply({
      title: 'Privacy policy',
      description:
        'What personal data Steeze collects, why we collect it, who we share it with, how long we keep it and the rights you have over it.',
      path: 'privacy'
    });
  }
}
