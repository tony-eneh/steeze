import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/account.service';
import { UserProfile } from '../../core/models/account.models';
import { readApiError } from '../../core/services/api-error';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [IonicModule, FormsModule, NgIf],
  templateUrl: './profile-settings.page.html',
  styleUrl: './profile-settings.page.scss'
})
export class ProfileSettingsPage implements OnInit {
  profile: UserProfile | null = null;
  isLoading = true;
  isSaving = false;
  errorMessage = '';

  firstName = '';
  lastName = '';
  phone = '';

  constructor(
    private readonly accountService: AccountService,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.accountService.getProfile().subscribe({
      next: (response) => {
        this.profile = response.data;
        this.firstName = response.data.firstName ?? '';
        this.lastName = response.data.lastName ?? '';
        this.phone = response.data.phone ?? '';
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your profile.';
        this.isLoading = false;
      }
    });
  }

  save(): void {
    if (this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.accountService
      .updateProfile({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        phone: this.phone.trim() || undefined
      })
      .subscribe({
        next: (response) => {
          this.profile = response.data;
          this.isSaving = false;
          void this.notify('Profile updated.');
        },
        error: (error) => {
          this.isSaving = false;
          void this.notify(readApiError(error, 'Could not save your profile.'));
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
