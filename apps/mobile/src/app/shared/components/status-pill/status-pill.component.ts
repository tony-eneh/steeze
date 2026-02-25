import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  templateUrl: './status-pill.component.html',
  styleUrl: './status-pill.component.scss'
})
export class StatusPillComponent {
  @Input({ required: true }) label = '';
  @Input() tone: 'neutral' | 'success' | 'warning' = 'neutral';
}
