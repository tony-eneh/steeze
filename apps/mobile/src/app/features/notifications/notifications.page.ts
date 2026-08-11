import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationsService } from '../../core/services/notifications.service';
import { AppNotification } from '../../core/models/engagement.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [IonicModule, NgFor, NgIf, DatePipe, EmptyStateComponent],
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.scss'
})
export class NotificationsPage implements OnInit {
  notifications: AppNotification[] = [];
  unreadCount = 0;
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  /** Marks the notification read, then jumps to whatever it is about. */
  open(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationsService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });
    }

    const orderId = notification.data?.['orderId'];

    if (typeof orderId === 'string' && orderId.length > 0) {
      void this.router.navigate(['/orders', orderId]);
    }
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((item) => ({
          ...item,
          isRead: true
        }));
        this.unreadCount = 0;
      }
    });
  }

  private load(): void {
    this.isLoading = true;

    this.notificationsService.list({ limit: 50 }).subscribe({
      next: (response) => {
        this.notifications = response.data?.data ?? [];
        this.unreadCount = this.notifications.filter(
          (item) => !item.isRead
        ).length;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load notifications.';
        this.isLoading = false;
      }
    });
  }
}
