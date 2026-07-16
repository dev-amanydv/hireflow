'use client';

import React, {
  type CSSProperties,
  Children,
  type ComponentProps,
  type ReactNode,
  cloneElement,
  isValidElement,
  memo,
  useMemo,
} from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { LocalAudioTrack, RemoteAudioTrack } from 'livekit-client';
import {
  type AgentState,
  type TrackReferenceOrPlaceholder,
  useMultibandTrackVolume,
} from '@livekit/components-react';
import {
  type Coordinate,
  useAgentAudioVisualizerGridAnimator,
} from '~/hooks/agents-ui/use-agent-audio-visualizer-grid';
import { cn } from '~/lib/utils';

function cloneSingleChild(
  children: ReactNode | ReactNode[],
  props?: Record<string, unknown>,
  key?: unknown,
) {
  return Children.map(children, (child) => {
    if (isValidElement(child) && Children.only(children)) {
      const childProps = child.props as Record<string, unknown>;
      if (childProps.className) {
        props ??= {};
        props.className = cn(childProps.className as string, props.className as string);
        props.style = {
          ...(childProps.style as CSSProperties),
          ...(props.style as CSSProperties),
        };
      }
      return cloneElement(child, { ...props, key: key ? String(key) : undefined });
    }
    return child;
  });
}

export const AgentAudioVisualizerGridCellVariants = cva(
  [
    'w-1 h-1 rounded-full bg-current/10 place-self-center transition-all ease-out',
    'data-[lk-highlighted=true]:bg-current',
  ],
  {
    variants: {
      size: {
        icon: ['w-[2px] h-[2px]'],
        sm: ['w-[4px] h-[4px]'],
        md: ['w-[8px] h-[8px]'],
        lg: ['w-[12px] h-[12px]'],
        xl: ['w-[16px] h-[16px]'],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export const AgentAudioVisualizerGridVariants = cva('grid', {
  variants: {
    size: {
      icon: ['gap-[2px]'],
      sm: ['gap-[4px]'],
      md: ['gap-[8px]'],
      lg: ['gap-[12px]'],
      xl: ['gap-[16px]'],
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface GridOptions {
  radius?: number;
  interval?: number;
  rowCount?: number;
  columnCount?: number;
  className?: string;
}

const sizeDefaults = {
  icon: 3,
  sm: 5,
  md: 5,
  lg: 5,
  xl: 5,
};

function useGrid(
  size: VariantProps<typeof AgentAudioVisualizerGridVariants>['size'] = 'md',
  columnCount = sizeDefaults[size as keyof typeof sizeDefaults],
  rowCount = sizeDefaults[size as keyof typeof sizeDefaults],
) {
  return useMemo(() => {
    const _columnCount = columnCount;
    const _rowCount = rowCount ?? columnCount;
    const items = new Array(_columnCount * _rowCount).fill(0).map((_, idx) => idx);

    return { columnCount: _columnCount, rowCount: _rowCount, items };
  }, [columnCount, rowCount]);
}

interface GridCellProps {
  index: number;
  state: AgentState;
  interval: number;
  rowCount: number;
  columnCount: number;
  volumeBands: number[];
  highlightedCoordinate: Coordinate;
  children?: ReactNode;
}

const GridCell = memo(function GridCell({
  index,
  state,
  interval,
  rowCount,
  columnCount,
  volumeBands,
  highlightedCoordinate,
  children,
}: GridCellProps) {
  if (state === 'speaking') {
    const y = Math.floor(index / columnCount);
    const rowMidPoint = Math.floor(rowCount / 2);
    const volumeChunks = 1 / (rowMidPoint + 1);
    const distanceToMid = Math.abs(rowMidPoint - y);
    const threshold = distanceToMid * volumeChunks;
    const isHighlighted = (volumeBands[index % columnCount] ?? 0) >= threshold;

    return cloneSingleChild(children, {
      'data-lk-index': index,
      'data-lk-highlighted': isHighlighted,
    });
  }

  const isHighlighted =
    highlightedCoordinate.x === index % columnCount &&
    highlightedCoordinate.y === Math.floor(index / columnCount);

  const transitionDurationInSeconds = interval / (isHighlighted ? 1000 : 100);

  return cloneSingleChild(children, {
    'data-lk-index': index,
    'data-lk-highlighted': isHighlighted,
    style: {
      transitionDuration: `${transitionDurationInSeconds}s`,
    },
  });
});

export type AgentAudioVisualizerGridProps = GridOptions & {
  size?: 'icon' | 'sm' | 'md' | 'lg' | 'xl';
  state?: AgentState;
  color?: `#${string}`;
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder;
  className?: string;
  children?: ReactNode;
} & VariantProps<typeof AgentAudioVisualizerGridVariants>;

export function AgentAudioVisualizerGrid({
  size = "md",
  state = "connecting",
  radius,
  color = "#6e3afd",
  rowCount: _rowCount = 5,
  columnCount: _columnCount = 5,
  interval = 100,
  className,
  children,
  audioTrack,
  style,
  ...props
}: AgentAudioVisualizerGridProps & ComponentProps<"div">) {
  const { columnCount, rowCount, items } = useGrid(
    size,
    _columnCount,
    _rowCount,
  );
  const highlightedCoordinate = useAgentAudioVisualizerGridAnimator(
    state,
    rowCount,
    columnCount,
    interval,
    radius,
  );
  const volumeBands = useMultibandTrackVolume(audioTrack, {
    bands: columnCount,
    loPass: 100,
    hiPass: 200,
  });

  if (children && Array.isArray(children)) {
    throw new Error(
      "AgentAudioVisualizerGrid children must be a single element.",
    );
  }

  return (
    <div
      data-lk-state={state}
      className={cn(AgentAudioVisualizerGridVariants({ size }), className)}
      style={
        {
          ...style,
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          color,
        } as CSSProperties
      }
      {...props}
    >
      {items.map((idx) => (
        <GridCell
          key={idx}
          index={idx}
          state={state}
          interval={interval}
          rowCount={rowCount}
          columnCount={columnCount}
          volumeBands={volumeBands}
          highlightedCoordinate={highlightedCoordinate}
        >
          {children ?? (
            <div className={AgentAudioVisualizerGridCellVariants({ size })} />
          )}
        </GridCell>
      ))}
    </div>
  );
}
