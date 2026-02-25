import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-designer-profile',
  standalone: true,
  imports: [IonicModule, RouterModule],
  templateUrl: './designer-profile.page.html',
  styleUrl: './designer-profile.page.scss'
})
export class DesignerProfilePage {}
