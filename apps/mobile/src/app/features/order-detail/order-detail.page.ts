import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../core/services/orders.service';
import { OrderDetail } from '../../core/models/order.models';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [IonicModule, NgFor, NgIf, FormsModule, RouterModule],
  templateUrl: './order-detail.page.html',
  styleUrl: './order-detail.page.scss'
})
export class OrderDetailPage implements OnInit {
  order: OrderDetail | null = null;
  isLoading = true;
  errorMessage = '';
  returnReason = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly ordersService: OrdersService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Order not found.';
      this.isLoading = false;
      return;
    }

    this.ordersService.getOrder(id).subscribe({
      next: (response) => {
        this.order = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load order.';
        this.isLoading = false;
      }
    });
  }

  confirmOrder(): void {
    if (!this.order) {
      return;
    }

    this.ordersService.confirmOrder(this.order.id).subscribe();
  }

  requestReturn(): void {
    if (!this.order || !this.returnReason.trim()) {
      return;
    }

    this.ordersService.requestReturn(this.order.id, this.returnReason).subscribe();
  }
}
