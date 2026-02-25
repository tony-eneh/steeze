import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminApiService } from '../../core/services/admin-api.service';
import { RatingSummary } from '../../core/models/api.types';

@Component({
  selector: 'app-ratings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './ratings.component.html',
  styleUrl: './ratings.component.scss'
})
export class RatingsComponent {
  readonly userIdControl = new FormControl('', [Validators.required]);
  ratings: RatingSummary[] = [];
  isLoading = false;

  constructor(private adminApi: AdminApiService) {}

  fetchRatings(): void {
    if (this.userIdControl.invalid) {
      return;
    }

    this.isLoading = true;
    this.adminApi.getRatingsForUser(this.userIdControl.value ?? '').subscribe({
      next: (response) => {
        this.ratings = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
