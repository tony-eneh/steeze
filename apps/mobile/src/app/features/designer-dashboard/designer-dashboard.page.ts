import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DesignerService } from '../../core/services/designer.service';
import {
  DesignerEarnings,
  DesignerOrder
} from '../../core/models/designer.models';

// Orders sitting in these statuses are the ones needing the designer to act.
const ACTIONABLE = ['PAID', 'ACCEPTED', 'IN_PROGRESS'];

@Component({
  selector: 'app-designer-dashboard',
  standalone: true,
  imports: [IonicModule, RouterModule, NgFor, NgIf, DecimalPipe],
  templateUrl: './designer-dashboard.page.html',
  styleUrl: './designer-dashboard.page.scss'
})
export class DesignerDashboardPage implements OnInit {
  earnings: DesignerEarnings | null = null;
  actionableOrders: DesignerOrder[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private readonly designerService: DesignerService) {}

  ngOnInit(): void {
    this.designerService.getEarnings().subscribe({
      next: (response) => {
        this.earnings = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your dashboard.';
        this.isLoading = false;
      }
    });

    this.designerService.listOrders().subscribe({
      next: (response) => {
        this.actionableOrders = (response.data?.data ?? []).filter((order) =>
          ACTIONABLE.includes(order.status)
        );
      }
    });
  }
}
