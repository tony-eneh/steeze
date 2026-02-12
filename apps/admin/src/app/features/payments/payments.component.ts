import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { AdminApiService } from '../../core/services/admin-api.service';
import { PaymentsOverview } from '../../core/models/api.types';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, StatCardComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit {
  overview?: PaymentsOverview;
  isLoading = true;

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.adminApi.getPaymentsOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
