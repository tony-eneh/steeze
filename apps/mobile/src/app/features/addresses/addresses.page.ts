import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './addresses.page.html',
  styleUrl: './addresses.page.scss'
})
export class AddressesPage {
  label = '';
  street = '';
  city = '';
  state = '';
}
