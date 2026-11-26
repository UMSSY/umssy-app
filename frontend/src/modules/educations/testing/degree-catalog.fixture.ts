import type { EducationDegreeCatalogEntry } from "../types/education-degree-catalog-entry.types";

export const DEGREE_CATALOG_FIXTURE: EducationDegreeCatalogEntry[] = [
  {
    institution: "Universidad Mayor de San Simón (UMSS)",
    sources: [],
    degrees: [
      {
        name: "Ingeniería Informática",
        aliases: ["Ingeniería en Informática", "Ingeniería de Informática"],
      },
      { name: "Ingeniería de Sistemas", aliases: ["Ingeniería en Sistemas"] },
      { name: "Ingeniería Civil", aliases: [] },
      { name: "Ingeniería Química", aliases: [] },
      { name: "Ingeniería Electromecánica", aliases: [] },
    ],
  },
  {
    institution: "Universidad Privada Boliviana (UPB)",
    sources: [],
    degrees: [
      { name: "Ingeniería Civil", aliases: [] },
      { name: "Ingeniería Electromecánica", aliases: [] },
      {
        name: "Ingeniería en Inteligencia Artificial",
        aliases: ["Ingeniería de Inteligencia Artificial"],
      },
    ],
  },
  {
    institution:
      "Universidad Privada de Ciencias Administrativas y Tecnológicas (UCATEC)",
    sources: [],
    degrees: [{ name: "Ingeniería de Sistemas", aliases: [] }],
  },
];
