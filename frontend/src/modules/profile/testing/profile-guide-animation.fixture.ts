import { vi } from 'vitest';

type ChangeListener = () => void;

export interface FakeAnimation {
  cancel: ReturnType<typeof vi.fn>;
  finish: () => void;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  onfinish: (() => void) | null;
  finished: Promise<void>;
  playState?: AnimationPlayState;
  target: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

const originalAnimate = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'animate',
);
const originalMatchMedia = Object.getOwnPropertyDescriptor(
  window,
  'matchMedia',
);
const originalVisibility = Object.getOwnPropertyDescriptor(
  Document.prototype,
  'visibilityState',
);

export function stubElementAnimate() {
  const animations: FakeAnimation[] = [];
  const animate = vi.fn(function animateElement(
    this: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const animation: FakeAnimation = {
      cancel: vi.fn(),
      finish: () => animation.onfinish?.(),
      pause: vi.fn(),
      play: vi.fn(),
      onfinish: null,
      finished: Promise.resolve(),
      target: this,
      keyframes,
      options,
    };
    animations.push(animation);
    return animation;
  });
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    writable: true,
    value: animate,
  });
  return { animate, animations };
}

export function removeElementAnimate() {
  Reflect.deleteProperty(Element.prototype, 'animate');
}

export function stubReducedMotion(isReduced: boolean) {
  const listeners = new Set<ChangeListener>();
  const mediaQueryList = {
    matches: isReduced,
    addEventListener: (_type: string, listener: ChangeListener) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: ChangeListener) =>
      listeners.delete(listener),
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => mediaQueryList),
  });
  return {
    listeners,
    setReduced(isNextReduced: boolean) {
      mediaQueryList.matches = isNextReduced;
      listeners.forEach((listener) => listener());
    },
  };
}

export function removeMatchMedia() {
  Reflect.deleteProperty(window, 'matchMedia');
}

export function setDocumentVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

export function restoreAnimationStubs() {
  Reflect.deleteProperty(document, 'visibilityState');
  if (originalVisibility) {
    Object.defineProperty(
      Document.prototype,
      'visibilityState',
      originalVisibility,
    );
  }
  if (originalAnimate) {
    Object.defineProperty(Element.prototype, 'animate', originalAnimate);
  } else {
    removeElementAnimate();
  }
  if (originalMatchMedia) {
    Object.defineProperty(window, 'matchMedia', originalMatchMedia);
  } else {
    removeMatchMedia();
  }
}

export function getTransforms(animation: FakeAnimation): string[] {
  return animation.keyframes.map((keyframe) => String(keyframe.transform));
}
