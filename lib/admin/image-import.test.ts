import assert from "node:assert/strict";
import test from "node:test";
import { validateWineImageImportRows } from "./image-import";

const wines = [
  { id: "wine-empty", name: "Estate Malbec", imageUrl: null },
  { id: "wine-image", name: "Estate Cabernet", imageUrl: "https://example.com/cabernet.jpg" },
];

test("validateWineImageImportRows accepts complete manual mappings", () => {
  const result = validateWineImageImportRows(
    [
      {
        file: new File(["image"], "malbec.jpg", { type: "image/jpeg" }),
        replaceExisting: false,
        wineId: "wine-empty",
      },
      {
        file: new File(["image"], "cabernet.png", { type: "image/png" }),
        replaceExisting: true,
        wineId: "wine-image",
      },
    ],
    wines,
  );

  assert.equal(result.errors.length, 0);
  assert.equal(result.rows.length, 2);
});

test("validateWineImageImportRows reports missing, duplicate, non-image, and unconfirmed replacements", () => {
  const result = validateWineImageImportRows(
    [
      {
        file: new File(["image"], "malbec.jpg", { type: "image/jpeg" }),
        replaceExisting: false,
        wineId: "wine-empty",
      },
      {
        file: new File(["image"], "duplicate.jpg", { type: "image/jpeg" }),
        replaceExisting: false,
        wineId: "wine-empty",
      },
      {
        file: new File(["text"], "notes.txt", { type: "text/plain" }),
        replaceExisting: false,
        wineId: "wine-image",
      },
      {
        file: new File(["image"], "cabernet.webp", { type: "image/webp" }),
        replaceExisting: false,
        wineId: "wine-image",
      },
      {
        file: new File(["image"], "missing.jpg", { type: "image/jpeg" }),
        replaceExisting: false,
        wineId: "",
      },
    ],
    wines,
  );

  assert.deepEqual(result.errors, [
    'La imagen "duplicate.jpg" usa un vino repetido.',
    'El archivo "notes.txt" no es una imagen valida.',
    'Estate Cabernet ya tiene imagen. Confirmá reemplazarla para subir "notes.txt".',
    'La imagen "cabernet.webp" usa un vino repetido.',
    'Estate Cabernet ya tiene imagen. Confirmá reemplazarla para subir "cabernet.webp".',
    'Seleccioná un vino para "missing.jpg".',
  ]);
});
