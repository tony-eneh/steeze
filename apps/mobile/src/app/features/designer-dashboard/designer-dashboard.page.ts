import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-designer-dashboard',
  standalone: true,
  imports: [IonicModule, RouterModule],
  templateUrl: './designer-dashboard.page.html',
  styleUrl: './designer-dashboard.page.scss'
})
export class DesignerDashboardPage {}
