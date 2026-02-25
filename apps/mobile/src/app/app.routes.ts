import { Routes } from '@angular/router';
import { TabsPage } from './tabs/tabs.page';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.page').then((m) => m.LoginPage)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register.page').then((m) => m.RegisterPage)
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password.page').then(
            (m) => m.ForgotPasswordPage
          )
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
      }
    ]
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.page').then((m) => m.HomePage)
      },
      {
        path: 'explore',
        loadComponent: () =>
          import('./features/explore/explore.page').then((m) => m.ExplorePage)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders.page').then((m) => m.OrdersPage)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.page').then((m) => m.ProfilePage)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home'
      }
    ]
  },
  {
    path: 'designs/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/design-detail/design-detail.page').then(
        (m) => m.DesignDetailPage
      )
  },
  {
    path: 'designers/:slug',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/designer-profile/designer-profile.page').then(
        (m) => m.DesignerProfilePage
      )
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/order-detail/order-detail.page').then(
        (m) => m.OrderDetailPage
      )
  },
  {
    path: 'orders/:id/rate',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/rate-order/rate-order.page').then(
        (m) => m.RateOrderPage
      )
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/checkout/checkout.page').then(
        (m) => m.CheckoutPage
      )
  },
  {
    path: 'payment',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/payment/payment.page').then((m) => m.PaymentPage)
  },
  {
    path: 'measurements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/measurements/measurements.page').then(
        (m) => m.MeasurementsPage
      )
  },
  {
    path: 'addresses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/addresses/addresses.page').then(
        (m) => m.AddressesPage
      )
  },
  {
    path: 'profile/settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile-settings/profile-settings.page').then(
        (m) => m.ProfileSettingsPage
      )
  },
  {
    path: 'wallet',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/wallet/wallet.page').then((m) => m.WalletPage)
  },
  {
    path: 'ratings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ratings/ratings.page').then((m) => m.RatingsPage)
  },
  {
    path: 'returns',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/returns/returns.page').then((m) => m.ReturnsPage)
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications.page').then(
        (m) => m.NotificationsPage
      )
  },
  {
    path: 'designer/dashboard',
    canActivate: [authGuard, roleGuard('DESIGNER')],
    loadComponent: () =>
      import('./features/designer-dashboard/designer-dashboard.page').then(
        (m) => m.DesignerDashboardPage
      )
  },
  {
    path: 'designer/designs',
    canActivate: [authGuard, roleGuard('DESIGNER')],
    loadComponent: () =>
      import('./features/manage-designs/manage-designs.page').then(
        (m) => m.ManageDesignsPage
      )
  },
  {
    path: 'designer/designs/new',
    canActivate: [authGuard, roleGuard('DESIGNER')],
    loadComponent: () =>
      import('./features/design-editor/design-editor.page').then(
        (m) => m.DesignEditorPage
      )
  },
  {
    path: 'designer/designs/:id/edit',
    canActivate: [authGuard, roleGuard('DESIGNER')],
    loadComponent: () =>
      import('./features/design-editor/design-editor.page').then(
        (m) => m.DesignEditorPage
      )
  },
  {
    path: 'designer/orders',
    canActivate: [authGuard, roleGuard('DESIGNER')],
    loadComponent: () =>
      import('./features/designer-orders/designer-orders.page').then(
        (m) => m.DesignerOrdersPage
      )
  },
  {
    path: 'designer/orders/:id',
    canActivate: [authGuard, roleGuard('DESIGNER')],
    loadComponent: () =>
      import('./features/designer-order-detail/designer-order-detail.page').then(
        (m) => m.DesignerOrderDetailPage
      )
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
