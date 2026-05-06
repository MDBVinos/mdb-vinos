import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { buildWineImportPreview, parseWineImportWorkbook } from "./importer";

async function workbookBuffer(rows: unknown[][]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Hoja 1");
  rows.forEach((row) => sheet.addRow(row));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

const lookupContext = {
  existingWines: [],
  intensities: [
    { id: "intensity-medio", name: "Medio" },
    { id: "intensity-suave", name: "Suave" },
  ],
  moments: [
    { id: "moment-asado", name: "Asado" },
    { id: "moment-regalo", name: "Regalo" },
  ],
  wineTypes: [
    { id: "type-tinto", name: "Tinto" },
    { id: "type-blanco", name: "Blanco" },
  ],
};

const headers = [
  "name",
  "winery",
  "Precio Venta Unidad",
  "Precio de venta Caja",
  "Unidades x caja",
  "type",
  "profile",
  "moments",
  "image",
  "featured",
];

test("buildWineImportPreview maps a valid workbook row to a create preview", async () => {
  const parsed = await parseWineImportWorkbook(
    await workbookBuffer([
      headers,
      [
        "Estate Malbec",
        "Pascual Toso",
        13700,
        75000,
        6,
        "tinto",
        "Medio",
        "Asado; Regalo",
        "https://example.com/malbec.jpg",
        "si",
      ],
    ]),
  );

  const preview = buildWineImportPreview(parsed.rows, lookupContext);

  assert.equal(preview.summary.creates, 1);
  assert.equal(preview.summary.updates, 0);
  assert.equal(preview.summary.errors, 0);
  assert.equal(preview.rows[0].action, "create");
  assert.deepEqual(preview.rows[0].errors, []);
  assert.equal(preview.rows[0].name, "Estate Malbec");
  assert.equal(preview.rows[0].winery, "Pascual Toso");
  assert.equal(preview.rows[0].priceUnit, 13700);
  assert.equal(preview.rows[0].priceBox, 75000);
  assert.equal(preview.rows[0].unitsPerBox, 6);
  assert.equal(preview.rows[0].typeId, "type-tinto");
  assert.deepEqual(preview.rows[0].intensityIds, ["intensity-medio"]);
  assert.deepEqual(preview.rows[0].momentIds, ["moment-asado", "moment-regalo"]);
  assert.equal(preview.rows[0].imageUrl, "https://example.com/malbec.jpg");
  assert.equal(preview.rows[0].featured, true);
  assert.equal(preview.rows[0].active, true);
});

test("buildWineImportPreview marks existing blank relations as preserved", async () => {
  const parsed = await parseWineImportWorkbook(
    await workbookBuffer([
      headers,
      ["Estate Malbec", "Pascual Toso", 14000, 80000, 6, "Tinto", "", "", "", ""],
    ]),
  );

  const preview = buildWineImportPreview(parsed.rows, {
    ...lookupContext,
    existingWines: [{ id: "wine-existing", name: "estate malbec" }],
  });

  assert.equal(preview.summary.creates, 0);
  assert.equal(preview.summary.updates, 1);
  assert.equal(preview.summary.errors, 0);
  assert.equal(preview.rows[0].action, "update");
  assert.equal(preview.rows[0].wineId, "wine-existing");
  assert.equal(preview.rows[0].hasExplicitImage, false);
  assert.equal(preview.rows[0].hasExplicitIntensity, false);
  assert.equal(preview.rows[0].hasExplicitMoments, false);
});

test("parseWineImportWorkbook accepts workbook data without an image column", async () => {
  const parsed = await parseWineImportWorkbook(
    await workbookBuffer([
      [
        "name",
        "winery",
        "Precio Venta Unidad",
        "Precio de venta Caja",
        "Unidades x caja",
        "type",
        "profile",
        "moments",
        "featured",
        "Descripcion",
      ],
      [
        "Estate Malbec",
        "Pascual Toso",
        13700,
        75000,
        6,
        "Tinto",
        "Frutal · Suave",
        "Asado · Almuerzo Relax",
        "Activo",
        "Malbec mendocino de entrada accesible.",
      ],
    ]),
  );

  assert.equal(parsed.rows[0].description, "Malbec mendocino de entrada accesible.");
  assert.equal(parsed.rows[0].hasExplicitImage, false);
  assert.equal(parsed.rows[0].imageUrl, null);
  assert.equal(parsed.rows[0].active, true);
  assert.equal(parsed.rows[0].featured, false);
  assert.equal(parsed.rows[0].hasExplicitActive, true);
  assert.equal(parsed.rows[0].hasExplicitFeatured, false);
  assert.deepEqual(parsed.rows[0].intensityNames, ["Frutal", "Suave"]);
  assert.deepEqual(parsed.rows[0].momentNames, ["Asado", "Almuerzo Relax"]);
});

test("buildWineImportPreview warns about lookup values that will be created", async () => {
  const parsed = await parseWineImportWorkbook(
    await workbookBuffer([
      [
        "name",
        "winery",
        "Precio Venta Unidad",
        "Precio de venta Caja",
        "Unidades x caja",
        "type",
        "profile",
        "moments",
        "featured",
      ],
      [
        "Estate Malbec",
        "Pascual Toso",
        13700,
        75000,
        6,
        "Tinto",
        "Frutal · Suave",
        "Asado · Almuerzo Relax",
        "Activo",
      ],
    ]),
  );

  const preview = buildWineImportPreview(parsed.rows, lookupContext);

  assert.equal(preview.summary.errors, 0);
  assert.equal(preview.summary.warnings, 1);
  assert.deepEqual(preview.rows[0].intensityIds, ["intensity-suave"]);
  assert.deepEqual(preview.rows[0].momentIds, ["moment-asado"]);
  assert.deepEqual(preview.rows[0].missingIntensityNames, ["Frutal"]);
  assert.deepEqual(preview.rows[0].missingMomentNames, ["Almuerzo Relax"]);
  assert.deepEqual(preview.rows[0].warnings, [
    'Se creara la intensidad "Frutal".',
    'Se creara el momento "Almuerzo Relax".',
  ]);
});

test("buildWineImportPreview reports unknown wine types and skips duplicate names", async () => {
  const parsed = await parseWineImportWorkbook(
    await workbookBuffer([
      headers,
      ["Estate Malbec", "Pascual Toso", 13700, 75000, 6, "Naranja", "", "Asado", "", ""],
      ["estate malbec", "Pascual Toso", 13700, 75000, 6, "Tinto", "Potente", "", "", ""],
    ]),
  );

  const preview = buildWineImportPreview(parsed.rows, lookupContext);

  assert.equal(preview.summary.errors, 1);
  assert.equal(preview.summary.skips, 1);
  assert.equal(preview.summary.warnings, 1);
  assert.deepEqual(preview.rows[0].errors, ['Tipo de vino desconocido: "Naranja".']);
  assert.equal(preview.rows[1].action, "skip");
  assert.deepEqual(preview.rows[1].errors, []);
  assert.deepEqual(preview.rows[1].missingIntensityNames, []);
  assert.deepEqual(preview.rows[1].warnings, ["Nombre duplicado en el archivo. Se omitira esta fila."]);
});
