import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-site-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <a class="brand" routerLink="/">Steeze</a>
      <nav class="site-nav" aria-label="Main">
        <a routerLink="/how-it-works" routerLinkActive="active">How it works</a>
        <a routerLink="/for-designers" routerLinkActive="active">For designers</a>
        <a routerLink="/pricing" routerLinkActive="active">Pricing</a>
        <a routerLink="/about" routerLinkActive="active">About</a>
        <a routerLink="/faq" routerLinkActive="active">FAQ</a>
        <a routerLink="/contact" routerLinkActive="active">Contact</a>
      </nav>
    </header>

    <main id="main">
      <router-outlet></router-outlet>
    </main>

    <footer class="site-footer">
      <span>&copy; {{ year }} Steeze</span>
      <nav aria-label="Legal">
        <a routerLink="/terms">Terms</a>
        <a routerLink="/privacy">Privacy</a>
        <a routerLink="/contact">Contact</a>
      </nav>
    </footer>
  `,
  styles: [
    `
      .skip-link {
        position: absolute;
        left: -9999px;
      }

      .skip-link:focus {
        position: static;
        display: inline-block;
        padding: 0.5rem 1rem;
      }
    `
  ]
})
export class SiteShellComponent {
  year = new Date().getFullYear();
}
