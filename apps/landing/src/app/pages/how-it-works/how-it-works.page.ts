import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-how-it-works-page',
  imports: [RouterLink],
  templateUrl: './how-it-works.page.html'
})
export class HowItWorksPage {
  constructor(seo: SeoService) {
    seo.apply({
      title: 'How Steeze works',
      description:
        'From browsing a catalogue to confirming delivery: how ordering, escrow payment, courier delivery, returns and ratings work on Steeze.',
      path: 'how-it-works'
    });
  }
}
