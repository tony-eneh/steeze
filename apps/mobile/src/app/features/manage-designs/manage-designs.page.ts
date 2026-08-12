import { Component, OnInit } from '@angular/core';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DesignerService } from '../../core/services/designer.service';
import { ManagedDesign } from '../../core/models/designer.models';
import { readApiError } from '../../core/services/api-error';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-manage-designs',
  standalone: true,
  imports: [
    IonicModule,
    RouterModule,
    NgFor,
    NgIf,
    DecimalPipe,
    EmptyStateComponent
  ],
  templateUrl: './manage-designs.page.html',
  styleUrl: './manage-designs.page.scss'
})
export class ManageDesignsPage implements OnInit {
  designs: ManagedDesign[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly designerService: DesignerService,
    private readonly toastController: ToastController,
    private readonly alertController: AlertController
  ) {}

  ngOnInit(): void {
    this.load();
  }

  /** Ionic re-enters the page without re-running ngOnInit. */
  ionViewWillEnter(): void {
    this.load();
  }

  togglePublished(design: ManagedDesign): void {
    this.designerService
      .updateDesign(design.id, { isPublished: !design.isPublished })
      .subscribe({
        next: () => {
          design.isPublished = !design.isPublished;
          void this.notify(
            design.isPublished ? 'Design published.' : 'Design unpublished.'
          );
        },
        error: (error) => {
          void this.notify(readApiError(error, 'Could not update the design.'));
        }
      });
  }

  async remove(design: ManagedDesign): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Delete design',
      message: `Delete "${design.title}"? Existing orders keep their history.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.designerService.deleteDesign(design.id).subscribe({
              next: () => {
                void this.notify('Design deleted.');
                this.load();
              },
              error: (error) => {
                void this.notify(
                  readApiError(error, 'Could not delete the design.')
                );
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  primaryImage(design: ManagedDesign): string | null {
    const images = design.images ?? [];
    return (images.find((image) => image.isPrimary) ?? images[0])?.url ?? null;
  }

  private load(): void {
    this.isLoading = true;

    this.designerService.listMyDesigns().subscribe({
      next: (response) => {
        this.designs = response.data?.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load your designs.';
        this.isLoading = false;
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
