import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DesignsService } from '../../core/services/designs.service';
import { DesignSummary } from '../../core/models/design.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    RouterModule,
    NgFor,
    NgIf,
    DecimalPipe,
    EmptyStateComponent
  ],
  templateUrl: './explore.page.html',
  styleUrl: './explore.page.scss'
})
export class ExplorePage implements OnInit {
  search = '';
  category = '';
  gender = '';

  designs: DesignSummary[] = [];
  isLoading = true;
  errorMessage = '';

  // Typing fires a request per keystroke otherwise.
  private readonly searchChanges = new Subject<void>();

  constructor(private readonly designsService: DesignsService) {}

  ngOnInit(): void {
    this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.load());

    this.load();
  }

  onSearchChange(): void {
    this.searchChanges.next();
  }

  onFilterChange(): void {
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.category = '';
    this.gender = '';
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.designsService
      .listDesigns({
        search: this.search.trim() || undefined,
        category: this.category || undefined,
        gender: this.gender || undefined,
        limit: 30
      })
      .subscribe({
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
