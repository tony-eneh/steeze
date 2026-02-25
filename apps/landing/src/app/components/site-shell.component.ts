import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-site-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
  <header class="container" style="padding:1rem 1rem;display:flex;justify-content:space-between;align-items:center">
    <a routerLink="/" style="font-weight:700;text-decoration:none;color:var(--ink)">Steeze</a>
    <nav style="display:flex;gap:1rem;flex-wrap:wrap">
      <a routerLink="/how-it-works">How it works</a>
      <a routerLink="/for-designers">For designers</a>
      <a routerLink="/pricing">Pricing</a>
      <a routerLink="/faq">FAQ</a>
      <a routerLink="/contact">Contact</a>
    </nav>
  </header>
  <router-outlet></router-outlet>
  <footer class="container" style="padding:2rem 1rem;color:var(--muted)">
    © {{year}} Steeze · <a routerLink="/terms">Terms</a> · <a routerLink="/privacy">Privacy</a>
  </footer>
  `
})
export class SiteShellComponent { year = new Date().getFullYear(); }
