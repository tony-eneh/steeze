import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, MatListModule, MatIconModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly items: NavItem[] = [
    { label: 'Dashboard', icon: 'insights', route: '/dashboard' },
    { label: 'Orders', icon: 'local_shipping', route: '/orders' },
    { label: 'Users', icon: 'group', route: '/users' },
    { label: 'Designers', icon: 'check_circle', route: '/designers' },
    { label: 'Payments', icon: 'account_balance_wallet', route: '/payments' },
    { label: 'Returns', icon: 'assignment_return', route: '/returns' },
    { label: 'Settings', icon: 'tune', route: '/settings' },
    { label: 'Ratings', icon: 'stars', route: '/ratings' }
  ];
}
