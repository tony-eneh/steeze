import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () =>
			import('./features/auth/login/login.component').then(
				(m) => m.LoginComponent,
			),
	},
	{
		path: '',
		loadComponent: () =>
			import('./shared/components/layout/layout.component').then(
				(m) => m.LayoutComponent,
			),
		canActivate: [authGuard],
		canActivateChild: [authGuard],
		children: [
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./features/dashboard/dashboard.component').then(
						(m) => m.DashboardComponent,
					),
			},
			{
				path: 'orders',
				loadComponent: () =>
					import('./features/orders/orders.component').then(
						(m) => m.OrdersComponent,
					),
			},
			{
				path: 'users',
				loadComponent: () =>
					import('./features/users/users.component').then(
						(m) => m.UsersComponent,
					),
			},
			{
				path: 'designers',
				loadComponent: () =>
					import('./features/designers/designers.component').then(
						(m) => m.DesignersComponent,
					),
			},
			{
				path: 'payments',
				loadComponent: () =>
					import('./features/payments/payments.component').then(
						(m) => m.PaymentsComponent,
					),
			},
			{
				path: 'returns',
				loadComponent: () =>
					import('./features/returns/returns.component').then(
						(m) => m.ReturnsComponent,
					),
			},
			{
				path: 'settings',
				loadComponent: () =>
					import('./features/settings/settings.component').then(
						(m) => m.SettingsComponent,
					),
			},
			{
				path: 'ratings',
				loadComponent: () =>
					import('./features/ratings/ratings.component').then(
						(m) => m.RatingsComponent,
					),
			},
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
		],
	},
	{ path: '**', redirectTo: 'dashboard' },
];
