import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResponse, PaginatedData } from "@/shared/types/api-response.types";
import * as downloadFileModule from "@/shared/utils/download-file";
import { reportsService } from "../services/reports.service";
import type { AcademicPeriod, RegisteredUser, UserType } from "../types/registered-user.types";
import { RegisteredUsersReportView } from "./registered-users-report-view";

const REGISTERED_USERS: RegisteredUser[] = [
  { id: "1", fullName: "Juan Carlos Peres Rojas", email: "jc.peraz@gmail.com", userType: "DEGREE_HOLDER", identifier: "201942394", documentType: "ACADEMIC_DEGREE", registeredAt: "2026-03-15T10:00:00" },
  { id: "2", fullName: "Maria Quispe Mamani", email: "maria.qui@gmail.com", userType: "DEGREE_HOLDER", identifier: "201902277", documentType: "NATIONAL_DEGREE", registeredAt: "2026-02-20T10:00:00" },
  { id: "3", fullName: "Luis Fernando Vargaz Saliz", email: "lf.vargas.ct@gmail.com", userType: "STUDENT", identifier: "201701190", documentType: "ENROLLMENT_CERTIFICATE", registeredAt: "2025-01-10T10:00:00" },
  { id: "4", fullName: "Andrea Camacho Torrez", email: "andrea.ct@gmail.com", userType: "STUDENT", identifier: "201905853", documentType: "ENROLLMENT_CERTIFICATE", registeredAt: "2025-01-10T10:00:00" },
  { id: "5", fullName: "Rodrigo Gutiérrez Arce", email: "r.rutiereer@outlook.com", userType: "DEGREE_HOLDER", identifier: "201603348", documentType: "NATIONAL_DEGREE", registeredAt: "2025-01-10T10:00:00" },
  { id: "6", fullName: "Sofia Fernandez Claras", email: "sofia.fo@gmail.com", userType: "DEGREE_HOLDER", identifier: "201909731", documentType: "ACADEMIC_DIPLOMA", registeredAt: "2025-01-10T10:00:00" },
  { id: "7", fullName: "Diego Mercado Rocha", email: "dmercado@gmail.com", userType: "COMPANY", identifier: "1029964756", documentType: "NIT", registeredAt: "2025-01-10T10:00:00" },
  { id: "8", fullName: "Valeria Amez Lima", email: "vale.amez@gmail.com", userType: "ADMIN", identifier: "201902214", documentType: "ACADEMIC_DIPLOMA", registeredAt: "2026-03-15T10:00:00" },
  { id: "9", fullName: "Stephanie Mamani Choque", email: "stephanie.mamani@gmail.com", userType: "DEGREE_HOLDER", identifier: "202004667", documentType: "NATIONAL_DEGREE", registeredAt: "2026-03-15T10:00:00" },
  { id: "10", fullName: "Carlos Rivera Quispe", email: "carlos.rivera@gmail.com", userType: "STUDENT", identifier: "201702345", documentType: "ENROLLMENT_CERTIFICATE", registeredAt: "2026-03-15T10:00:00" },
  { id: "11", fullName: "Ana Lucia Rojas Vera", email: "ana.rojas@gmail.com", userType: "STUDENT", identifier: "201801122", documentType: "ENROLLMENT_CERTIFICATE", registeredAt: "2025-11-04T10:00:00" },
  { id: "12", fullName: "Marco Antonio Flores Paz", email: "marco.flores@gmail.com", userType: "DEGREE_HOLDER", identifier: "201604587", documentType: "ACADEMIC_DEGREE", registeredAt: "2025-10-22T10:00:00" },
  { id: "13", fullName: "Tecnologías Andinas SRL", email: "rrhh@tecandinas.com", userType: "COMPANY", identifier: "3012457018", documentType: "NIT", registeredAt: "2025-10-15T10:00:00" },
  { id: "14", fullName: "Gabriela Soliz Arnez", email: "gabriela.soliz@gmail.com", userType: "MENTOR", identifier: "201903318", documentType: "ACADEMIC_DEGREE", registeredAt: "2025-09-30T10:00:00" },
  { id: "15", fullName: "Jorge Luis Céspedes Ortiz", email: "jl.cespedes@outlook.com", userType: "DEGREE_HOLDER", identifier: "201505976", documentType: "NATIONAL_DEGREE", registeredAt: "2025-09-12T10:00:00" },
  { id: "16", fullName: "Paola Andrea Guzmán Ríos", email: "paola.guzman@gmail.com", userType: "DEGREE_HOLDER", identifier: "201806641", documentType: "ACADEMIC_DEGREE", registeredAt: "2025-08-28T10:00:00" },
  { id: "17", fullName: "Innova Soft SA", email: "contacto@innovasoft.bo", userType: "COMPANY", identifier: "2098754013", documentType: "NIT", registeredAt: "2025-08-14T10:00:00" },
  { id: "18", fullName: "Ricardo Montaño Vidal", email: "ricardo.montano@gmail.com", userType: "STUDENT", identifier: "202001459", documentType: "ENROLLMENT_CERTIFICATE", registeredAt: "2025-07-30T10:00:00" },
  { id: "19", fullName: "Daniela Ugarte Salas", email: "daniela.ugarte@gmail.com", userType: "ADMIN", identifier: "201707783", documentType: "ACADEMIC_DEGREE", registeredAt: "2025-07-02T10:00:00" },
  { id: "20", fullName: "Fernando Aguilar Terán", email: "f.aguilar@gmail.com", userType: "DEGREE_HOLDER", identifier: "201408812", documentType: "NATIONAL_DEGREE", registeredAt: "2025-06-18T10:00:00" },
  { id: "21", fullName: "Lucía Herrera Pinto", email: "lucia.herrera@gmail.com", userType: "MENTOR", identifier: "202102204", documentType: "ACADEMIC_DEGREE", registeredAt: "2025-05-27T10:00:00" },
  { id: "22", fullName: "Mauricio Zeballos Durán", email: "mauricio.z@outlook.com", userType: "DEGREE_HOLDER", identifier: "201609935", documentType: "ACADEMIC_DEGREE", registeredAt: "2025-05-06T10:00:00" },
  { id: "23", fullName: "Datalab Bolivia SRL", email: "info@datalab.bo", userType: "COMPANY", identifier: "4015862011", documentType: "NIT", registeredAt: "2025-04-15T10:00:00" },
  { id: "24", fullName: "Camila Vargas Orellana", email: "camila.vargas@gmail.com", userType: "STUDENT", identifier: "202003376", documentType: "ENROLLMENT_CERTIFICATE", registeredAt: "2025-03-20T10:00:00" },
];

// "I-2025" agrupa enero a junio y "II-2025" julio a diciembre.
function getPeriod(registeredAt: string): AcademicPeriod {
  const [year, month] = registeredAt.split("-");
  return `${Number(month) <= 6 ? "I" : "II"}-${Number(year)}`;
}

function buildResponse(
  page: number,
  limit: number,
  userType?: UserType,
  period?: AcademicPeriod,
  users: RegisteredUser[] = REGISTERED_USERS,
): ApiResponse<PaginatedData<RegisteredUser>> {
  const filteredUsers = users.filter(
    (user) =>
      (!userType || user.userType === userType) && (!period || getPeriod(user.registeredAt) === period),
  );
  const offset = (page - 1) * limit;

  return {
    statusCode: 200,
    data: { items: filteredUsers.slice(offset, offset + limit), totalItems: filteredUsers.length },
    page,
    detail: "Usuarios registrados obtenidos correctamente",
    ok: true,
  };
}

async function renderLoadedView() {
  render(<RegisteredUsersReportView />);
  await waitFor(() => {
    expect(screen.getByText("Juan Carlos Peres Rojas")).toBeDefined();
  });
}

// El Select de shadcn responde a eventos de puntero reales: se usa user-event.
async function selectUserType(user: UserEvent, label: string) {
  await user.click(screen.getByRole("combobox", { name: "Tipo de usuario" }));
  await user.click(await screen.findByRole("option", { name: label }));
}

describe("RegisteredUsersReportView", () => {
  beforeEach(() => {
    vi.spyOn(reportsService, "getRegisteredUsers").mockImplementation(async ({ page, limit, userType, period }) =>
      buildResponse(page, limit, userType, period),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("muestra el título, los botones y la primera página de usuarios", async () => {
    render(<RegisteredUsersReportView />);

    expect(screen.getByRole("heading", { name: "Reporte de usuarios registrados" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Exportar CSV" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Gestión" })).toBeDefined();
    expect(screen.getByRole("button", { name: "actualizar" })).toBeDefined();
    expect(screen.getByText("Cargando usuarios...")).toBeDefined();
    expect(screen.getAllByTestId("skeleton-row")).toHaveLength(10);

    await waitFor(() => {
      expect(screen.getByText("Juan Carlos Peres Rojas")).toBeDefined();
    });
    expect(screen.getByText("jc.peraz@gmail.com")).toBeDefined();
    expect(screen.getAllByText("Título académico").length).toBeGreaterThan(0);
    expect(screen.getAllByText("15/03/2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Mostrando 1-10 de 24 usuarios")).toBeDefined();
    expect(screen.getByRole("button", { name: "Página 3" })).toBeDefined();
  });

  it("ofrece las opciones de tipo de usuario en orden", async () => {
    render(<RegisteredUsersReportView />);

    expect(screen.queryByRole("listbox")).toBeNull();
    await userEvent.setup().click(screen.getByRole("combobox", { name: "Tipo de usuario" }));

    await screen.findByRole("listbox");
    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual(["Todos", "Estudiante", "Titulado", "Mentor", "Empresa", "Administrador"]);
  });

  it("vuelve a cargar los datos al presionar actualizar", async () => {
    const getRegisteredUsersSpy = vi.spyOn(reportsService, "getRegisteredUsers");
    await renderLoadedView();

    fireEvent.click(screen.getByRole("button", { name: "actualizar" }));

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "actualizar" }).disabled).toBe(true);
    await waitFor(() => {
      expect(screen.getByText("Juan Carlos Peres Rojas")).toBeDefined();
    });
    expect(getRegisteredUsersSpy).toHaveBeenCalledTimes(2);
  });

  it("navega a la última página", async () => {
    await renderLoadedView();

    fireEvent.click(screen.getByRole("button", { name: "Página 3" }));

    await waitFor(() => {
      expect(screen.getByText("Camila Vargas Orellana")).toBeDefined();
    });
    expect(screen.getByText("Mostrando 21-24 de 24 usuarios")).toBeDefined();
  });

  it("filtra por tipo de usuario y vuelve a la primera página", async () => {
    const user = userEvent.setup();
    await renderLoadedView();

    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    await waitFor(() => {
      expect(screen.getByText("Mostrando 11-20 de 24 usuarios")).toBeDefined();
    });

    await selectUserType(user, "Empresa");

    await waitFor(() => {
      expect(screen.getByText("Mostrando 1-4 de 4 usuarios")).toBeDefined();
    });
    expect(screen.getByText("Diego Mercado Rocha")).toBeDefined();
    expect(screen.queryByText("Juan Carlos Peres Rojas")).toBeNull();
    expect(screen.getByRole("combobox", { name: "Tipo de usuario" }).textContent).toContain("Empresa");

    await selectUserType(user, "Mentor");
    await waitFor(() => {
      expect(screen.getByText("Mostrando 1-2 de 2 usuarios")).toBeDefined();
    });
    expect(screen.getByText("Gabriela Soliz Arnez")).toBeDefined();

    await selectUserType(user, "Todos");
    await waitFor(() => {
      expect(screen.getByText("Mostrando 1-10 de 24 usuarios")).toBeDefined();
    });
  });

  it("maneja el filtro con el teclado y lo cierra con Escape o al hacer clic afuera", async () => {
    const user = userEvent.setup();
    await renderLoadedView();
    const combobox = screen.getByRole("combobox", { name: "Tipo de usuario" });

    combobox.focus();
    await user.keyboard("{ArrowDown}");
    expect(await screen.findByRole("listbox")).toBeDefined();
    await user.keyboard("{ArrowDown}{Enter}");

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
    await waitFor(() => {
      expect(combobox.textContent).toContain("Estudiante");
    });

    await user.click(combobox);
    expect(await screen.findByRole("listbox")).toBeDefined();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });

    await user.click(combobox);
    expect(await screen.findByRole("listbox")).toBeDefined();
    await user.click(document.body);
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });

  it("no vuelve a consultar si se elige la misma opción", async () => {
    const user = userEvent.setup();
    const getRegisteredUsersSpy = vi.spyOn(reportsService, "getRegisteredUsers");
    await renderLoadedView();

    await selectUserType(user, "Todos");

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).toBeNull();
    });
    expect(getRegisteredUsersSpy).toHaveBeenCalledTimes(1);
  });

  it("muestra un mensaje cuando no hay usuarios", async () => {
    vi.spyOn(reportsService, "getRegisteredUsers").mockResolvedValueOnce({
      statusCode: 200,
      data: { items: [], totalItems: 0 },
      detail: "Sin datos",
      ok: true,
    });

    render(<RegisteredUsersReportView />);

    await waitFor(() => {
      expect(screen.getByText("No hay usuarios registrados para este filtro.")).toBeDefined();
    });
    expect(screen.getByText("Mostrando 0-0 de 0 usuarios")).toBeDefined();
  });

  it("muestra un mensaje de error si falla la carga", async () => {
    vi.spyOn(reportsService, "getRegisteredUsers").mockRejectedValueOnce(new Error("Network error"));

    render(<RegisteredUsersReportView />);

    await waitFor(() => {
      expect(screen.getByText("No se pudo cargar el reporte de usuarios registrados.")).toBeDefined();
    });
  });

  it("exporta en CSV los usuarios del filtro seleccionado y descarga el archivo", async () => {
    const user = userEvent.setup();
    const file = new Blob(["Usuario"], { type: "text/csv" });
    let resolveExport: (value: { file: Blob; fileName: string }) => void = () => undefined;
    const exportSpy = vi.spyOn(reportsService, "exportRegisteredUsersCsv").mockImplementationOnce(
      () => new Promise((resolve) => (resolveExport = resolve)),
    );
    const downloadSpy = vi.spyOn(downloadFileModule, "downloadFile").mockImplementation(() => undefined);
    await renderLoadedView();
    await selectUserType(user, "Empresa");

    await user.click(screen.getByRole("button", { name: "Exportar CSV" }));

    const exportingButton = screen.getByRole("button", { name: "Exportando..." }) as HTMLButtonElement;
    expect(exportingButton.disabled).toBe(true);
    expect(exportSpy).toHaveBeenCalledWith({ userType: "COMPANY" });

    resolveExport({ file, fileName: "usuarios-registrados-2026-10-03.csv" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Exportar CSV" })).toBeDefined();
    });
    expect(downloadSpy).toHaveBeenCalledWith(file, "usuarios-registrados-2026-10-03.csv");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText("La exportación de la tabla ha sido un éxito")).toBeDefined();
  });

  it("muestra un mensaje si falla la exportación", async () => {
    vi.spyOn(reportsService, "exportRegisteredUsersCsv").mockRejectedValueOnce(new Error("Network error"));
    const downloadSpy = vi.spyOn(downloadFileModule, "downloadFile");
    await renderLoadedView();

    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));

    expect((await screen.findByRole("alert")).textContent).toBe("No se pudo exportar el reporte. Inténtalo de nuevo.");
    expect(downloadSpy).not.toHaveBeenCalled();
    expect(screen.queryByText("La exportación de la tabla ha sido un éxito")).toBeNull();
  });

  it("filtra por gestión desde el botón Gestión y vuelve a la primera página", async () => {
    const user = userEvent.setup();
    await renderLoadedView();
    await user.click(screen.getByRole("button", { name: "Página 2" }));
    await waitFor(() => {
      expect(screen.getByText("Mostrando 11-20 de 24 usuarios")).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "Gestión" }));
    await user.click(screen.getByRole("menuitemradio", { name: "II-2025" }));

    await waitFor(() => {
      expect(screen.getByText("Mostrando 1-9 de 9 usuarios")).toBeDefined();
    });
    expect(screen.getByRole("button", { name: "Gestión II-2025" })).toBeDefined();
    expect(screen.getByText("Ana Lucia Rojas Vera")).toBeDefined();
    expect(screen.queryByText("Juan Carlos Peres Rojas")).toBeNull();
    expect(reportsService.getRegisteredUsers).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      userType: undefined,
      period: "II-2025",
    });

    fireEvent.click(screen.getByRole("button", { name: "Gestión II-2025" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Todas" }));

    await waitFor(() => {
      expect(screen.getByText("Mostrando 1-10 de 24 usuarios")).toBeDefined();
    });
    expect(screen.getByRole("button", { name: "Gestión" })).toBeDefined();
  });

  it("combina la gestión con el tipo de usuario y la usa al exportar", async () => {
    const user = userEvent.setup();
    const exportSpy = vi
      .spyOn(reportsService, "exportRegisteredUsersCsv")
      .mockResolvedValueOnce({ file: new Blob([]), fileName: "usuarios-registrados.csv" });
    vi.spyOn(downloadFileModule, "downloadFile").mockImplementation(() => undefined);
    await renderLoadedView();

    await selectUserType(user, "Empresa");
    fireEvent.click(screen.getByRole("button", { name: "Gestión" }));
    await user.click(screen.getByRole("menuitemradio", { name: "I-2025" }));

    await waitFor(() => {
      expect(screen.getByText("Mostrando 1-2 de 2 usuarios")).toBeDefined();
    });
    expect(screen.getByText("Diego Mercado Rocha")).toBeDefined();
    expect(screen.getByText("Datalab Bolivia SRL")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Exportar CSV" }));

    expect(exportSpy).toHaveBeenCalledWith({ userType: "COMPANY", period: "I-2025" });
  });

  describe("HU02: filtro por tipo de usuario", () => {
    const userTypeColumn = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => row.querySelectorAll("td")[2].textContent);

    it.each([
      { label: "Estudiante", userType: "STUDENT", total: 6 },
      { label: "Titulado", userType: "DEGREE_HOLDER", total: 10 },
      { label: "Mentor", userType: "MENTOR", total: 2 },
      { label: "Empresa", userType: "COMPANY", total: 4 },
      { label: "Administrador", userType: "ADMIN", total: 2 },
    ])(
      "CA 4 y CA 5: al elegir $label consulta $userType y solo muestra ese tipo",
      async ({ label, userType, total }) => {
        const user = userEvent.setup();
        const getRegisteredUsersSpy = vi.spyOn(reportsService, "getRegisteredUsers");
        await renderLoadedView();

        await selectUserType(user, label);

        await waitFor(() => {
          expect(screen.getByText(`Mostrando 1-${total} de ${total} usuarios`)).toBeDefined();
        });
        expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith({ page: 1, limit: 10, userType });
        expect(userTypeColumn()).toEqual(Array.from({ length: total }, () => label));
      },
    );

    it("no ofrece Egresado como tipo de usuario", async () => {
      render(<RegisteredUsersReportView />);

      await userEvent.setup().click(screen.getByRole("combobox", { name: "Tipo de usuario" }));

      await screen.findByRole("listbox");
      expect(screen.getAllByRole("option")).toHaveLength(6);
      expect(screen.queryByRole("option", { name: "Egresado" })).toBeNull();
    });

    it("CA 3 y CA 11: con Todos no envía tipo de usuario", async () => {
      const user = userEvent.setup();
      const getRegisteredUsersSpy = vi.spyOn(reportsService, "getRegisteredUsers");
      await renderLoadedView();
      await selectUserType(user, "Mentor");
      await waitFor(() => {
        expect(screen.getByText("Mostrando 1-2 de 2 usuarios")).toBeDefined();
      });

      await selectUserType(user, "Todos");

      await waitFor(() => {
        expect(screen.getByText("Mostrando 1-10 de 24 usuarios")).toBeDefined();
      });
      expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith({ page: 1, limit: 10, userType: undefined });
      expect(new Set(userTypeColumn()).size).toBeGreaterThan(1);
    });

    it("CA 6, CA 7 y CA 14: con exactamente 10 registros del tipo muestra una sola página", async () => {
      const user = userEvent.setup();
      await renderLoadedView();
      expect(screen.getByRole("button", { name: "Página 3" })).toBeDefined();

      await selectUserType(user, "Titulado");

      await waitFor(() => {
        expect(screen.getByText("Mostrando 1-10 de 10 usuarios")).toBeDefined();
      });
      expect(userTypeColumn()).toHaveLength(10);
      expect(screen.getByRole("button", { name: "Página 1" })).toBeDefined();
      expect(screen.queryByRole("button", { name: "Página 2" })).toBeNull();
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Página siguiente" }).disabled).toBe(true);
    });

    it("CA 8: al cambiar de página conserva el filtro activo", async () => {
      const elevenDegreeHolders = [
        ...REGISTERED_USERS,
        { ...REGISTERED_USERS[0], id: "25", fullName: "Nuevo Titulado", registeredAt: "2025-01-01T10:00:00" },
      ];
      const getRegisteredUsersSpy = vi
        .spyOn(reportsService, "getRegisteredUsers")
        .mockImplementation(async ({ page, limit, userType }) =>
          buildResponse(page, limit, userType, undefined, elevenDegreeHolders),
        );
      const user = userEvent.setup();
      await renderLoadedView();
      await selectUserType(user, "Titulado");
      await waitFor(() => {
        expect(screen.getByText("Mostrando 1-10 de 11 usuarios")).toBeDefined();
      });

      fireEvent.click(screen.getByRole("button", { name: "Página 2" }));

      await waitFor(() => {
        expect(screen.getByText("Mostrando 11-11 de 11 usuarios")).toBeDefined();
      });
      expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith({ page: 2, limit: 10, userType: "DEGREE_HOLDER" });
      expect(screen.getByText("Nuevo Titulado")).toBeDefined();
      expect(userTypeColumn()).toEqual(["Titulado"]);
      expect(screen.getByRole("combobox", { name: "Tipo de usuario" }).textContent).toContain("Titulado");
    });

    it("CA 10: un tipo sin registros muestra la tabla vacía sin usuarios de otros tipos", async () => {
      vi.spyOn(reportsService, "getRegisteredUsers").mockImplementation(async ({ page, limit, userType }) =>
        buildResponse(
          page,
          limit,
          userType,
          undefined,
          REGISTERED_USERS.filter((registeredUser) => registeredUser.userType !== "COMPANY"),
        ),
      );
      const user = userEvent.setup();
      await renderLoadedView();

      await selectUserType(user, "Empresa");

      await waitFor(() => {
        expect(screen.getByText("No hay usuarios registrados para este filtro.")).toBeDefined();
      });
      expect(screen.getByText("Mostrando 0-0 de 0 usuarios")).toBeDefined();
      expect(screen.queryByText("Juan Carlos Peres Rojas")).toBeNull();
      expect(screen.queryByRole("button", { name: "Página 2" })).toBeNull();
    });

    it("CA 15 y CA 16: cada fila muestra los 6 campos del mismo usuario", async () => {
      await renderLoadedView();

      const [header, ...rows] = screen.getAllByRole("row");
      expect(Array.from(header.querySelectorAll("th"), (cell) => cell.textContent)).toEqual([
        "Usuario",
        "Correo",
        "Tipo de Usuario",
        "Identificador",
        "Documento",
        "Fecha de Registro",
      ]);
      expect(rows).toHaveLength(10);
      rows.forEach((row, index) => {
        const source = REGISTERED_USERS[index];
        const cells = Array.from(row.querySelectorAll("td"), (cell) => cell.textContent);

        expect(cells).toHaveLength(6);
        expect([cells[0], cells[1], cells[3]]).toEqual([source.fullName, source.email, source.identifier]);
      });
      expect(Array.from(rows[6].querySelectorAll("td"), (cell) => cell.textContent)).toEqual([
        "Diego Mercado Rocha",
        "dmercado@gmail.com",
        "Empresa",
        "1029964756",
        "NIT",
        "10/01/2025",
      ]);
    });

    it("CA 22 y CA 23: recorrer todas las páginas muestra cada usuario una sola vez", async () => {
      await renderLoadedView();
      const seenNames: string[] = [];

      for (const page of [1, 2, 3]) {
        fireEvent.click(screen.getByRole("button", { name: `Página ${page}` }));
        await waitFor(() => {
          expect(screen.getByRole("button", { name: `Página ${page}` }).getAttribute("aria-current")).toBe("page");
          expect(screen.queryAllByTestId("skeleton-row")).toHaveLength(0);
        });
        seenNames.push(
          ...screen
            .getAllByRole("row")
            .slice(1)
            .map((row) => row.querySelector("td")?.textContent ?? ""),
        );
      }

      expect(seenNames).toHaveLength(REGISTERED_USERS.length);
      expect(new Set(seenNames).size).toBe(REGISTERED_USERS.length);
    });
  });

  describe("HU07: filtro por gestión semestral", () => {
    const userTypeCells = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => row.querySelectorAll("td")[2].textContent);

    const countUsers = (users: RegisteredUser[], period?: AcademicPeriod, userType?: UserType) =>
      users.filter(
        (user) => (!period || getPeriod(user.registeredAt) === period) && (!userType || user.userType === userType),
      ).length;

    const buildUsers = (count: number, registeredAt: string, prefix: string, userType: UserType = "DEGREE_HOLDER") =>
      Array.from({ length: count }, (_, index) => ({
        ...REGISTERED_USERS[0],
        id: `${prefix}-${index}`,
        fullName: `${prefix} ${index}`,
        userType,
        registeredAt,
      }));

    // 16 titulados más en II-2025 (25 en total) y 10 usuarios en I-2024.
    const EXTENDED_USERS = [
      ...REGISTERED_USERS,
      ...buildUsers(16, "2025-09-01T10:00:00", "Titulado II-2025"),
      ...buildUsers(10, "2024-04-10T10:00:00", "Estudiante I-2024", "STUDENT"),
    ];

    const mockUsers = (users: RegisteredUser[]) =>
      vi
        .spyOn(reportsService, "getRegisteredUsers")
        .mockImplementation(async ({ page, limit, userType, period }) =>
          buildResponse(page, limit, userType, period, users),
        );

    async function selectPeriod(user: UserEvent, label: string) {
      fireEvent.click(screen.getByRole("button", { name: /^Gestión/ }));
      await user.click(await screen.findByRole("menuitemradio", { name: label }));
    }

    const visibleNames = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => row.querySelector("td")?.textContent);

    it("muestra el selector al cargar con las gestiones en formato semestre y año", async () => {
      await renderLoadedView();

      fireEvent.click(screen.getByRole("button", { name: "Gestión" }));

      const options = screen.getAllByRole("menuitemradio").map((option) => option.textContent ?? "");
      expect(options[0]).toBe("Todas");
      expect(options.slice(1).every((option) => /^(I|II)-\d{4}$/.test(option))).toBe(true);
      expect(options).toEqual(expect.arrayContaining(["I-2026", "II-2025", "I-2025"]));
      expect(options).not.toContain("1-2025");
    });

    it("filtra solo por la gestión, sin restringir el tipo de usuario", async () => {
      const user = userEvent.setup();
      const getRegisteredUsersSpy = mockUsers(REGISTERED_USERS);
      await renderLoadedView();

      await selectPeriod(user, "II-2025");

      const total = countUsers(REGISTERED_USERS, "II-2025");
      await waitFor(() => {
        expect(screen.getByText(`Mostrando 1-${total} de ${total} usuarios`)).toBeDefined();
      });
      expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        userType: undefined,
        period: "II-2025",
      });
      expect(visibleNames()).toEqual(
        REGISTERED_USERS.filter((registeredUser) => getPeriod(registeredUser.registeredAt) === "II-2025").map(
          (registeredUser) => registeredUser.fullName,
        ),
      );
      expect(new Set(userTypeCells()).size).toBeGreaterThan(1);
    });

    it("combina gestión y tipo de usuario y cada filtro conserva el otro", async () => {
      const user = userEvent.setup();
      const getRegisteredUsersSpy = mockUsers(REGISTERED_USERS);
      await renderLoadedView();

      await selectPeriod(user, "II-2025");
      await selectUserType(user, "Titulado");
      const titulados = countUsers(REGISTERED_USERS, "II-2025", "DEGREE_HOLDER");
      await waitFor(() => {
        expect(screen.getByText(`Mostrando 1-${titulados} de ${titulados} usuarios`)).toBeDefined();
      });
      expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ userType: "DEGREE_HOLDER", period: "II-2025" }),
      );
      expect(new Set(userTypeCells())).toEqual(new Set(["Titulado"]));

      await selectUserType(user, "Empresa");
      await waitFor(() => {
        expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith(
          expect.objectContaining({ userType: "COMPANY", period: "II-2025" }),
        );
      });
      expect(screen.getByRole("button", { name: "Gestión II-2025" })).toBeDefined();

      await selectPeriod(user, "I-2025");
      const empresas = countUsers(REGISTERED_USERS, "I-2025", "COMPANY");
      await waitFor(() => {
        expect(screen.getByText(`Mostrando 1-${empresas} de ${empresas} usuarios`)).toBeDefined();
      });
      expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ userType: "COMPANY", period: "I-2025" }),
      );
      expect(screen.getByRole("combobox", { name: "Tipo de usuario" }).textContent).toContain("Empresa");
    });

    it("vuelve a la página 1 al cambiar de gestión estando en otra página", async () => {
      const user = userEvent.setup();
      const getRegisteredUsersSpy = mockUsers(EXTENDED_USERS);
      await renderLoadedView();
      fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Página 2" }).getAttribute("aria-current")).toBe("page");
      });

      await selectPeriod(user, "II-2025");

      await waitFor(() => {
        expect(screen.getByText("Mostrando 1-10 de 25 usuarios")).toBeDefined();
      });
      expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, period: "II-2025" }));
      expect(screen.getByRole("button", { name: "Página 1" }).getAttribute("aria-current")).toBe("page");
    });

    it("volver a elegir la misma gestión no consulta de nuevo ni cambia la página", async () => {
      const user = userEvent.setup();
      const getRegisteredUsersSpy = mockUsers(EXTENDED_USERS);
      await renderLoadedView();
      await selectPeriod(user, "II-2025");
      await waitFor(() => {
        expect(screen.getByText("Mostrando 1-10 de 25 usuarios")).toBeDefined();
      });
      fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
      await waitFor(() => {
        expect(screen.getByText("Mostrando 11-20 de 25 usuarios")).toBeDefined();
      });
      const callsBefore = getRegisteredUsersSpy.mock.calls.length;
      const namesBefore = visibleNames();

      await selectPeriod(user, "II-2025");

      await waitFor(() => {
        expect(screen.queryByRole("menu")).toBeNull();
      });
      expect(getRegisteredUsersSpy).toHaveBeenCalledTimes(callsBefore);
      expect(screen.getByText("Mostrando 11-20 de 25 usuarios")).toBeDefined();
      expect(visibleNames()).toEqual(namesBefore);
    });

    it("al cambiar de gestión varias veces muestra solo los datos de la última", async () => {
      const user = userEvent.setup();
      mockUsers(EXTENDED_USERS);
      await renderLoadedView();

      await selectPeriod(user, "II-2025");
      await selectPeriod(user, "I-2026");
      await selectPeriod(user, "I-2025");

      const total = countUsers(EXTENDED_USERS, "I-2025");
      await waitFor(() => {
        expect(screen.getByText(`Mostrando 1-${total} de ${total} usuarios`)).toBeDefined();
      });
      expect(screen.getByRole("button", { name: "Gestión I-2025" })).toBeDefined();
      expect(visibleNames()).toEqual(
        EXTENDED_USERS.filter((registeredUser) => getPeriod(registeredUser.registeredAt) === "I-2025").map(
          (registeredUser) => registeredUser.fullName,
        ),
      );
    });

    it("con exactamente 10 usuarios en la gestión muestra una sola página", async () => {
      const user = userEvent.setup();
      mockUsers(EXTENDED_USERS);
      await renderLoadedView();

      await selectPeriod(user, "I-2024");

      await waitFor(() => {
        expect(screen.getByText("Mostrando 1-10 de 10 usuarios")).toBeDefined();
      });
      expect(screen.queryByRole("button", { name: "Página 2" })).toBeNull();
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Página anterior" }).disabled).toBe(true);
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Página siguiente" }).disabled).toBe(true);
    });

    it("una gestión sin usuarios muestra el estado vacío y oculta el paginador", async () => {
      const user = userEvent.setup();
      mockUsers(EXTENDED_USERS);
      await renderLoadedView();

      await selectPeriod(user, "I-2020");

      await waitFor(() => {
        expect(screen.getByText("No hay usuarios registrados para este filtro.")).toBeDefined();
      });
      expect(screen.getByText("Mostrando 0-0 de 0 usuarios")).toBeDefined();
      expect(screen.queryByRole("navigation", { name: "Paginación" })).toBeNull();
    });

    it("al paginar mantiene gestión y tipo de usuario y recorre todo sin duplicados", async () => {
      const user = userEvent.setup();
      const getRegisteredUsersSpy = mockUsers(EXTENDED_USERS);
      await renderLoadedView();
      await selectPeriod(user, "II-2025");
      await selectUserType(user, "Titulado");
      const total = countUsers(EXTENDED_USERS, "II-2025", "DEGREE_HOLDER");
      await waitFor(() => {
        expect(screen.getByText(`Mostrando 1-10 de ${total} usuarios`)).toBeDefined();
      });
      const seenNames = [...visibleNames()];
      const totalPages = Math.ceil(total / 10);
      expect(totalPages).toBeGreaterThan(1);

      for (let page = 2; page <= totalPages; page++) {
        fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
        await waitFor(() => {
          expect(screen.getByRole("button", { name: `Página ${page}` }).getAttribute("aria-current")).toBe("page");
          expect(screen.queryAllByTestId("skeleton-row")).toHaveLength(0);
        });
        expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith({
          page,
          limit: 10,
          userType: "DEGREE_HOLDER",
          period: "II-2025",
        });
        seenNames.push(...visibleNames());
      }

      expect(seenNames).toHaveLength(total);
      expect(new Set(seenNames).size).toBe(total);
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Página siguiente" }).disabled).toBe(true);
    });

    it("Actualizar vuelve a consultar con la gestión y el tipo de usuario activos", async () => {
      const user = userEvent.setup();
      const getRegisteredUsersSpy = mockUsers(EXTENDED_USERS);
      await renderLoadedView();
      await selectPeriod(user, "II-2025");
      await selectUserType(user, "Titulado");
      await waitFor(() => {
        expect(screen.queryAllByTestId("skeleton-row")).toHaveLength(0);
      });
      const callsBefore = getRegisteredUsersSpy.mock.calls.length;

      fireEvent.click(screen.getByRole("button", { name: "actualizar" }));

      await waitFor(() => {
        expect(getRegisteredUsersSpy).toHaveBeenCalledTimes(callsBefore + 1);
      });
      expect(getRegisteredUsersSpy).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        userType: "DEGREE_HOLDER",
        period: "II-2025",
      });
      expect(screen.getByRole("button", { name: "Gestión II-2025" })).toBeDefined();
    });

    it("exporta el CSV con la gestión y el tipo de usuario activos, no solo la página visible", async () => {
      const user = userEvent.setup();
      mockUsers(EXTENDED_USERS);
      const exportSpy = vi
        .spyOn(reportsService, "exportRegisteredUsersCsv")
        .mockResolvedValueOnce({ file: new Blob([]), fileName: "usuarios-registrados-titulado-II-2025.csv" });
      vi.spyOn(downloadFileModule, "downloadFile").mockImplementation(() => undefined);
      await renderLoadedView();
      await selectPeriod(user, "II-2025");
      await selectUserType(user, "Titulado");
      fireEvent.click(screen.getByRole("button", { name: "Página 2" }));

      await user.click(screen.getByRole("button", { name: "Exportar CSV" }));

      // La exportación no envía página ni límite: el backend devuelve todo el subconjunto filtrado.
      expect(exportSpy).toHaveBeenCalledWith({ userType: "DEGREE_HOLDER", period: "II-2025" });
    });
  });
});
