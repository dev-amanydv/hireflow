'use client';

import { type CSSProperties, useMemo } from 'react';
import { type LocalAudioTrack, type RemoteAudioTrack } from 'livekit-client';
import {
  type AgentState,
  type TrackReferenceOrPlaceholder,
  useMultibandTrackVolume,
} from '@livekit/components-react';
import { motion, type Transition } from 'motion/react';
import { cn } from '~/lib/utils';

const SIZE_PX = {
  sm: 120,
  md: 180,
  lg: 260,
  xl: 340,
} as const;

/**
 * Props for the AgentAudioOrb component.
 */
export interface AgentAudioOrbProps {
  /**
   * The size of the orb.
   * @defaultValue 'lg'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * The current state of the agent. Determines the idle animation.
   * @defaultValue 'connecting'
   */
  state?: AgentState;
  /**
   * The core color of the orb in hexadecimal format.
   * @defaultValue '#5e6ad2'
   */
  color?: `#${string}`;
  /**
   * The audio track to visualize. Amplitude drives the orb's scale and glow.
   */
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder;
  /**
   * Additional CSS class names to apply to the container.
   */
  className?: string;
}

/**
 * A soft, breathing orb that scales and glows with the agent's audio amplitude.
 * When idle it breathes gently; when the agent speaks it reacts to the live volume.
 * A premium, minimal alternative to the dot-grid visualizer.
 *
 * @example
 * ```tsx
 * <AgentAudioOrb size="lg" state={state} audioTrack={agentAudioTrack} />
 * ```
 */
export function AgentAudioOrb({
  size = 'lg',
  state = 'connecting',
  color = '#5e6ad2',
  audioTrack,
  className,
}: AgentAudioOrbProps) {
  const volumeBands = useMultibandTrackVolume(audioTrack, {
    bands: 1,
    loPass: 100,
    hiPass: 200,
  });

  const px = SIZE_PX[size];
  const speaking = state === 'speaking';
  const thinking = state === 'thinking';

  // Clamp the raw amplitude so an occasional loud peak doesn't blow out the orb.
  const amp = speaking ? Math.min(1, (volumeBands[0] ?? 0) * 1.4) : 0;

  const coreAnimate = useMemo(() => {
    if (speaking) {
      return { scale: 1 + amp * 0.42, opacity: 1 };
    }
    if (thinking) {
      // A quicker, shallower pulse to read as "processing".
      return { scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] };
    }
    // Idle / listening / connecting: slow, calm breathing.
    return { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] };
  }, [speaking, thinking, amp]);

  const coreTransition: Transition = speaking
    ? { type: 'spring', stiffness: 260, damping: 22, mass: 0.6 }
    : {
        duration: thinking ? 1.4 : 4.2,
        ease: 'easeInOut',
        repeat: Infinity,
      };

  const glowOpacity = speaking ? 0.35 + amp * 0.5 : thinking ? 0.4 : 0.28;

  return (
    <div
      data-lk-state={state}
      className={cn('relative grid place-items-center', className)}
      style={{ width: px, height: px, color } as CSSProperties}
    >
      {/* Outer bloom */}
      <motion.div
        aria-hidden
        className="absolute rounded-full"
        style={{
          width: px * 1.35,
          height: px * 1.35,
          background:
            'radial-gradient(circle, currentColor 0%, transparent 65%)',
          filter: `blur(${px * 0.14}px)`,
        }}
        animate={{ opacity: glowOpacity, scale: speaking ? 1 + amp * 0.25 : [1, 1.08, 1] }}
        transition={
          speaking
            ? { type: 'spring', stiffness: 200, damping: 20 }
            : { duration: 4.6, ease: 'easeInOut', repeat: Infinity }
        }
      />

      {/* Core orb */}
      <motion.div
        className="relative rounded-full"
        style={{
          width: px * 0.62,
          height: px * 0.62,
          background:
            'radial-gradient(circle at 32% 28%, color-mix(in srgb, currentColor 55%, white) 0%, currentColor 46%, color-mix(in srgb, currentColor 70%, black) 100%)',
          boxShadow: `0 0 ${px * 0.18}px currentColor, inset 0 0 ${px * 0.12}px color-mix(in srgb, currentColor 60%, black)`,
        }}
        animate={coreAnimate}
        transition={coreTransition}
      >
        {/* Specular highlight for depth */}
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            top: '14%',
            left: '18%',
            width: '34%',
            height: '34%',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.7) 0%, transparent 70%)',
            filter: 'blur(2px)',
          }}
        />
      </motion.div>
    </div>
  );
}
