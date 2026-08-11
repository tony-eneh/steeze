import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentsService } from '../../core/services/payments.service';

type PaymentState = 'starting' | 'awaiting' | 'verifying' | 'success' | 'failed';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './payment.page.html',
  styleUrl: './payment.page.scss'
})
export class PaymentPage implements OnInit {
  state: PaymentState = 'starting';
  errorMessage = '';
  checkoutUrl = '';
  reference = '';
  private orderId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly payments: PaymentsService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.orderId = params.get('orderId') ?? '';

    // Paystack sends the customer back with the reference on the query string.
    const returnedReference = params.get('reference') ?? params.get('trxref');

    if (returnedReference) {
      this.reference = returnedReference;
      this.verify();
      return;
    }

    if (!this.orderId) {
      this.fail('No order was supplied for payment.');
      return;
    }

    this.start();
  }

  start(): void {
    this.state = 'starting';
    this.errorMessage = '';

    this.payments.initialize(this.orderId).subscribe({
      next: (response) => {
        this.reference = response.data.reference;
        this.checkoutUrl = response.data.authorizationUrl;
        this.state = 'awaiting';
        this.openCheckout();
      },
      error: (error) => this.fail(readError(error, 'Could not start payment.'))
    });
  }

  openCheckout(): void {
    if (this.checkoutUrl) {
      window.location.href = this.checkoutUrl;
    }
  }

  verify(): void {
    this.state = 'verifying';

    this.payments.verify(this.reference).subscribe({
      next: (response) => {
        // Paystack reports 'success' once funds are captured; anything else
        // means the customer abandoned or the charge was declined.
        if (response.data?.status === 'success') {
          this.state = 'success';
          return;
        }
        this.fail('Payment was not completed.');
      },
      error: (error) =>
        this.fail(readError(error, 'Could not verify the payment.'))
    });
  }

  goToOrders(): void {
    void this.router.navigateByUrl('/tabs/orders');
  }

  private fail(message: string): void {
    this.state = 'failed';
    this.errorMessage = message;
  }
}

function readError(error: unknown, fallback: string): string {
  const message = (error as { error?: { message?: string } })?.error?.message;
  return typeof message === 'string' && message.length > 0 ? message : fallback;
}
