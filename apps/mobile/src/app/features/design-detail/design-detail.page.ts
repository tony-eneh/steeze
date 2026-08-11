import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DesignsService } from '../../core/services/designs.service';
import { DesignDetail } from '../../core/models/design.models';

@Component({
  selector: 'app-design-detail',
  standalone: true,
  imports: [IonicModule, FormsModule, NgFor, NgIf, DecimalPipe, RouterModule],
  templateUrl: './design-detail.page.html',
  styleUrl: './design-detail.page.scss'
})
export class DesignDetailPage implements OnInit {
  design: DesignDetail | null = null;
  isLoading = true;
  errorMessage = '';

  selectedFabricId = '';
  selectedSizeLabel = '';
  selectedAddOnIds: string[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
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

  get primaryImage(): string | null {
    const images = this.design?.images ?? [];
    return (images.find((image) => image.isPrimary) ?? images[0])?.url ?? null;
  }

  /** Mirrors the API's calculation so the price shown matches the order. */
  get total(): number {
    if (!this.design) {
      return 0;
    }

    const fabric = this.design.fabricOptions.find(
      (option) => option.id === this.selectedFabricId
    );
    const size = this.design.sizePricings.find(
      (pricing) => pricing.sizeLabel === this.selectedSizeLabel
    );
    const addOns = this.design.addOns.filter((addOn) =>
      this.selectedAddOnIds.includes(addOn.id)
    );

    return (
      Number(this.design.basePrice) +
      Number(fabric?.priceAdjustment ?? 0) +
      Number(size?.priceAdjustment ?? 0) +
      addOns.reduce((sum, addOn) => sum + Number(addOn.price), 0)
    );
  }

  toggleAddOn(addOnId: string): void {
    this.selectedAddOnIds = this.selectedAddOnIds.includes(addOnId)
      ? this.selectedAddOnIds.filter((id) => id !== addOnId)
      : [...this.selectedAddOnIds, addOnId];
  }

  isAddOnSelected(addOnId: string): boolean {
    return this.selectedAddOnIds.includes(addOnId);
  }

  startOrder(): void {
    if (!this.design) {
      return;
    }

    void this.router.navigate(['/checkout'], {
      queryParams: {
        designId: this.design.id,
        fabricOptionId: this.selectedFabricId || undefined,
        sizeLabel: this.selectedSizeLabel || undefined,
        addOnIds: this.selectedAddOnIds.length
          ? this.selectedAddOnIds.join(',')
          : undefined
      }
    });
  }
}
