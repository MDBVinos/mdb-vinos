import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autorizado", { status: 401 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Vinos");
  sheet.columns = [
    { header: "name", key: "name", width: 28 },
    { header: "winery", key: "winery", width: 22 },
    { header: "winery line", key: "wineLine", width: 24 },
    { header: "Line ID", key: "lineId", width: 22 },
    { header: "Precio Venta Unidad", key: "priceUnit", width: 20 },
    { header: "Precio de venta Caja", key: "priceBox", width: 22 },
    { header: "Unidades x caja", key: "unitsPerBox", width: 18 },
    { header: "type", key: "type", width: 16 },
    { header: "profile", key: "profile", width: 18 },
    { header: "moments", key: "moments", width: 28 },
    { header: "description", key: "description", width: 44 },
    { header: "image", key: "image", width: 36 },
    { header: "active", key: "active", width: 12 },
    { header: "featured", key: "featured", width: 12 },
  ];

  sheet.addRows([
    {
      active: "true",
      description: "Descripcion breve para mostrar en catalogo.",
      featured: "false",
      image: "https://ejemplo.com/imagen-vino.jpg",
      lineId: "Malbec",
      moments: "Asado, Cena",
      name: "Ejemplo Malbec",
      priceBox: 65000,
      priceUnit: 11000,
      profile: "Frutal",
      type: "Tinto",
      unitsPerBox: 6,
      winery: "Bodega ejemplo",
      wineLine: "Linea ejemplo",
    },
    {
      active: "true",
      description: "Otra descripcion breve.",
      featured: "true",
      image: "",
      lineId: "Chardonnay",
      moments: "Pescado, Almuerzo",
      name: "Ejemplo Chardonnay",
      priceBox: 54000,
      priceUnit: 9500,
      profile: "Suave",
      type: "Blanco",
      unitsPerBox: 6,
      winery: "Bodega ejemplo",
      wineLine: "Reserva",
    },
  ]);

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Disposition": 'attachment; filename="mdb-vinos-ejemplo-importacion.xlsx"',
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
