import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { PlatformSetting } from '../../core/models/api.types';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  readonly form = this.fb.group({
    commission_percentage: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
    return_courier_fee: ['', [Validators.required, Validators.min(0)]],
    auto_confirm_days: ['', [Validators.required, Validators.min(0)]]
  });

  isLoading = true;
  settings: PlatformSetting[] = [];

  constructor(
    private fb: FormBuilder,
    private adminApi: AdminApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.adminApi.getSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        const map = new Map(settings.map((item) => [item.key, item.value]));
        this.form.patchValue({
          commission_percentage: map.get('commission_percentage') ?? '',
          return_courier_fee: map.get('return_courier_fee') ?? '',
          auto_confirm_days: map.get('auto_confirm_days') ?? ''
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const values = this.form.getRawValue();
    const updates = Object.entries(values).map(([key, value]) =>
      this.adminApi.updateSetting(key, String(value ?? ''))
    );

    forkJoin(updates).subscribe({
      next: () => {
        this.snackBar.open('Settings updated.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to update settings.', 'Close', { duration: 3000 });
      }
    });
  }
}
