import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ReturnRequestSummary } from '../../core/models/api.types';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './returns.component.html',
  styleUrl: './returns.component.scss'
})
export class ReturnsComponent implements OnInit {
  readonly statusControl = new FormControl('');
  readonly displayedColumns = ['order', 'customer', 'status', 'actions'];
  returns: ReturnRequestSummary[] = [];
  isLoading = true;

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadReturns();
    this.statusControl.valueChanges.subscribe(() => this.loadReturns());
  }

  loadReturns(): void {
    this.isLoading = true;
    const status = this.statusControl.value || undefined;
    this.adminApi.listReturns(status).subscribe({
      next: (response) => {
        this.returns = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  updateStatus(request: ReturnRequestSummary, action: 'approve' | 'reject' | 'pickup-dispatched' | 'returned'): void {
    this.adminApi.updateReturnStatus(request.id, action).subscribe({
      next: (updated) => {
        this.returns = this.returns.map((item) => (item.id === request.id ? { ...item, status: updated.status } : item));
      }
    });
  }
}
