import { act, cleanup, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { Providers } from "./providers";
import { clearAccessToken, saveAccessToken } from "@/shared/services/storage/access-token-storage";

vi.mock("@/components/ui/sonner", () => ({ Toaster: () => null }));
vi.mock("@/modules/auth/services/auth.service", () => ({ authService: { getSession: vi.fn().mockResolvedValue({ id: 'qa', roles: ['titulado'] }) } }));

afterEach(() => { cleanup(); clearAccessToken(); });

function QueryConsumer() {
  const client = useQueryClient();
  return <p>{client.getDefaultOptions().queries?.retry === false ? "Reintento manual" : "Otro modo"}</p>;
}

it("provides the shared query client to child views", () => {
  render(<Providers><QueryConsumer /></Providers>);
  expect(screen.getByText("Reintento manual")).toBeInTheDocument();
});

it("discards private cached data and late writes when the session changes", async () => {
  saveAccessToken('session-a');
  let current!: QueryClient;
  function PrivateView() {
    const client = useQueryClient();
    useEffect(() => { current = client; }, [client]);
    return <p>{client.getQueryData<string>(['private-profile']) ?? 'No cached profile'}</p>;
  }
  render(<Providers><PrivateView /></Providers>);
  const previous = current;
  previous.setQueryData(['private-profile'], 'Profile from A');
  await act(async () => { saveAccessToken('session-b'); });
  expect(current).not.toBe(previous);
  expect(current.getQueryData(['private-profile'])).toBeUndefined();
  previous.setQueryData(['private-profile'], 'Late response from A');
  expect(screen.queryByText('Late response from A')).not.toBeInTheDocument();
  expect(screen.getByText('No cached profile')).toBeInTheDocument();
});
