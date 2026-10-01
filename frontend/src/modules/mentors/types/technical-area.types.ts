export type TechnicalArea = {
  id: number;
  name: string;
  description: string;
};

export type TechnicalAreasViewProps = {
  mode: "register" | "edit";
};