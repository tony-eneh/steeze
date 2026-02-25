import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
  { path: 'about', loadComponent: () => import('./pages/about/about.page').then(m => m.AboutPage) },
  { path: 'how-it-works', loadComponent: () => import('./pages/how-it-works/how-it-works.page').then(m => m.HowItWorksPage) },
  { path: 'for-designers', loadComponent: () => import('./pages/for-designers/for-designers.page').then(m => m.ForDesignersPage) },
  { path: 'pricing', loadComponent: () => import('./pages/pricing/pricing.page').then(m => m.PricingPage) },
  { path: 'faq', loadComponent: () => import('./pages/faq/faq.page').then(m => m.FaqPage) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.page').then(m => m.ContactPage) },
  { path: 'terms', loadComponent: () => import('./pages/terms/terms.page').then(m => m.TermsPage) },
  { path: 'privacy', loadComponent: () => import('./pages/privacy/privacy.page').then(m => m.PrivacyPage) },
  { path: '**', redirectTo: '' }
];
