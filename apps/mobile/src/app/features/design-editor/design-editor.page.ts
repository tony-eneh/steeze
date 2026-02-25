import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-design-editor',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './design-editor.page.html',
  styleUrl: './design-editor.page.scss'
})
export class DesignEditorPage {
  title = '';
  description = '';
  basePrice = '';
  category = '';
  estimatedDays = '';
}
