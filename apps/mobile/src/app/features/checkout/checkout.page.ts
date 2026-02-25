import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [IonicModule, FormsModule, RouterModule],
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.scss'
})
export class CheckoutPage {
  selectedAddress = 'home';

  constructor(private readonly router: Router) {}

  proceedToPayment(): void {
    this.router.navigateByUrl('/payment');
  }
}
