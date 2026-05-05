import ExcelJS from "exceljs";

export type WineImportLookup = {
  id: string;
  name: string;
};

export type ParsedWineImportRow = {
  featured: boolean;
  hasExplicitImage: boolean;
  hasExplicitIntensity: boolean;
  hasExplicitMoments: boolean;
  hasExplicitType: boolean;
  imageUrl: string | null;
  intensityName: string | null;
  line: number;
  momentNames: string[];
  name: string;
  priceBox: number | null;
  priceUnit: number | null;
  typeName: string | null;
  unitsPerBox: number | null;
  winery: string | null;
};

export type WineImportPreviewRow = ParsedWineImportRow & {
  action: "create" | "update";
  errors: string[];
  intensityId: string | null;
  momentIds: string[];
  typeId: string | null;
  warnings: string[];
  wineId: string | null;
};

export type WineImportPreview = {
  rows: WineImportPreviewRow[];
  summary: {
    creates: number;
    errors: number;
    rows: number;
    updates: number;
    warnings: number;
  };
};

type WineImportColumn =
  | "featured"
  | "image"
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
  wineTypes: WineImportLookup[];
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
  "image",
  "featured",
];

const COLUMN_LABELS: Record<WineImportColumn, string> = {
  featured: "featured",
  image: "image",
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
    ["featured", "featured"],
    ["destacado", "featured"],
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

function splitList(value: string) {
  return value
    .split(/[;,|]/)
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
    const values = REQUIRED_COLUMNS.map((column) => text(row, column));

    if (values.every((value) => value === "")) {
      continue;
    }

    const typeName = text(row, "type");
    const intensityName = text(row, "profile");
    const moments = text(row, "moments");
    const imageUrl = text(row, "image");

    rows.push({
      featured: parseBoolean(text(row, "featured")),
      hasExplicitImage: imageUrl !== "",
      hasExplicitIntensity: intensityName !== "",
      hasExplicitMoments: moments !== "",
      hasExplicitType: typeName !== "",
      imageUrl: imageUrl || null,
      intensityName: intensityName || null,
      line,
      momentNames: uniqueNames(splitList(moments)),
      name: text(row, "name"),
      priceBox: parseNumber(text(row, "priceBox")),
      priceUnit: parseNumber(text(row, "priceUnit")),
      typeName: typeName || null,
      unitsPerBox: parseInteger(text(row, "unitsPerBox")),
      winery: text(row, "winery") || null,
    });
  }

  return { rows };
}

export function buildWineImportPreview(rows: ParsedWineImportRow[], context: PreviewContext): WineImportPreview {
  const existingByName = lookupByName(context.existingWines);
  const intensityByName = lookupByName(context.intensities);
  const momentByName = lookupByName(context.moments);
  const typeByName = lookupByName(context.wineTypes);
  const seenNames = new Set<string>();

  const previewRows = rows.map<WineImportPreviewRow>((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nameKey = normalizeImportKey(row.name);

    if (!row.name) {
      errors.push("El nombre del vino es obligatorio.");
    } else if (seenNames.has(nameKey)) {
      errors.push("Nombre duplicado en el archivo.");
    }

    if (nameKey) {
      seenNames.add(nameKey);
    }

    const existingWine = existingByName.get(nameKey) ?? null;
    const type = row.typeName ? typeByName.get(normalizeImportKey(row.typeName)) : null;
    const intensity = row.intensityName ? intensityByName.get(normalizeImportKey(row.intensityName)) : null;
    const moments = row.momentNames.map((name) => ({
      item: momentByName.get(normalizeImportKey(name)) ?? null,
      name,
    }));

    if (row.typeName && !type) {
      errors.push(`Tipo de vino desconocido: "${row.typeName}".`);
    }

    if (row.intensityName && !intensity) {
      errors.push(`Intensidad desconocida: "${row.intensityName}".`);
    }

    for (const moment of moments) {
      if (!moment.item) {
        errors.push(`Momento desconocido: "${moment.name}".`);
      }
    }

    if (row.imageUrl && !row.imageUrl.startsWith("https://")) {
      errors.push("La imagen debe ser una URL publica https://.");
    }

    return {
      ...row,
      action: existingWine ? "update" : "create",
      errors,
      intensityId: intensity?.id ?? null,
      momentIds: moments.map((moment) => moment.item?.id).filter((id): id is string => Boolean(id)),
      typeId: type?.id ?? null,
      warnings,
      wineId: existingWine?.id ?? null,
    };
  });

  const validRows = previewRows.filter((row) => row.errors.length === 0);

  return {
    rows: previewRows,
    summary: {
      creates: validRows.filter((row) => row.action === "create").length,
      errors: previewRows.filter((row) => row.errors.length > 0).length,
      rows: previewRows.length,
      updates: validRows.filter((row) => row.action === "update").length,
      warnings: previewRows.filter((row) => row.warnings.length > 0).length,
    },
  };
}
