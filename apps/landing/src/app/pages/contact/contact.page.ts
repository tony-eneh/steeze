import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-contact-page',
  imports: [RouterLink],
  templateUrl: './contact.page.html'
})
export class ContactPage {
  constructor(seo: SeoService) {
    seo.apply({
      title: 'Contact Steeze',
      description:
        'Reach the Steeze team about an order, a designer application, a dispute, press or partnerships.',
      path: 'contact'
    });
  }
}
