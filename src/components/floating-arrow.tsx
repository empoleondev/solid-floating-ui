import { createMemo, JSX, splitProps } from 'solid-js';
import type { Alignment, Side } from "@floating-ui/dom";
import { platform } from "@floating-ui/dom";
import { useId } from "../hooks/use-id";
import type { FloatingContext } from "../hooks/use-floating";

type SVGAttrs = JSX.SvgSVGAttributes<SVGSVGElement>;

type CleanSVGProps = Omit<
  SVGAttrs,
  | Extract<keyof SVGAttrs, `aria-${string}`>
  | Extract<keyof SVGAttrs, `on${string}`>
>;

export interface FloatingArrowProps extends CleanSVGProps {
  /** The bound HTML element reference. */
  ref?: (el: SVGSVGElement) => void;
  /** The floating context. */
  context: FloatingContext;
  /**
   * Width of the arrow.
   * @default 14
   */
  width?: number;
  /**
   * Height of the arrow.
   * @default 7
   */
  height?: number;
  /**
   * The corner radius (rounding) of the arrow tip.
   * @default 0 (sharp)
   */
  tipRadius?: number;
  /**
   * Forces a static offset over dynamic positioning under a certain condition.
   * @default undefined (use dynamic position)
   */
  staticOffset?: string | number | null;
  /**
   * Custom path string.
   * @default undefined (use dynamic path)
   */
  d?: string;
  /**
   * Stroke (border) color of the arrow.
   * @default "none"
   */
  stroke?: string;
  /**
   * Stroke (border) width of the arrow.
   * @default 0
   */
  strokeWidth?: number;
  /** Set transform styles. */
  transform?: string;
  /** Set fill styles. */
  fill?: string;
}

export default function FloatingArrow(props: FloatingArrowProps) {
  const [local, rest] = splitProps(props, [
    'ref',
    'context',
    'width',
    'height',
    'tipRadius',
    'strokeWidth',
    'staticOffset',
    'stroke',
    'd',
    'transform',
    'fill',
    'style',
    'tabIndex'
  ]);

  // Default values
  const width = () => local.width ?? 14;
  const height = () => local.height ?? 7;
  const tipRadius = () => local.tipRadius ?? 0;
  const strokeWidth = () => local.strokeWidth ?? 0;

  // Extract context values
  const placement = () => local.context.placement;
  const floating = () => local.context.elements.floating;
  const arrow = () => local.context.middlewareData.arrow;
  const style = () => local.style;

  const clipPathId = useId();

  // Computed values using createMemo for efficiency
  const computedStrokeWidth = createMemo(() => strokeWidth() * 2);
  const halfStrokeWidth = createMemo(() => computedStrokeWidth() / 2);

  const svgX = createMemo(() => (width() / 2) * (tipRadius() / -8 + 1));
  const svgY = createMemo(() => ((height() / 2) * tipRadius()) / 4);

  const side = createMemo<Side>(() => {
    const [s] = placement().split("-") as [Side, Alignment];
    return s;
  });

  const alignment = createMemo<Alignment>(() => {
    const [, a] = placement().split("-") as [Side, Alignment];
    return a;
  });

  const isRTL = createMemo(() => floating() && platform.isRTL(floating()!));
  const isCustomShape = createMemo(() => !!local.d);
  const isVerticalSide = createMemo(() =>
    side() === "top" || side() === "bottom"
  );

  // Match Svelte version exactly
  const yOffsetProp = createMemo(() =>
    local.staticOffset && alignment() === "end" ? "bottom" : "top"
  );

  const xOffsetProp = createMemo(() => {
    if (!local.staticOffset) {
      return "left";
    }
    if (isRTL()) {
      return alignment() === "end" ? "right" : "left";
    }
    return alignment() === "end" ? "right" : "left";
  });

  const arrowX = createMemo(() =>
    arrow()?.x != null ? local.staticOffset || `${arrow()!.x! + 2}px` : ""
  );

  const arrowY = createMemo(() =>
    arrow()?.y != null ? local.staticOffset || `${arrow()!.y}px` : ""
  );

  const dValue = createMemo(() =>
    local.d ||
    `M0,0 H${width()} L${width() - svgX()},${height() - svgY()} Q${width() / 2},${height()} ${svgX()},${height() - svgY()} Z`
  );

  const rotation = createMemo(() => {
    const currentSide = side();
    switch (currentSide) {
      case "top":
        return isCustomShape() ? "rotate(180deg)" : "";
      case "left":
        return isCustomShape() ? "rotate(90deg)" : "rotate(-90deg)";
      case "bottom":
        return isCustomShape() ? "" : "rotate(180deg)";
      case "right":
        return isCustomShape() ? "rotate(-90deg)" : "rotate(90deg)";
      default:
        return "";
    }
  });

  // Create style object matching Svelte version exactly
  const svgStyle = createMemo(() => {
    const currentSide = side();
    const half = halfStrokeWidth();                // e.g. 2px
    const offset = isVerticalSide() || isCustomShape()
      ? `99%`                                     // centred on top/bottom
      : `calc(99% - ${half}px)`;

    const styles: Record<string, string | number | undefined> = {
      position: 'absolute',
      'pointer-events': 'none',
      [xOffsetProp()]: arrowX(),
      [yOffsetProp()]: arrowY(),
      [currentSide]: offset,
      // [currentSide]: isVerticalSide() || isCustomShape() ? '99%' : `calc(99% - ${computedStrokeWidth() / 2}px)`,
      transform: `${rotation()} ${local.transform ?? ''}`.trim(),
      fill: local.fill,
    };

    return styles;
  });

  const safeTabIndex = () => {
    const ti = local.tabIndex;
    if (ti == null) return undefined;
    return typeof ti === "string" ? parseInt(ti, 10) : ti;
  };

  return (
    <svg
      ref={local.ref}
      width={isCustomShape() ? width() : width() + computedStrokeWidth()}
      height={width()}
      viewBox={`0 0 ${width()} ${height() > width() ? height() : width()}`}
      aria-hidden="true"
      style={(style() || svgStyle()) as unknown as JSX.CSSProperties}
      data-testid="floating-arrow"
      tabIndex={safeTabIndex()}
      {...rest}
    >
      {computedStrokeWidth() > 0 && (
        <path
          fill="none"
          stroke={local.stroke}
          clip-path={`url(#${clipPathId})`}
          stroke-width={computedStrokeWidth() + (local.d ? 0 : 1)}
          d={dValue()}
        />
      )}
      <path
        stroke={computedStrokeWidth() && !local.d ? local.fill : 'none'}
        d={dValue()}
      />
      <clipPath id={clipPathId}>
        <rect
          x={-halfStrokeWidth()}
          y={halfStrokeWidth() * (isCustomShape() ? -1 : 1)}
          width={width() + computedStrokeWidth()}
          height={width()}
        />
      </clipPath>
    </svg>
  );
}
