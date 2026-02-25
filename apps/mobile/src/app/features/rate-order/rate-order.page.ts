import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rate-order',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './rate-order.page.html',
  styleUrl: './rate-order.page.scss'
})
export class RateOrderPage {
  score = 5;
  comment = '';
}
