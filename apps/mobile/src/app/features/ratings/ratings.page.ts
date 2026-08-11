import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RatingsService } from '../../core/services/ratings.service';
import { AuthService } from '../../core/services/auth.service';
import { Rating } from '../../core/models/engagement.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-ratings',
  standalone: true,
  imports: [IonicModule, NgFor, NgIf, DatePipe, EmptyStateComponent],
  templateUrl: './ratings.page.html',
  styleUrl: './ratings.page.scss'
})
export class RatingsPage implements OnInit {
  ratings: Rating[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly ratingsService: RatingsService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.user()?.id;

    if (!userId) {
      this.errorMessage = 'Sign in to see your ratings.';
      this.isLoading = false;
      return;
    }

    this.ratingsService.listForUser(userId).subscribe({
      next: (response) => {
        this.ratings = response.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your ratings.';
        this.isLoading = false;
      }
    });
  }

  get average(): number | null {
    if (!this.ratings.length) {
      return null;
    }

    const total = this.ratings.reduce((sum, rating) => sum + rating.score, 0);
    return Math.round((total / this.ratings.length) * 10) / 10;
  }

  stars(score: number): string {
    return '★'.repeat(score) + '☆'.repeat(Math.max(0, 5 - score));
  }
}
