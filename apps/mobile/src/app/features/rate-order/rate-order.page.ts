import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RatingsService } from '../../core/services/ratings.service';
import { readApiError } from '../../core/services/api-error';

@Component({
  selector: 'app-rate-order',
  standalone: true,
  imports: [IonicModule, FormsModule, NgIf],
  templateUrl: './rate-order.page.html',
  styleUrl: './rate-order.page.scss'
})
export class RateOrderPage implements OnInit {
  score = 5;
  comment = '';
  isSubmitting = false;
  errorMessage = '';

  private orderId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly ratingsService: RatingsService,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.orderId) {
      this.errorMessage = 'No order was supplied to rate.';
    }
  }

  submit(): void {
    if (!this.orderId || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.ratingsService
      .rateOrder(this.orderId, {
        score: this.score,
        comment: this.comment.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          void this.notify('Thanks for rating this order.');
          void this.router.navigate(['/orders', this.orderId]);
        },
        error: (error) => {
          this.isSubmitting = false;
          // Rating twice, or before confirmation, is rejected by the API.
          this.errorMessage = readApiError(
            error,
            'Could not submit your rating.'
          );
        }
      });
  }

  private async notify(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}
