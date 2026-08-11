import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { KeyValuePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MeasurementsService } from '../../core/services/measurements.service';
import { AccountService } from '../../core/services/account.service';
import { readApiError } from '../../core/services/api-error';

@Component({
  selector: 'app-measurements',
  standalone: true,
  imports: [IonicModule, FormsModule, NgIf, NgFor, KeyValuePipe],
  templateUrl: './measurements.page.html',
  styleUrl: './measurements.page.scss'
})
export class MeasurementsPage implements OnInit {
  openTailorEmail = '';
  linkedEmail: string | null = null;
  measurements: Record<string, unknown> | null = null;

  isLoading = true;
  isLinking = false;
  /** Set when an account is linked but the measurement source is unreachable. */
  fetchMessage = '';

  constructor(
    private readonly measurementsService: MeasurementsService,
    private readonly accountService: AccountService,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.accountService.getProfile().subscribe({
      next: (response) => {
        this.linkedEmail = response.data.openTailorEmail ?? null;
        this.openTailorEmail = this.linkedEmail ?? '';

        if (this.linkedEmail) {
          this.loadMeasurements();
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        this.fetchMessage = 'Unable to load your profile.';
      }
    });
  }

  link(): void {
    const email = this.openTailorEmail.trim();

    if (!email || this.isLinking) {
      return;
    }

    this.isLinking = true;
    this.measurementsService.linkEmail(email).subscribe({
      next: () => {
        this.isLinking = false;
        this.linkedEmail = email;
        void this.notify('Open Tailor account linked.');
        this.loadMeasurements();
      },
      error: (error) => {
        this.isLinking = false;
        void this.notify(readApiError(error, 'Could not link that email.'));
      }
    });
  }

  private loadMeasurements(): void {
    this.isLoading = true;
    this.fetchMessage = '';

    this.measurementsService.getMine().subscribe({
      next: (response) => {
        const data = (response.data ?? {}) as Record<string, unknown>;
        const nested = data['measurements'];

        this.measurements =
          nested && typeof nested === 'object'
            ? (nested as Record<string, unknown>)
            : data;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.measurements = null;
        this.fetchMessage = readApiError(
          error,
          'Your measurements could not be fetched right now.'
        );
      }
    });
  }

  private async notify(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}
