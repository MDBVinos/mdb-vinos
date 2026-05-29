export type PublicWine = {
  id: string;
  name: string;
  winery: string | null;
  winery_id: string | null;
  winery_name: string | null;
  wine_line_id: string | null;
  wine_line_name: string | null;
  varietal_id: string | null;
  varietal_name: string | null;
  description: string | null;
  discount_id?: string | null;
  discount_name?: string | null;
  discount_percent: number | null;
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

export type PublicWinery = {
  id: string;
  name: string;
};

export type PublicWineLine = {
  id: string;
  name: string;
  wineryId: string;
};

export type PublicVarietal = {
  id: string;
  name: string;
};

export type WineDetails = PublicWine & {
  intensities: PublicIntensity[];
  moments: PublicMoment[];
  wineType: PublicWineType | null;
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

export type WineryCatalog = PublicWinery & {
  lines: Array<
    PublicWineLine & {
      wines: PublicWine[];
    }
  >;
};

export type HeaderWinery = PublicWinery & {
  lines: PublicWineLine[];
};

export type WineLineDetails = PublicWineLine & {
  winery: PublicWinery | null;
  wines: PublicWine[];
};
