import ExcelJS from "exceljs";

export type WineImportLookup = {
  id: string;
  name: string;
};

export type ParsedWineImportRow = {
  active: boolean;
  description: string | null;
  featured: boolean;
  hasExplicitActive: boolean;
  hasExplicitDescription: boolean;
  hasExplicitFeatured: boolean;
  hasExplicitImage: boolean;
  hasExplicitIntensity: boolean;
  hasExplicitVarietal: boolean;
  hasExplicitWineLine: boolean;
  hasExplicitMoments: boolean;
  hasExplicitType: boolean;
  hasExplicitWinery: boolean;
  imageUrl: string | null;
  intensityNames: string[];
  line: number;
  momentNames: string[];
  name: string;
  priceBox: number | null;
  priceUnit: number | null;
  typeName: string | null;
  unitsPerBox: number | null;
  varietalName: string | null;
  winery: string | null;
  wineryLineName: string | null;
};

export type WineImportPreviewRow = ParsedWineImportRow & {
  action: "create" | "skip" | "update";
  errors: string[];
  intensityIds: string[];
  missingIntensityNames: string[];
  missingMomentNames: string[];
  missingTypeName: string | null;
  missingVarietalName: string | null;
  missingWineLineName: string | null;
  missingWineryName: string | null;
  momentIds: string[];
  typeId: string | null;
  varietalId: string | null;
  warnings: string[];
  wineId: string | null;
  wineLineId: string | null;
  wineryId: string | null;
};

export type WineImportPreview = {
  rows: WineImportPreviewRow[];
  summary: {
    creates: number;
    errors: number;
    rows: number;
    skips: number;
    updates: number;
    warnings: number;
  };
};

type WineImportColumn =
  | "active"
  | "description"
  | "featured"
  | "image"
  | "line"
  | "lineId"
  | "moments"
  | "name"
  | "priceBox"
  | "priceUnit"
  | "profile"
  | "type"
  | "unitsPerBox"
  | "winery";

type PreviewContext = {
  existingWines: WineImportLookup[];
  intensities: WineImportLookup[];
  moments: WineImportLookup[];
  varietals: WineImportLookup[];
  wineLines: Array<WineImportLookup & { wineryId: string }>;
  wineTypes: WineImportLookup[];
  wineries: WineImportLookup[];
};

const REQUIRED_COLUMNS: WineImportColumn[] = [
  "name",
  "winery",
  "priceUnit",
  "priceBox",
  "unitsPerBox",
  "type",
  "profile",
  "moments",
];

const COLUMN_LABELS: Record<WineImportColumn, string> = {
  active: "active",
  description: "Descripcion",
  featured: "featured",
  image: "image",
  line: "winery line",
  lineId: "Line ID",
  moments: "moments",
  name: "name",
  priceBox: "Precio de venta Caja",
  priceUnit: "Precio Venta Unidad",
  profile: "profile",
  type: "type",
  unitsPerBox: "Unidades x caja",
  winery: "winery",
};

const HEADER_ALIASES = new Map<string, WineImportColumn>(
  [
    ["name", "name"],
    ["nombre", "name"],
    ["winery", "winery"],
    ["bodega", "winery"],
    ["winery line", "line"],
    ["linea bodega", "line"],
    ["línea bodega", "line"],
    ["linea de vino", "line"],
    ["línea de vino", "line"],
    ["line", "line"],
    ["line id", "lineId"],
    ["varietal", "lineId"],
    ["variedad", "lineId"],
    ["description", "description"],
    ["descripcion", "description"],
    ["descripción", "description"],
    ["detalle", "description"],
    ["precio venta unidad", "priceUnit"],
    ["precio de venta unidad", "priceUnit"],
    ["precio unidad", "priceUnit"],
    ["price unit", "priceUnit"],
    ["price_unit", "priceUnit"],
    ["precio de venta caja", "priceBox"],
    ["precio venta caja", "priceBox"],
    ["precio caja", "priceBox"],
    ["price box", "priceBox"],
    ["price_box", "priceBox"],
    ["unidades x caja", "unitsPerBox"],
    ["unidades por caja", "unitsPerBox"],
    ["units per box", "unitsPerBox"],
    ["units_per_box", "unitsPerBox"],
    ["type", "type"],
    ["tipo", "type"],
    ["profile", "profile"],
    ["perfil", "profile"],
    ["intensity", "profile"],
    ["intensidad", "profile"],
    ["moments", "moments"],
    ["momentos", "moments"],
    ["image", "image"],
    ["imagen", "image"],
    ["image url", "image"],
    ["image_url", "image"],
    ["active", "active"],
    ["activo", "active"],
    ["estado", "active"],
    ["status", "active"],
    ["featured", "featured"],
    ["destacado", "featured"],
    ["destacada", "featured"],
  ].map(([key, value]) => [normalizeImportKey(key), value as WineImportColumn]),
);

export function normalizeImportKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function cellText(cell: ExcelJS.Cell) {
  const value = cell.value;

  if (value == null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }

    if ("hyperlink" in value && typeof value.hyperlink === "string") {
      return value.hyperlink.trim();
    }

    if ("result" in value) {
      return String(value.result ?? "").trim();
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text ?? "").join("").trim();
    }
  }

  return String(value).trim();
}

function parseNumber(value: string) {
  if (!value) {
    return null;
  }

  let normalized = value.replace(/[^\d,.-]/g, "");

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized =
      normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseInteger(value: string) {
  const number = parseNumber(value);
  return number == null ? null : Math.trunc(number);
}

function parseBoolean(value: string) {
  const normalized = normalizeImportKey(value);
  return ["1", "true", "si", "yes", "y", "x", "destacado"].includes(normalized);
}

function parseActiveValue(value: string) {
  const normalized = normalizeImportKey(value);

  if (["1", "true", "si", "yes", "y", "activo", "active", "habilitado", "alta"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n", "inactivo", "inactive", "desactivado", "deshabilitado", "baja"].includes(normalized)) {
    return false;
  }

  return null;
}

function parseFeaturedColumnStatus(value: string) {
  const normalized = normalizeImportKey(value);

  if (["activo", "active", "habilitado", "alta"].includes(normalized)) {
    return true;
  }

  if (["inactivo", "inactive", "desactivado", "deshabilitado", "baja"].includes(normalized)) {
    return false;
  }

  return null;
}

function normalizeWineTypeName(value: string) {
  const normalized = normalizeImportKey(value);
  const known = new Map([
    ["tinto", "Tinto"],
    ["blanco", "Blanco"],
    ["rosado", "Rosado"],
    ["rose", "Rosado"],
    ["espumante", "Espumante"],
  ]);

  return known.get(normalized) ?? value.trim();
}

function normalizeVarietalName(value: string) {
  const normalized = normalizeImportKey(value);
  const known = new Map([
    ["cabernet suavignon", "Cabernet Sauvignon"],
    ["rose", "Rosé"],
    ["rose champenoise", "Rosé Champenoise"],
  ]);

  return known.get(normalized) ?? value.trim();
}

function splitList(value: string) {
  return value
    .split(/[;,|·•]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function lookupByName(items: WineImportLookup[]) {
  return new Map(items.map((item) => [normalizeImportKey(item.name), item]));
}

function uniqueNames(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = normalizeImportKey(value);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }

  return result;
}

function workbookInput(input: ArrayBuffer | Uint8Array) {
  if (input instanceof ArrayBuffer) {
    return input as unknown as Parameters<ExcelJS.Workbook["xlsx"]["load"]>[0];
  }

  const copy = new Uint8Array(input.byteLength);
  copy.set(input);
  return copy.buffer as unknown as Parameters<ExcelJS.Workbook["xlsx"]["load"]>[0];
}

export async function parseWineImportWorkbook(input: ArrayBuffer | Uint8Array) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(workbookInput(input));

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("El Excel no tiene hojas.");
  }

  const headerByColumn = new Map<number, WineImportColumn>();
  const foundColumns = new Set<WineImportColumn>();

  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const column = HEADER_ALIASES.get(normalizeImportKey(cellText(cell)));
    if (column) {
      headerByColumn.set(columnNumber, column);
      foundColumns.add(column);
    }
  });

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !foundColumns.has(column));
  if (missingColumns.length > 0) {
    throw new Error(
      `Faltan columnas obligatorias: ${missingColumns.map((column) => COLUMN_LABELS[column]).join(", ")}.`,
    );
  }

  const columnIndex = new Map<WineImportColumn, number>();
  for (const [index, column] of headerByColumn.entries()) {
    columnIndex.set(column, index);
  }

  function text(row: ExcelJS.Row, column: WineImportColumn) {
    const index = columnIndex.get(column);
    return index == null ? "" : cellText(row.getCell(index));
  }

  const rows: ParsedWineImportRow[] = [];

  for (let line = 2; line <= sheet.rowCount; line += 1) {
    const row = sheet.getRow(line);
    const values = [...foundColumns].map((column) => text(row, column));

    if (values.every((value) => value === "")) {
      continue;
    }

    const activeText = text(row, "active");
    const description = text(row, "description");
    const featuredText = text(row, "featured");
    const lineName = text(row, "line");
    const lineId = text(row, "lineId");
    const winery = text(row, "winery");
    const typeText = text(row, "type");
    const typeName = typeText ? normalizeWineTypeName(typeText) : "";
    const intensityNames = uniqueNames(splitList(text(row, "profile")));
    const moments = text(row, "moments");
    const imageUrl = text(row, "image");
    const featuredColumnStatus = parseFeaturedColumnStatus(featuredText);
    const explicitActiveValue = activeText ? parseActiveValue(activeText) : featuredColumnStatus;
    const hasExplicitFeatured = featuredText !== "" && featuredColumnStatus == null;

    rows.push({
      active: explicitActiveValue ?? true,
      description: description || null,
      featured: parseBoolean(text(row, "featured")),
      hasExplicitActive: activeText !== "" || featuredColumnStatus != null,
      hasExplicitDescription: description !== "",
      hasExplicitFeatured,
      hasExplicitImage: imageUrl !== "",
      hasExplicitIntensity: intensityNames.length > 0,
      hasExplicitMoments: moments !== "",
      hasExplicitVarietal: lineId !== "",
      hasExplicitWineLine: lineName !== "",
      hasExplicitType: typeName !== "",
      hasExplicitWinery: winery !== "",
      imageUrl: imageUrl || null,
      intensityNames,
      line,
      momentNames: uniqueNames(splitList(moments)),
      name: text(row, "name"),
      priceBox: parseNumber(text(row, "priceBox")),
      priceUnit: parseNumber(text(row, "priceUnit")),
      typeName: typeName || null,
      unitsPerBox: parseInteger(text(row, "unitsPerBox")),
      varietalName: lineId ? normalizeVarietalName(lineId) : null,
      winery: winery || null,
      wineryLineName: lineName || null,
    });
  }

  return { rows };
}

export function buildWineImportPreview(rows: ParsedWineImportRow[], context: PreviewContext): WineImportPreview {
  const existingByName = lookupByName(context.existingWines);
  const intensityByName = lookupByName(context.intensities);
  const momentByName = lookupByName(context.moments);
  const typeByName = lookupByName(context.wineTypes);
  const varietalByName = lookupByName(context.varietals);
  const wineryByName = lookupByName(context.wineries);
  const wineLineByWineryAndName = new Map(
    context.wineLines.map((line) => [`${line.wineryId}:${normalizeImportKey(line.name)}`, line]),
  );
  const seenNames = new Set<string>();

  const previewRows = rows.map<WineImportPreviewRow>((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nameKey = normalizeImportKey(row.name);
    const isDuplicate = Boolean(row.name && seenNames.has(nameKey));

    if (!row.name) {
      errors.push("El nombre del vino es obligatorio.");
    } else if (isDuplicate) {
      warnings.push("Nombre duplicado en el archivo. Se omitira esta fila.");
    }

    if (nameKey) {
      seenNames.add(nameKey);
    }

    const existingWine = existingByName.get(nameKey) ?? null;
    const winery = row.winery ? wineryByName.get(normalizeImportKey(row.winery)) : null;
    const line =
      winery && row.wineryLineName
        ? (wineLineByWineryAndName.get(`${winery.id}:${normalizeImportKey(row.wineryLineName)}`) ?? null)
        : null;
    const varietal = row.varietalName ? (varietalByName.get(normalizeImportKey(row.varietalName)) ?? null) : null;
    if (isDuplicate) {
      return {
        ...row,
        action: "skip",
        errors,
        intensityIds: [],
        missingIntensityNames: [],
        missingMomentNames: [],
        missingTypeName: null,
        missingVarietalName: null,
        missingWineLineName: null,
        missingWineryName: null,
        momentIds: [],
        typeId: null,
        varietalId: null,
        warnings,
        wineId: existingWine?.id ?? null,
        wineLineId: null,
        wineryId: null,
      };
    }

    const type = row.typeName ? typeByName.get(normalizeImportKey(row.typeName)) : null;
    const intensities = row.intensityNames.map((name) => ({
      item: intensityByName.get(normalizeImportKey(name)) ?? null,
      name,
    }));
    const moments = row.momentNames.map((name) => ({
      item: momentByName.get(normalizeImportKey(name)) ?? null,
      name,
    }));

    if (row.wineryLineName && !row.winery) {
      errors.push("La línea de vino requiere una bodega.");
    }

    if (row.typeName && !type) {
      warnings.push(`Se creara el tipo de vino "${row.typeName}".`);
    }

    if (row.winery && !winery) {
      warnings.push(`Se creara la bodega "${row.winery}".`);
    }

    if (row.wineryLineName && !line) {
      warnings.push(`Se creara la línea "${row.wineryLineName}".`);
    }

    if (row.varietalName && !varietal) {
      warnings.push(`Se creara el varietal "${row.varietalName}".`);
    }

    for (const intensity of intensities) {
      if (!intensity.item) {
        warnings.push(`Se creara la intensidad "${intensity.name}".`);
      }
    }

    for (const moment of moments) {
      if (!moment.item) {
        warnings.push(`Se creara el momento "${moment.name}".`);
      }
    }

    if (row.imageUrl && !row.imageUrl.startsWith("https://")) {
      errors.push("La imagen debe ser una URL publica https://.");
    }

    return {
      ...row,
      action: existingWine ? "update" : "create",
      errors,
      intensityIds: intensities.map((intensity) => intensity.item?.id).filter((id): id is string => Boolean(id)),
      missingIntensityNames: intensities
        .filter((intensity) => !intensity.item)
        .map((intensity) => intensity.name),
      missingMomentNames: moments.filter((moment) => !moment.item).map((moment) => moment.name),
      missingTypeName: row.typeName && !type ? row.typeName : null,
      missingVarietalName: row.varietalName && !varietal ? row.varietalName : null,
      missingWineLineName: row.wineryLineName && !line ? row.wineryLineName : null,
      missingWineryName: row.winery && !winery ? row.winery : null,
      momentIds: moments.map((moment) => moment.item?.id).filter((id): id is string => Boolean(id)),
      typeId: type?.id ?? null,
      varietalId: varietal?.id ?? null,
      warnings,
      wineId: existingWine?.id ?? null,
      wineLineId: line?.id ?? null,
      wineryId: winery?.id ?? null,
    };
  });

  const validRows = previewRows.filter((row) => row.errors.length === 0);

  return {
    rows: previewRows,
    summary: {
      creates: validRows.filter((row) => row.action === "create").length,
      errors: previewRows.filter((row) => row.errors.length > 0).length,
      rows: previewRows.length,
      skips: previewRows.filter((row) => row.action === "skip").length,
      updates: validRows.filter((row) => row.action === "update").length,
      warnings: previewRows.filter((row) => row.warnings.length > 0).length,
    },
  };
}
