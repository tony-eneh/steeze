import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DesignsService } from '../../core/services/designs.service';
import { AccountService } from '../../core/services/account.service';
import { OrdersService } from '../../core/services/orders.service';
import { MeasurementsService } from '../../core/services/measurements.service';
import { DesignDetail } from '../../core/models/design.models';
import { Address } from '../../core/models/account.models';
import { readApiError } from '../../core/services/api-error';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    RouterModule,
    NgFor,
    NgIf,
    DecimalPipe
  ],
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.scss'
})
export class CheckoutPage implements OnInit {
  design: DesignDetail | null = null;
  addresses: Address[] = [];
  selectedAddressId = '';
  specialInstructions = '';

  fabricOptionId = '';
  sizeLabel = '';
  addOnIds: string[] = [];

  measurementsLinked = false;
  isLoading = true;
  isPlacing = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly designsService: DesignsService,
    private readonly accountService: AccountService,
    private readonly ordersService: OrdersService,
    private readonly measurementsService: MeasurementsService,
    private readonly toastController: ToastController
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const designId = params.get('designId') ?? '';

    this.fabricOptionId = params.get('fabricOptionId') ?? '';
    this.sizeLabel = params.get('sizeLabel') ?? '';
    this.addOnIds = (params.get('addOnIds') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!designId) {
      this.errorMessage = 'Pick a design before checking out.';
      this.isLoading = false;
      return;
    }

    this.designsService.getDesign(designId).subscribe({
      next: (response) => {
        this.design = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load that design.';
        this.isLoading = false;
      }
    });

    this.accountService.listAddresses().subscribe({
      next: (response) => {
        this.addresses = response.data ?? [];
        this.selectedAddressId =
          this.addresses.find((address) => address.isDefault)?.id ??
          this.addresses[0]?.id ??
          '';
      }
    });

    // Purely informational: the API attaches measurements server-side.
    this.measurementsService.getMine().subscribe({
      next: () => (this.measurementsLinked = true),
      error: () => (this.measurementsLinked = false)
    });
  }

  get selectedFabricName(): string | null {
    return (
      this.design?.fabricOptions.find(
        (option) => option.id === this.fabricOptionId
      )?.name ?? null
    );
  }

  get selectedAddOns() {
    return (this.design?.addOns ?? []).filter((addOn) =>
      this.addOnIds.includes(addOn.id)
    );
  }

  get total(): number {
    if (!this.design) {
      return 0;
    }

    const fabric = this.design.fabricOptions.find(
      (option) => option.id === this.fabricOptionId
    );
    const size = this.design.sizePricings.find(
      (pricing) => pricing.sizeLabel === this.sizeLabel
    );

    return (
      Number(this.design.basePrice) +
      Number(fabric?.priceAdjustment ?? 0) +
      Number(size?.priceAdjustment ?? 0) +
      this.selectedAddOns.reduce((sum, addOn) => sum + Number(addOn.price), 0)
    );
  }

  placeOrder(): void {
    if (!this.design || !this.selectedAddressId || this.isPlacing) {
      return;
    }

    this.isPlacing = true;
    this.ordersService
      .createOrder({
        designId: this.design.id,
        deliveryAddressId: this.selectedAddressId,
        fabricOptionId: this.fabricOptionId || undefined,
        sizeLabel: this.sizeLabel || undefined,
        addOnIds: this.addOnIds.length
          ? this.addOnIds.map((addOnId) => ({ addOnId }))
          : undefined,
        specialInstructions: this.specialInstructions.trim() || undefined
      })
      .subscribe({
        next: (response) => {
          this.isPlacing = false;
          // Payment picks the order up from here and hands off to Paystack.
          void this.router.navigate(['/payment'], {
            queryParams: { orderId: response.data.id }
          });
        },
        error: (error) => {
          this.isPlacing = false;
          void this.notify(readApiError(error, 'Could not place the order.'));
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
