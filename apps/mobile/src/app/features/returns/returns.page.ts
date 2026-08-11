import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReturnsService } from '../../core/services/returns.service';
import { OrdersService } from '../../core/services/orders.service';
import { ReturnRequest } from '../../core/models/engagement.models';
import { OrderSummary } from '../../core/models/order.models';
import { readApiError } from '../../core/services/api-error';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    NgFor,
    NgIf,
    DatePipe,
    EmptyStateComponent
  ],
  templateUrl: './returns.page.html',
  styleUrl: './returns.page.scss'
})
export class ReturnsPage implements OnInit {
  returns: ReturnRequest[] = [];
  /** Only delivered orders are still inside the return window. */
  eligibleOrders: OrderSummary[] = [];

  selectedOrderId = '';
  reason = '';

  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly returnsService: ReturnsService,
    private readonly ordersService: OrdersService,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.load();
  }

  submit(): void {
    if (!this.selectedOrderId || this.isSubmitting) {
      return;
    }

    const reason = this.reason.trim();

    if (!reason) {
      void this.notify('Tell us why you are returning the order.');
      return;
    }

    this.isSubmitting = true;
    this.returnsService.request(this.selectedOrderId, reason).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.selectedOrderId = '';
        this.reason = '';
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
    this.isLoading = true;

    this.returnsService.list().subscribe({
      next: (response) => {
        this.returns = response.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your returns.';
        this.isLoading = false;
      }
    });

    this.ordersService.listOrders().subscribe({
      next: (response) => {
        this.eligibleOrders = (response.data ?? []).filter(
          (order) => order.status === 'DELIVERED'
        );
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
