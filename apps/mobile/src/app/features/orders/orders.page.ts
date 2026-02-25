import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { OrderSummary } from '../../core/models/order.models';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    IonicModule,
    NgFor,
    NgIf,
    RouterModule,
    StatusPillComponent,
    EmptyStateComponent
  ],
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss'
})
export class OrdersPage implements OnInit {
  orders: OrderSummary[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private readonly ordersService: OrdersService) {}

  ngOnInit(): void {
    this.ordersService.listOrders().subscribe({
      next: (response) => {
        this.orders = response.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load orders right now.';
        this.isLoading = false;
      }
    });
  }
}
