import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DesignerService } from '../../core/services/designer.service';
import {
  ManagedDesign,
  PublicDesigner
} from '../../core/models/designer.models';

@Component({
  selector: 'app-designer-profile',
  standalone: true,
  imports: [IonicModule, RouterModule, NgFor, NgIf, DecimalPipe],
  templateUrl: './designer-profile.page.html',
  styleUrl: './designer-profile.page.scss'
})
export class DesignerProfilePage implements OnInit {
  designer: PublicDesigner | null = null;
  designs: ManagedDesign[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly designerService: DesignerService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.errorMessage = 'Designer not found.';
      this.isLoading = false;
      return;
    }

    this.designerService.getPublicProfile(slug).subscribe({
      next: (response) => {
        this.designer = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load this designer.';
        this.isLoading = false;
      }
    });

    this.designerService.getPublicDesigns(slug).subscribe({
      next: (response) => {
        this.designs = response.data ?? [];
      }
    });
  }

  primaryImage(design: ManagedDesign): string | null {
    const images = design.images ?? [];
    return (images.find((image) => image.isPrimary) ?? images[0])?.url ?? null;
  }
}
