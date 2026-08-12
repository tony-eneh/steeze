import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { DatePipe, DecimalPipe, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DesignerService } from '../../core/services/designer.service';
import { DesignerOrder } from '../../core/models/designer.models';
import { readApiError } from '../../core/services/api-error';

@Component({
  selector: 'app-designer-order-detail',
  standalone: true,
  imports: [IonicModule, NgIf, DatePipe, DecimalPipe],
  templateUrl: './designer-order-detail.page.html',
  styleUrl: './designer-order-detail.page.scss'
})
export class DesignerOrderDetailPage implements OnInit {
  order: DesignerOrder | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly designerService: DesignerService,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.load();
  }

  // The designer owns exactly these transitions; couriers and Steeze admin
  // handle everything after ready-for-pickup.
  get canAccept(): boolean {
    return this.order?.status === 'PAID';
  }

  get canStart(): boolean {
    return this.order?.status === 'ACCEPTED';
  }

  get canMarkReady(): boolean {
    return this.order?.status === 'IN_PROGRESS';
  }

  accept(): void {
    this.run(() => this.designerService.acceptOrder(this.order!.id), 'Order accepted.');
  }

  reject(): void {
    this.run(
      () => this.designerService.rejectOrder(this.order!.id),
      'Order rejected. The customer will be refunded.'
    );
  }

  start(): void {
    this.run(
      () => this.designerService.startOrder(this.order!.id),
      'Marked as in progress.'
    );
  }

  markReady(): void {
    this.run(
      () => this.designerService.markReady(this.order!.id),
      'Marked ready. Steeze will dispatch a courier.'
    );
  }

  private run(
    action: () => ReturnType<DesignerService['acceptOrder']>,
    successMessage: string
  ): void {
    if (!this.order || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    action().subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.notify(successMessage);
        this.load();
      },
      error: (error) => {
        this.isSubmitting = false;
        void this.notify(readApiError(error, 'Could not update the order.'));
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
    this.designerService.getOrder(id).subscribe({
      next: (response) => {
        this.order = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load this order.';
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
