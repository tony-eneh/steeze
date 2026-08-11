import { Component, OnInit } from '@angular/core';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/account.service';
import { Address } from '../../core/models/account.models';
import { readApiError } from '../../core/services/api-error';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [IonicModule, FormsModule, NgFor, NgIf, EmptyStateComponent],
  templateUrl: './addresses.page.html',
  styleUrl: './addresses.page.scss'
})
export class AddressesPage implements OnInit {
  addresses: Address[] = [];
  isLoading = true;
  isSaving = false;
  errorMessage = '';

  label = '';
  street = '';
  city = '';
  state = '';
  isDefault = false;

  constructor(
    private readonly accountService: AccountService,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get canSave(): boolean {
    return (
      this.street.trim().length > 0 &&
      this.city.trim().length > 0 &&
      this.state.trim().length > 0
    );
  }

  save(): void {
    if (!this.canSave || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.accountService
      .createAddress({
        label: this.label.trim() || undefined,
        street: this.street.trim(),
        city: this.city.trim(),
        state: this.state.trim(),
        isDefault: this.isDefault
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.resetForm();
          void this.notify('Address saved.');
          this.load();
        },
        error: (error) => {
          this.isSaving = false;
          void this.notify(readApiError(error, 'Could not save the address.'));
        }
      });
  }

  makeDefault(address: Address): void {
    if (address.isDefault) {
      return;
    }

    this.accountService
      .updateAddress(address.id, { isDefault: true })
      .subscribe({
        next: () => {
          void this.notify('Default delivery address updated.');
          this.load();
        },
        error: (error) => {
          void this.notify(readApiError(error, 'Could not update the address.'));
        }
      });
  }

  async remove(address: Address): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete address',
      message: `Remove ${address.label || address.street}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.accountService.deleteAddress(address.id).subscribe({
              next: () => {
                void this.notify('Address deleted.');
                this.load();
              },
              error: (error) => {
                void this.notify(
                  readApiError(error, 'Could not delete the address.')
                );
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  private load(): void {
    this.isLoading = true;
    this.accountService.listAddresses().subscribe({
      next: (response) => {
        this.addresses = response.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your addresses.';
        this.isLoading = false;
      }
    });
  }

  private resetForm(): void {
    this.label = '';
    this.street = '';
    this.city = '';
    this.state = '';
    this.isDefault = false;
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
