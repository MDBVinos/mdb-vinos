export type WineImageImportOption = {
  id: string;
  imageUrl: string | null;
  name: string;
};

export type WineImageImportInputRow = {
  file: File;
  replaceExisting: boolean;
  wineId: string;
};

export type WineImageImportValidationRow = WineImageImportInputRow & {
  wine: WineImageImportOption;
};

export function validateWineImageImportRows(rows: WineImageImportInputRow[], wines: WineImageImportOption[]) {
  const errors: string[] = [];
  const validRows: WineImageImportValidationRow[] = [];
  const wineById = new Map(wines.map((wine) => [wine.id, wine]));
  const seenWineIds = new Set<string>();

  for (const row of rows) {
    if (!row.wineId) {
      errors.push(`Seleccioná un vino para "${row.file.name}".`);
      continue;
    }

    const wine = wineById.get(row.wineId);
    if (!wine) {
      errors.push(`El vino seleccionado para "${row.file.name}" no existe.`);
      continue;
    }

    if (seenWineIds.has(row.wineId)) {
      errors.push(`La imagen "${row.file.name}" usa un vino repetido.`);
    } else {
      seenWineIds.add(row.wineId);
    }

    if (row.file.size === 0 || !row.file.type.startsWith("image/")) {
      errors.push(`El archivo "${row.file.name}" no es una imagen valida.`);
    }

    if (wine.imageUrl && !row.replaceExisting) {
      errors.push(`${wine.name} ya tiene imagen. Confirmá reemplazarla para subir "${row.file.name}".`);
    }

    validRows.push({ ...row, wine });
  }

  return {
    errors,
    rows: errors.length === 0 ? validRows : [],
  };
}
