// @vitest-environment node
import { describe, expectTypeOf, it } from "vitest";

import type { Registration } from "@/modules/registrations";
import type { registrationsService } from "../services/registrations.service";
import type { offlinePassesStore } from "../utils/offline-passes-store";
import type { OfflinePass } from "./offline-pass.types";
import type { OfflinePassesSnapshot } from "./offline-passes-snapshot.types";
import type { OfflinePassesStore } from "./offline-passes-store.types";
import type { PassData } from "./pass-data.types";

type ServerPass = Awaited<ReturnType<typeof registrationsService.getPass>>;

describe("contrato de pases sin conexión", () => {
  it("guarda exactamente los datos del pase que entrega el servidor", () => {
    expectTypeOf<OfflinePass>().toEqualTypeOf<PassData>();
    expectTypeOf<ServerPass>().toEqualTypeOf<OfflinePass>();
  });

  it("mantiene la copia ligada a un usuario y con fecha de guardado", () => {
    expectTypeOf<OfflinePassesSnapshot>().toEqualTypeOf<{
      userId: string;
      savedAt: string;
      passes: OfflinePass[];
    }>();
  });

  it("exige el usuario para leer, guardar y borrar la copia", () => {
    expectTypeOf<OfflinePassesStore["load"]>().parameters.toEqualTypeOf<[userId: string]>();
    expectTypeOf<OfflinePassesStore["load"]>().returns.toEqualTypeOf<Promise<OfflinePassesSnapshot | null>>();
    expectTypeOf<OfflinePassesStore["save"]>().parameters.toEqualTypeOf<[userId: string, passes: OfflinePass[]]>();
    expectTypeOf<OfflinePassesStore["clearUser"]>().parameters.toEqualTypeOf<[userId: string]>();
    expectTypeOf<OfflinePassesStore["clearAll"]>().parameters.toEqualTypeOf<[]>();
    expectTypeOf<typeof offlinePassesStore>().toEqualTypeOf<OfflinePassesStore>();
  });

  it("distingue la ubicación nula del pase de la ubicación siempre textual de la lista", () => {
    expectTypeOf<OfflinePass["location"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Registration["location"]>().toEqualTypeOf<string>();
  });

  it("no guarda datos de la inscripción que no hacen falta sin conexión", () => {
    expectTypeOf<OfflinePass>().not.toHaveProperty("eventId");
    expectTypeOf<OfflinePass>().not.toHaveProperty("registeredAt");
    expectTypeOf<OfflinePass>().not.toHaveProperty("cancelledAt");
  });
});
