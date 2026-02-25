import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-manage-designs',
  standalone: true,
  imports: [IonicModule, RouterModule],
  templateUrl: './manage-designs.page.html',
  styleUrl: './manage-designs.page.scss'
})
export class ManageDesignsPage {}
