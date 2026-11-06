import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useElementHeight } from "./use-element-height"

describe("useElementHeight", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("devuelve 0 cuando no hay elemento o el navegador no tiene ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined)
    const { result } = renderHook(() => useElementHeight<HTMLElement>())
    expect(result.current.height).toBe(0)
  })

  it("mide la altura del elemento y deja de observarlo al desmontar", () => {
    let notify: () => void = () => {}
    const disconnect = vi.fn()
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          notify = callback
        }
        observe() {}
        disconnect = disconnect
      },
    )
    const node = document.createElement("nav")
    node.getBoundingClientRect = () => ({ height: 66 }) as DOMRect

    const { result, unmount } = renderHook(() => {
      const hook = useElementHeight<HTMLElement>()
      hook.ref.current = node
      return hook
    })

    act(() => notify())
    expect(result.current.height).toBe(66)

    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
