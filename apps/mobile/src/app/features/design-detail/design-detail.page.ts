import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DesignsService } from '../../core/services/designs.service';
import { DesignDetail } from '../../core/models/design.models';

@Component({
  selector: 'app-design-detail',
  standalone: true,
  imports: [IonicModule, NgFor, NgIf, RouterModule],
  templateUrl: './design-detail.page.html',
  styleUrl: './design-detail.page.scss'
})
export class DesignDetailPage implements OnInit {
  design: DesignDetail | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly designsService: DesignsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Design not found.';
      this.isLoading = false;
      return;
    }

    this.designsService.getDesign(id).subscribe({
      next: (response) => {
        this.design = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load design.';
        this.isLoading = false;
      }
    });
  }
}
