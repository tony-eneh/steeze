import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [IonicModule, FormsModule],
  templateUrl: './explore.page.html',
  styleUrl: './explore.page.scss'
})
export class ExplorePage {
  search = '';
  category = '';
  gender = '';
}
