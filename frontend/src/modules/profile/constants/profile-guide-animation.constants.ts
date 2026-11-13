import type { ProfileGuideFrameId } from '../types/profile-guide-frame-id.types';
import type { ProfileGuideMascotSize } from '../types/profile-guide-mascot-size.types';
import type { ProfileGuidePose } from '../types/profile-guide-pose.types';

export const PROFILE_GUIDE_FRAME_IDS = [
  'wave',
  'wave-b',
  'wave-low',
  'blink',
  'talk',
  'point',
  'fly',
  'celebrate',
] as const satisfies readonly ProfileGuideFrameId[];

export const PROFILE_GUIDE_FRAME_SOURCES = {
  wave: '/images/profile-guide/robot-wave.webp',
  'wave-b': '/images/profile-guide/robot-wave-b.webp',
  'wave-low': '/images/profile-guide/robot-wave-low.webp',
  blink: '/images/profile-guide/robot-blink.webp',
  talk: '/images/profile-guide/robot-talk.webp',
  point: '/images/profile-guide/robot-point.webp',
  fly: '/images/profile-guide/robot-fly.webp',
  celebrate: '/images/profile-guide/robot-celebrate.webp',
} as const satisfies Record<ProfileGuideFrameId, string>;

export const PROFILE_GUIDE_POSE_FRAMES = {
  wave: ['wave', 'wave-b', 'wave-low', 'blink', 'talk'],
  point: ['point'],
  fly: ['fly'],
  celebrate: ['celebrate'],
} as const satisfies Record<ProfileGuidePose, readonly ProfileGuideFrameId[]>;

export const PROFILE_GUIDE_MESSAGES = {
  mascotLabel: 'Asistente virtual UMSSY',
} as const;

export const PROFILE_GUIDE_EASINGS = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  inOut: 'cubic-bezier(0.45, 0, 0.55, 1)',
} as const;

export const PROFILE_GUIDE_DURATIONS_MS = {
  entrance: 700,
  celebrationEntrance: 800,
  poseCrossfade: 220,
  stepTransition: 650,
  stepOutbound: 260,
  stepLanding: 380,
  celebrationBrief: 1300,
  jump: 520,
  bubbleIn: 280,
  bubbleOut: 180,
  bubblePop: 220,
  bubbleReducedMotion: 150,
  pop: 360,
  reveal: 500,
  float: 3200,
  sway: 1800,
  ring: 2400,
  ringEntrance: 600,
  ringStagger: 600,
  sparkle: 1800,
  sparkleStagger: 300,
  confetti: 1400,
  countUp: 1200,
  waveFrame: 160,
  blink: 130,
} as const;

export const PROFILE_GUIDE_MASCOT_SIZE_CLASSES = {
  sm: 'size-12',
  md: 'size-32',
  lg: 'size-72',
} as const satisfies Record<ProfileGuideMascotSize, string>;

export const PROFILE_GUIDE_MASCOT_SIZES_PX = {
  sm: 48,
  md: 128,
  lg: 288,
} as const satisfies Record<ProfileGuideMascotSize, number>;

export const PROFILE_GUIDE_FLOAT_AMPLITUDES_PX = {
  sm: 3,
  md: 6,
  lg: 6,
} as const satisfies Record<ProfileGuideMascotSize, number>;

export const PROFILE_GUIDE_POSE_CROSSFADE_CLASS =
  'transition-opacity duration-220 starting:opacity-0 motion-reduce:transition-none';

export const PROFILE_GUIDE_WAVE_SEQUENCE = [
  'wave',
  'wave-b',
  'wave-low',
  'wave-b',
  'wave',
] as const satisfies readonly ProfileGuideFrameId[];

export const PROFILE_GUIDE_WAVE_CYCLES = 3;

export const PROFILE_GUIDE_BLINK_INTERVALS_MS = [3200, 4600, 3800, 4200] as const;

export const PROFILE_GUIDE_TALK_INTERVALS_MS = [
  180, 140, 200, 160, 220, 150,
] as const;

export const PROFILE_GUIDE_STEP_TRAVEL_PX = 28;

export const PROFILE_GUIDE_REST_TRANSFORM =
  'translateX(0px) rotate(0deg) scale(1)';

export const PROFILE_GUIDE_ENTRANCE_KEYFRAMES: Keyframe[] = [
  {
    transform: 'translateY(24px) scale(0.85) rotate(-4deg)',
    opacity: 0,
  },
  {
    transform: 'translateY(0px) scale(1.04) rotate(1deg)',
    opacity: 1,
    offset: 0.65,
  },
  { transform: 'translateY(0px) scale(1) rotate(0deg)', opacity: 1 },
];

export const PROFILE_GUIDE_CELEBRATION_ENTRANCE_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(0.6)', opacity: 0 },
  { transform: 'scale(1.1)', opacity: 1, offset: 0.6 },
  { transform: 'scale(1)', opacity: 1 },
];

export const PROFILE_GUIDE_JUMP_KEYFRAMES: Keyframe[] = [
  { transform: 'translateY(0px) scaleY(1)' },
  { transform: 'translateY(-18px) scaleY(1)', offset: 0.45 },
  { transform: 'translateY(0px) scaleY(0.96)', offset: 0.85 },
  { transform: 'translateY(0px) scaleY(1)' },
];

export const PROFILE_GUIDE_CELEBRATION_JUMPS = 3;

export const PROFILE_GUIDE_SWAY_KEYFRAMES: Keyframe[] = [
  { transform: 'rotate(-2deg)' },
  { transform: 'rotate(2deg)' },
];

export const PROFILE_GUIDE_RING_SIZE_CLASSES = [
  'size-[55%]',
  'size-[75%]',
  'size-[95%]',
] as const;

export const PROFILE_GUIDE_RING_ENTRANCE_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(0.6)', opacity: 0 },
  { transform: 'scale(1)', opacity: 0.6 },
];

export const PROFILE_GUIDE_RING_PULSE_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(1)', opacity: 0.5 },
  { transform: 'scale(1.12)', opacity: 0 },
];

export const PROFILE_GUIDE_SPARKLE_CLASSES = [
  'left-[6%] top-[12%] size-5 text-gold',
  'right-[8%] top-[20%] size-4 text-brand-coral',
  'left-[12%] bottom-[18%] size-4 text-primary',
  'right-[10%] bottom-[10%] size-6 text-gold',
] as const;

export const PROFILE_GUIDE_SPARKLE_PATH =
  'M12 0C12.8 7.2 16.8 11.2 24 12C16.8 12.8 12.8 16.8 12 24C11.2 16.8 7.2 12.8 0 12C7.2 11.2 11.2 7.2 12 0Z';

export const PROFILE_GUIDE_SPARKLE_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(0.6) rotate(0deg)', opacity: 0.2 },
  { transform: 'scale(1) rotate(45deg)', opacity: 1 },
];

export const PROFILE_GUIDE_CONFETTI = {
  count: 16,
  startDelayMs: 350,
  maxStaggerMs: 180,
  minDistancePx: 70,
  distanceRangePx: 60,
  fallPx: 90,
  colorClasses: ['bg-gold', 'bg-brand-red', 'bg-primary', 'bg-brand-coral'],
  sizeClasses: ['size-1.5', 'size-2', 'size-2.5'],
  shapeClasses: ['rounded-[1px]', 'rounded-full'],
} as const;

export const PROFILE_GUIDE_BUBBLE_KEYFRAMES = {
  open: [
    { transform: 'scale(0.85) translateY(8px)', opacity: 0 },
    { transform: 'scale(1) translateY(0px)', opacity: 1 },
  ],
  close: [
    { transform: 'scale(1) translateY(0px)', opacity: 1 },
    { transform: 'scale(0.85) translateY(8px)', opacity: 0 },
  ],
  fadeIn: [{ opacity: 0 }, { opacity: 1 }],
  fadeOut: [{ opacity: 1 }, { opacity: 0 }],
  pop: [
    { transform: 'scale(1)' },
    { transform: 'scale(1.04)' },
    { transform: 'scale(1)' },
  ],
} satisfies Record<string, Keyframe[]>;

export const PROFILE_GUIDE_REVEAL_KEYFRAMES: Keyframe[] = [
  { transform: 'translateY(12px)', opacity: 0 },
  { transform: 'translateY(0px)', opacity: 1 },
];

export const PROFILE_GUIDE_POP_KEYFRAMES: Keyframe[] = [
  { transform: 'scale(0.6)' },
  { transform: 'scale(1.18)' },
  { transform: 'scale(1)' },
];
