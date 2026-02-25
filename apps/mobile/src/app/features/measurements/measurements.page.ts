import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-measurements',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './measurements.page.html',
  styleUrl: './measurements.page.scss'
})
export class MeasurementsPage {
  openTailorEmail = '';
}
