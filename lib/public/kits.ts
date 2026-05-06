export type KitDefinition = {
  slug: "asado" | "cita" | "regalo";
  title: string;
  oneLiner: string;
  pitch: string;
  momentName: "Asado" | "Cita" | "Regalo";
  count: number;
};

export const KITS: KitDefinition[] = [
  {
    slug: "asado",
    title: "Kit Asado MDB",
    oneLiner: "Tres tintos con cuerpo para una parrilla larga.",
    pitch: "Tinto que aguanta el chori, el vacio y la sobremesa. Sin pensarlo.",
    momentName: "Asado",
    count: 3,
  },
  {
    slug: "cita",
    title: "Kit Cita Perfecta",
    oneLiner: "Dos botellas para arrancar suave y terminar bien.",
    pitch: "Algo facil de tomar, lindo de mostrar y con buena primera impresion.",
    momentName: "Cita",
    count: 2,
  },
  {
    slug: "regalo",
    title: "Kit Regalo Seguro",
    oneLiner: "Tres etiquetas que quedan bien con cualquiera.",
    pitch: "Para cumple, asado en casa ajena o gracias a tu jefe. No falla.",
    momentName: "Regalo",
    count: 3,
  },
];
