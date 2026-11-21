
import "@/shared/testing/indexed-db.mock";
import "@/modules/job-offers/testing/current-company.mock";

import {
  act,
  cleanup,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAccessToken,
  saveAccessToken,
} from "@/shared/services/storage/access-token-storage";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import {
  CLOSE_JOB_OFFER_TEXT,
  TOAST_OPTIONS,
} from "../constants/job-offers.constants";
import { jobOffersService } from "../services/job-offers.service";
import {
  buildJobOffer,
  buildSessionToken,
  COMPANY_ID,
} from "../testing/vacancy-fixtures";
import { VacancyList } from "./vacancy-list";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const BACKEND = buildJobOffer({
  id: "backend",
  title: "Ingeniero Backend",
});

const DESIGN = buildJobOffer({
  id: "design",
  title: "Diseñadora UX",
});

const OFFERS = [BACKEND, DESIGN];

const CLOSED_BACKEND = {
  ...BACKEND,
  status: "Cerrada",
} as Awaited<ReturnType<typeof jobOffersService.close>>;

function mockOffers() {
  return vi
    .spyOn(jobOffersService, "getByCompany")
    .mockResolvedValue(OFFERS);
}

async function openCloseDialog(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(
    await screen.findByRole("button", {
      name: "Cerrar vacante Ingeniero Backend",
    }),
  );

  return screen.findByRole("dialog");
}

describe("VacancyList - cierre manual HU12", () => {
  beforeEach(async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_COMPANY_ID", COMPANY_ID);
    await saveAccessToken(buildSessionToken("empresa"));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    clearAccessToken();
  });

  it.each(["Cancelar", "Escape", "Clic exterior"])(
    "cancela mediante %s sin enviar PATCH",
    async (action) => {
      const user = userEvent.setup();
      mockOffers();

      const close = vi.spyOn(jobOffersService, "close");

      renderWithQuery(<VacancyList />);

      const dialog = await openCloseDialog(user);

      expect(
        within(dialog).getByText(CLOSE_JOB_OFFER_TEXT.title),
      ).toBeInTheDocument();

      if (action === "Cancelar") {
        await user.click(
          within(dialog).getByRole("button", {
            name: "Cancelar",
          }),
        );
      }

      if (action === "Escape") {
        await user.keyboard("{Escape}");
      }

      if (action === "Clic exterior") {
        const overlay = document.querySelector<HTMLElement>(
          '[data-slot="dialog-overlay"]',
        );

        if (!overlay) {
          throw new Error("No se encontró el fondo del diálogo");
        }

        await user.click(overlay);
      }

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      expect(close).not.toHaveBeenCalled();

      expect(
        screen.getByRole("button", {
          name: "Cerrar vacante Ingeniero Backend",
        }),
      ).toBeInTheDocument();
    },
  );

  it("cierra solo la vacante seleccionada y actualiza la lista", async () => {
    const user = userEvent.setup();

    const getOffers = mockOffers();

    getOffers
      .mockResolvedValueOnce(OFFERS)
      .mockResolvedValue([DESIGN]);

    const close = vi
      .spyOn(jobOffersService, "close")
      .mockResolvedValue(CLOSED_BACKEND);

    renderWithQuery(<VacancyList />);

    const dialog = await openCloseDialog(user);

    await user.click(
      within(dialog).getByRole("button", {
        name: "Cerrar",
      }),
    );

    expect(close).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledWith(COMPANY_ID, "backend");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: "Cerrar vacante Ingeniero Backend",
        }),
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", {
        name: "Cerrar vacante Diseñadora UX",
      }),
    ).toBeInTheDocument();

    expect(toast.success).toHaveBeenCalledWith(
      CLOSE_JOB_OFFER_TEXT.success,
      { position: "top-center", duration: 5000 },
    );

    expect(getOffers).toHaveBeenCalledTimes(2);
  });

  it("informa HTTP 409 y actualiza una lista desactualizada", async () => {
    const user = userEvent.setup();

    mockOffers()
      .mockResolvedValueOnce(OFFERS)
      .mockResolvedValue([DESIGN]);

    const error = Object.assign(
      new Error("La vacante ya no se puede cerrar"),
      { response: { status: 409 } },
    );

    vi.spyOn(jobOffersService, "close").mockRejectedValue(error);

    renderWithQuery(<VacancyList />);

    const dialog = await openCloseDialog(user);

    await user.click(
      within(dialog).getByRole("button", {
        name: "Cerrar",
      }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CLOSE_JOB_OFFER_TEXT.notClosable,
        TOAST_OPTIONS,
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: "Cerrar vacante Ingeniero Backend",
        }),
      ).not.toBeInTheDocument();
    });

    expect(toast.success).not.toHaveBeenCalled();
  });

  it("ante HTTP 500 conserva la vacante y permite reintentar", async () => {
    const user = userEvent.setup();

    mockOffers()
      .mockResolvedValueOnce(OFFERS)
      .mockResolvedValue([DESIGN]);

    const error = Object.assign(
      new Error("Error interno"),
      { response: { status: 500 } },
    );

    const close = vi
      .spyOn(jobOffersService, "close")
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(CLOSED_BACKEND);

    renderWithQuery(<VacancyList />);

    const dialog = await openCloseDialog(user);

    await user.click(
      within(dialog).getByRole("button", {
        name: "Cerrar",
      }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        CLOSE_JOB_OFFER_TEXT.server,
        TOAST_OPTIONS,
      );
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Ingeniero Backend",
        hidden: true,
      }),
    ).toBeInTheDocument();

    expect(toast.success).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", {
        name: "Cerrar",
      }),
    );

    await waitFor(() => {
      expect(close).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("bloquea confirmaciones duplicadas mientras procesa el cierre", async () => {
    const user = userEvent.setup();

    mockOffers()
      .mockResolvedValueOnce(OFFERS)
      .mockResolvedValue([DESIGN]);

    let resolveClose:
      | ((value: typeof CLOSED_BACKEND) => void)
      | undefined;

    const close = vi
      .spyOn(jobOffersService, "close")
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveClose = resolve;
          }),
      );

    renderWithQuery(<VacancyList />);

    const dialog = await openCloseDialog(user);

    await user.click(
      within(dialog).getByRole("button", {
        name: "Cerrar",
      }),
    );

    await waitFor(() => {
      expect(
        within(dialog).getByRole("button", {
          name: "Cerrando...",
        }),
      ).toBeDisabled();
    });

    expect(close).toHaveBeenCalledOnce();

    await user.keyboard("{Escape}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => {
      resolveClose?.(CLOSED_BACKEND);
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    expect(close).toHaveBeenCalledOnce();
  });
});
