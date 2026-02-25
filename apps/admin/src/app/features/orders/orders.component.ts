import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AdminApiService } from '../../core/services/admin-api.service';
import { OrderSummary } from '../../core/models/api.types';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  readonly statusControl = new FormControl('');
  readonly displayedColumns = ['orderNumber', 'customer', 'designer', 'status', 'total'];
  orders: OrderSummary[] = [];
  isLoading = true;

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.statusControl.valueChanges.subscribe(() => this.loadOrders());
  }

  loadOrders(): void {
    this.isLoading = true;
    const status = this.statusControl.value || undefined;
    this.adminApi.listOrders(status).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
