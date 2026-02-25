import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [NgIf, RouterModule],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss'
})
export class SectionHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() linkLabel = '';
  @Input() linkUrl = '';
}
