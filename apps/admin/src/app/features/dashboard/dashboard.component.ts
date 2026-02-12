import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { DashboardStats, OrdersStats, PaymentsOverview } from '../../core/models/api.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, BaseChartDirective, StatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats?: DashboardStats;
  payments?: PaymentsOverview;
  ordersStats: OrdersStats = {};
  isLoading = true;

  readonly statusOrder = [
    'PENDING_PAYMENT',
    'PAID',
    'ACCEPTED',
    'IN_PROGRESS',
    'READY_FOR_PICKUP',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'CONFIRMED',
    'AUTO_CONFIRMED',
    'RETURN_REQUESTED',
    'RETURNED',
    'CANCELLED',
    'REJECTED'
  ];

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false }
    }
  };

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      stats: this.adminApi.getDashboardStats(),
      orders: this.adminApi.getOrdersStats(),
      payments: this.adminApi.getPaymentsOverview()
    }).subscribe({
      next: ({ stats, orders, payments }) => {
        this.stats = stats;
        this.ordersStats = orders;
        this.payments = payments;
        this.barChartData = {
          labels: this.statusOrder,
          datasets: [
            {
              data: this.statusOrder.map((status) => orders[status] ?? 0),
              backgroundColor: 'rgba(255, 118, 72, 0.7)'
            }
          ]
        };
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
