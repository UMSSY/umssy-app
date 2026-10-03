import { MENTOR_DIRECTORY_FIXTURES } from "../fixtures/mentor-directory.fixtures";
import { MENTOR_PROFILES } from "../fixtures/mentor-profiles.fixtures";

const failedDemoRequests = new Set<string>();

async function simulateRequest(key: string, signal?: AbortSignal) {
  const demo = process.env.NODE_ENV === "development"
    ? new URLSearchParams(window.location.search).get("demo")
    : null;
  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Consulta cancelada", "AbortError"));
      return;
    }
    const handleAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Consulta cancelada", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, 650);
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
  if (demo === "error" && !failedDemoRequests.has(key)) {
    failedDemoRequests.add(key);
    throw new Error("No se pudo cargar la información. Intenta nuevamente.");
  }
  return demo;
}

export async function getMentorDirectory(signal?: AbortSignal) {
  const demo = await simulateRequest("directory", signal);
  return demo === "empty" ? [] : MENTOR_DIRECTORY_FIXTURES;
}

export async function getMentorProfile(mentorId: string, signal?: AbortSignal) {
  await simulateRequest(`profile:${mentorId}`, signal);
  return MENTOR_PROFILES.find((mentor) => String(mentor.id) === mentorId) ?? null;
}

