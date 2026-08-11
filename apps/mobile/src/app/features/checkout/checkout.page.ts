import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [IonicModule, FormsModule, RouterModule],
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.scss'
})
export class CheckoutPage {
  selectedAddress = 'home';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  proceedToPayment(): void {
    const orderId = this.route.snapshot.queryParamMap.get('orderId');

    void this.router.navigate(['/payment'], {
      queryParams: orderId ? { orderId } : {}
    });
  }
}
