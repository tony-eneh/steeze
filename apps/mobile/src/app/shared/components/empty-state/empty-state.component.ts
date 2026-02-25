import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NgIf],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input({ required: true }) title = '';
  @Input() message = '';
}
