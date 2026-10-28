import { Braces, Cloud, Database, Globe, Server, ShieldCheck } from "lucide-react";
import { describe, expect, it } from "vitest";
import { resolveTechnicalAreaIcon } from "./technical-area-icon";

describe("resolveTechnicalAreaIcon", () => {
  it.each([
    ["Backend", Server],
    ["Frontend", Globe],
    ["Bases de datos", Database],
    ["Cloud", Cloud],
    ["QA", ShieldCheck],
    ["Categoría nueva", Braces],
  ])("uses the catalog name for %s", (name, icon) => {
    expect(resolveTechnicalAreaIcon(name)).toBe(icon);
  });
});
