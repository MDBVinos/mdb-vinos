export type Wine = {
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

export type WineFormOptions = {
  moments: Moment[];
  wineTypes: WineType[];
  intensities: Intensity[];
};

export type WineFormInitialData = Wine & {
  momentIds: string[];
  wineTypeId: string;
  intensityId: string;
};

export type ActionState = {
  error?: string;
};
