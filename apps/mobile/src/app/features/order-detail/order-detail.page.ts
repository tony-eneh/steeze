import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../core/services/orders.service';
import { ReturnsService } from '../../core/services/returns.service';
import { OrderDetail } from '../../core/models/order.models';
import { readApiError } from '../../core/services/api-error';

// A return can only be raised while the order is delivered and inside the
// 2-day window; confirming ends that window.
const RETURNABLE_STATUSES = ['DELIVERED'];

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    IonicModule,
    NgFor,
    NgIf,
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterModule
  ],
  templateUrl: './order-detail.page.html',
  styleUrl: './order-detail.page.scss'
})
export class OrderDetailPage implements OnInit {
  order: OrderDetail | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  returnReason = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly ordersService: OrdersService,
    private readonly returnsService: ReturnsService,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get canConfirm(): boolean {
    return this.order?.status === 'DELIVERED';
  }

  get canReturn(): boolean {
    return RETURNABLE_STATUSES.includes(this.order?.status ?? '');
  }

  get canRate(): boolean {
    return ['CONFIRMED', 'AUTO_CONFIRMED'].includes(this.order?.status ?? '');
  }

  confirmOrder(): void {
    if (!this.order || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.ordersService.confirmOrder(this.order.id).subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.notify('Delivery confirmed. The designer has been paid.');
        this.load();
      },
      error: (error) => {
        this.isSubmitting = false;
        void this.notify(readApiError(error, 'Could not confirm the order.'));
      }
    });
  }

  requestReturn(): void {
    if (!this.order || this.isSubmitting) {
      return;
    }

    const reason = this.returnReason.trim();
    if (!reason) {
      void this.notify('Tell us what is wrong before submitting.');
      return;
    }

    this.isSubmitting = true;
    this.returnsService.request(this.order.id, reason).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.returnReason = '';
        void this.notify('Return requested. We will arrange a courier.');
        this.load();
      },
      error: (error) => {
        this.isSubmitting = false;
        void this.notify(readApiError(error, 'Could not request a return.'));
      }
    });
  }

  private load(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Order not found.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
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

  private async notify(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}
