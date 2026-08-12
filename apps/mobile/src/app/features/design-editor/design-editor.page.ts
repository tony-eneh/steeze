import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DesignerService } from '../../core/services/designer.service';
import { ManagedDesign } from '../../core/models/designer.models';
import { readApiError } from '../../core/services/api-error';

@Component({
  selector: 'app-design-editor',
  standalone: true,
  imports: [IonicModule, FormsModule, NgIf, NgFor],
  templateUrl: './design-editor.page.html',
  styleUrl: './design-editor.page.scss'
})
export class DesignEditorPage implements OnInit {
  designId = '';
  design: ManagedDesign | null = null;

  title = '';
  description = '';
  basePrice: number | null = null;
  category = '';
  estimatedDays: number | null = null;
  isPublished = false;

  isLoading = false;
  isSaving = false;
  isUploading = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly designerService: DesignerService,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.designId = this.route.snapshot.paramMap.get('id') ?? '';

    if (this.designId) {
      this.loadDesign();
    }
  }

  get isEditing(): boolean {
    return Boolean(this.designId);
  }

  get canSave(): boolean {
    return (
      this.title.trim().length > 0 &&
      this.description.trim().length > 0 &&
      this.category.trim().length > 0 &&
      this.basePrice !== null &&
      this.basePrice >= 0
    );
  }

  save(): void {
    if (!this.canSave || this.isSaving) {
      return;
    }

    const payload = {
      title: this.title.trim(),
      description: this.description.trim(),
      category: this.category.trim(),
      basePrice: Number(this.basePrice),
      estimatedDays:
        this.estimatedDays === null ? undefined : Number(this.estimatedDays),
      isPublished: this.isPublished
    };

    this.isSaving = true;

    const request = this.isEditing
      ? this.designerService.updateDesign(this.designId, payload)
      : this.designerService.createDesign(payload);

    request.subscribe({
      next: (response) => {
        this.isSaving = false;
        void this.notify(this.isEditing ? 'Design saved.' : 'Design created.');

        // A new design needs its id before images can be attached.
        if (!this.isEditing) {
          void this.router.navigate([
            '/designer/designs',
            response.data.id,
            'edit'
          ]);
          return;
        }

        this.design = response.data;
      },
      error: (error) => {
        this.isSaving = false;
        void this.notify(readApiError(error, 'Could not save the design.'));
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.isEditing) {
      return;
    }

    this.isUploading = true;

    // Upload first, then attach the hosted URL to this design.
    this.designerService.uploadImage(file).subscribe({
      next: (uploaded) => {
        this.designerService
          .attachImage(this.designId, uploaded.data.url)
          .subscribe({
            next: () => {
              this.isUploading = false;
              input.value = '';
              void this.notify('Image added.');
              this.loadDesign();
            },
            error: (error) => {
              this.isUploading = false;
              void this.notify(
                readApiError(error, 'Uploaded, but could not attach the image.')
              );
            }
          });
      },
      error: (error) => {
        this.isUploading = false;
        void this.notify(readApiError(error, 'Could not upload the image.'));
      }
    });
  }

  removeImage(imageId: string): void {
    this.designerService.removeImage(this.designId, imageId).subscribe({
      next: () => {
        void this.notify('Image removed.');
        this.loadDesign();
      },
      error: (error) => {
        void this.notify(readApiError(error, 'Could not remove the image.'));
      }
    });
  }

  private loadDesign(): void {
    this.isLoading = true;

    this.designerService.getDesign(this.designId).subscribe({
      next: (response) => {
        this.design = response.data;
        this.title = response.data.title;
        this.description = response.data.description;
        this.basePrice = Number(response.data.basePrice);
        this.category = response.data.category;
        this.estimatedDays = response.data.estimatedDays ?? null;
        this.isPublished = response.data.isPublished;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load this design.';
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
