import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DesignerService } from '../../core/services/designer.service';
import { DesignerOrder } from '../../core/models/designer.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-designer-orders',
  standalone: true,
  imports: [
    IonicModule,
    RouterModule,
    FormsModule,
    NgFor,
    NgIf,
    DatePipe,
    DecimalPipe,
    EmptyStateComponent
  ],
  templateUrl: './designer-orders.page.html',
  styleUrl: './designer-orders.page.scss'
})
export class DesignerOrdersPage implements OnInit {
  orders: DesignerOrder[] = [];
  status = '';
  isLoading = true;
  errorMessage = '';

  readonly statuses = [
    'PAID',
    'ACCEPTED',
    'IN_PROGRESS',
    'READY_FOR_PICKUP',
    'IN_TRANSIT',
    'DELIVERED',
    'CONFIRMED',
    'RETURNED'
  ];

  constructor(private readonly designerService: DesignerService) {}

  ngOnInit(): void {
    this.load();
  }

  onStatusChange(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.designerService.listOrders(this.status || undefined).subscribe({
      next: (response) => {
        this.orders = response.data?.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your orders.';
        this.isLoading = false;
      }
    });
  }
}
