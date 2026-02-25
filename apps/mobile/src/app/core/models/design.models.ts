export interface DesignSummary {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  currency: string;
  category: string;
  gender?: string;
  imageUrl?: string;
  designerName: string;
  designerSlug: string;
}

export interface DesignDetail extends DesignSummary {
  fabricOptions: Array<{
    id: string;
    name: string;
    color?: string;
    priceAdjustment: number;
  }>;
  addOns: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  sizePricings: Array<{
    id: string;
    sizeLabel: string;
    priceAdjustment: number;
  }>;
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
}
