export type PublicWine = {
  id: string;
  name: string;
  winery: string | null;
  description: string | null;
  price_unit: number | null;
  price_box: number | null;
  units_per_box: number | null;
  image_url: string | null;
  featured: boolean;
  active: boolean;
};

export type PublicMoment = {
  id: string;
  name: string;
};

export type PublicWineType = {
  id: string;
  name: string;
};

export type PublicIntensity = {
  id: string;
  name: string;
};

export type WineDetails = PublicWine & {
  moments: PublicMoment[];
  wineType: PublicWineType | null;
  intensity: PublicIntensity | null;
};

export type CatalogFilters = {
  momentName?: string;
  typeId?: string;
  maxPrice?: number;
};

export type RecommendationFilters = {
  momentName: string;
  budget?: number;
  typeId?: string;
  intensityId?: string;
};
