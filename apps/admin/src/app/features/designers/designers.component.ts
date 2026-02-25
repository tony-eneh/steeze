import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AdminApiService } from '../../core/services/admin-api.service';
import { DesignerSummary } from '../../core/models/api.types';

@Component({
  selector: 'app-designers',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './designers.component.html',
  styleUrl: './designers.component.scss'
})
export class DesignersComponent implements OnInit {
  readonly filterControl = new FormControl('');
  readonly displayedColumns = ['business', 'owner', 'status', 'actions'];
  designers: DesignerSummary[] = [];
  isLoading = true;

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadDesigners();
    this.filterControl.valueChanges.subscribe(() => this.loadDesigners());
  }

  loadDesigners(): void {
    this.isLoading = true;
    const value = this.filterControl.value;
    const verified = value === '' ? undefined : value === 'verified';

    this.adminApi.listDesigners(verified).subscribe({
      next: (response) => {
        this.designers = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleDesigner(designer: DesignerSummary): void {
    this.adminApi.updateDesignerVerification(designer.id, !designer.isVerified).subscribe({
      next: (updated) => {
        this.designers = this.designers.map((item) =>
          item.id === designer.id ? { ...item, isVerified: updated.isVerified } : item
        );
      }
    });
  }
}
