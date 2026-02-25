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
import { UserSummary } from '../../core/models/api.types';

@Component({
  selector: 'app-users',
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
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  readonly roleControl = new FormControl('');
  readonly displayedColumns = ['name', 'email', 'role', 'status', 'actions'];
  users: UserSummary[] = [];
  isLoading = true;

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.roleControl.valueChanges.subscribe(() => this.loadUsers());
  }

  loadUsers(): void {
    this.isLoading = true;
    const role = this.roleControl.value || undefined;
    this.adminApi.listUsers(role).subscribe({
      next: (response) => {
        this.users = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleUser(user: UserSummary): void {
    this.adminApi.updateUserStatus(user.id, !user.isActive).subscribe({
      next: (updated) => {
        this.users = this.users.map((item) => (item.id === user.id ? { ...item, isActive: updated.isActive } : item));
      }
    });
  }
}
