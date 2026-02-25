import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './profile-settings.page.html',
  styleUrl: './profile-settings.page.scss'
})
export class ProfileSettingsPage {
  firstName = '';
  lastName = '';
  phone = '';
}
