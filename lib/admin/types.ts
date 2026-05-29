export type Wine = {
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
  discount_id: string | null;
  discount_name: string | null;
  discount_percent: number | null;
  price_unit: number | null;
  price_box: number | null;
  units_per_box: number | null;
  image_url: string | null;
  featured: boolean;
  active: boolean;
};

export type AdminDiscount = {
  id: string;
  name: string;
  percent: number;
  wines: Wine[];
  wine_count: number;
};

export type Moment = {
  id: string;
  name: string;
};

export type WineType = {
  id: string;
  name: string;
};

export type Intensity = {
  id: string;
  name: string;
};

export type Winery = {
  id: string;
  name: string;
};

export type WineLine = {
  id: string;
  name: string;
  wineryId: string;
};

export type Varietal = {
  id: string;
  name: string;
};

export type WineFormOptions = {
  moments: Moment[];
  wineTypes: WineType[];
  intensities: Intensity[];
  wineries: Winery[];
  wineLines: WineLine[];
  varietals: Varietal[];
};

export type WineFormInitialData = Wine & {
  intensityIds: string[];
  momentIds: string[];
  wineTypeId: string;
};

export type ActionState = {
  error?: string;
};
