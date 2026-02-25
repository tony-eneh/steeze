import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-designer-orders',
  standalone: true,
  imports: [IonicModule, RouterModule],
  templateUrl: './designer-orders.page.html',
  styleUrl: './designer-orders.page.scss'
})
export class DesignerOrdersPage {}
