import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './returns.page.html',
  styleUrl: './returns.page.scss'
})
export class ReturnsPage {
  orderNumber = '';
  reason = '';
}
