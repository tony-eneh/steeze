import { Component } from '@angular/core';
import { SiteShellComponent } from './components/site-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SiteShellComponent],
  template: `<app-site-shell />`
})
export class AppComponent {}
