import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DesignsService } from '../../core/services/designs.service';
import { DesignSummary } from '../../core/models/design.models';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonicModule,
    NgFor,
    NgIf,
    RouterModule,
    SectionHeaderComponent
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss'
})
export class HomePage implements OnInit {
  designs: DesignSummary[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private readonly designsService: DesignsService) {}

  ngOnInit(): void {
    this.designsService.listDesigns({ limit: 6 }).subscribe({
      next: (response) => {
        this.designs = response.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load designs right now.';
        this.isLoading = false;
      }
    });
  }
}
