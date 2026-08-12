import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DecimalPipe, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DesignerService } from '../../core/services/designer.service';
import { AuthService } from '../../core/services/auth.service';
import { DesignerEarnings } from '../../core/models/designer.models';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [IonicModule, RouterModule, NgIf, DecimalPipe],
  templateUrl: './wallet.page.html',
  styleUrl: './wallet.page.scss'
})
export class WalletPage implements OnInit {
  earnings: DesignerEarnings | null = null;
  isDesigner = false;
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly designerService: DesignerService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isDesigner = this.authService.user()?.role === 'DESIGNER';

    // Customers hold no balance: their money sits in escrow against a
    // specific order until they confirm delivery.
    if (!this.isDesigner) {
      this.isLoading = false;
      return;
    }

    this.designerService.getEarnings().subscribe({
      next: (response) => {
        this.earnings = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your balance.';
        this.isLoading = false;
      }
    });
  }
}
