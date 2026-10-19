// Aurora charts — D3 7 chart factories. Every factory takes a container
// (element or selector) and options, and returns an instance.

export type Container = HTMLElement | string;

export interface ChartInstance<O> {
  /** Merge new options and re-render. */
  update(options: Partial<O>): void;
  /** Remove the chart from its container. */
  destroy(): void;
  /** The container element. */
  el: HTMLElement;
}

export interface TrendAreaProps {
  /** Y values, evenly spaced along X. */
  data?: number[];
  /** Pixel width; defaults to the container's width. */
  width?: number | null;
  /** Pixel height. Default 110. */
  height?: number;
  /** Which points get a dot: 'auto' (every ~fifth), 'none', or explicit indices. */
  markers?: 'auto' | 'none' | number[];
  /** Soft gradient fill beneath the line. Default true. */
  area?: boolean;
  /** Blurred halo behind the line. Default true. */
  glow?: boolean;
  /** Draw-on animation. Default true. */
  animate?: boolean;
  /** Curve: 'monotone' (default, passes through points) or 'basis' (looser). */
  curve?: 'monotone' | 'basis';
}
export declare function TrendArea(container: Container, options?: TrendAreaProps): ChartInstance<TrendAreaProps>;

export interface WaveSeries {
  /** Legend label; include the metric ("billing · p95 latency"). */
  name: string;
  data: number[];
  /** Color role for this line. Unset series cycle base → healthy → warning → danger. */
  status?: Status;
  /** Explicit token value; overrides status. */
  color?: string;
}
export interface WaveLineProps {
  /** The lines to compare (same unit, equal length). Up to four. */
  series?: WaveSeries[];
  /** Shorthand for a single base series. */
  data?: number[];
  width?: number | null;
  /** Default 64. */
  height?: number;
  /** true (below), 'top', or false. Default true. */
  legend?: boolean | 'top';
  glow?: boolean;
  animate?: boolean;
  /** 'basis' (default) or 'monotone'. */
  curve?: 'basis' | 'monotone';
  /** Default 2.5. */
  strokeWidth?: number;
}
export declare function WaveLine(container: Container, options?: WaveLineProps): ChartInstance<WaveLineProps>;

/** Aurora's four color roles. 'auto' derives healthy/warning/danger from a utilization value. */
export type Status = 'base' | 'healthy' | 'warning' | 'danger';

export interface RadialProgressProps {
  /** 0–1. */
  value?: number;
  /** Outer diameter in px. 128 for a headline metric, 96 for a gauge. */
  size?: number;
  /** Stroke width in px. 10 at 128, 7–8 at 96. */
  thickness?: number;
  /**
   * Color role. Default 'base'. 'auto' is for utilization metrics (high is bad):
   * value ≤ thresholds[0] → healthy, ≤ thresholds[1] → warning, else danger.
   */
  status?: Status | 'auto';
  /** Cut points for 'auto'. Default [0.5, 0.9]. */
  thresholds?: [number, number] | null;
  /** Explicit gradient stops (2–3 colors); overrides status. */
  colors?: string[] | null;
  /** Text at the center (e.g. '92%'). */
  label?: string | null;
  /** Small text under the label (e.g. 'Optimal'). */
  sublabel?: string | null;
  glow?: boolean;
  animate?: boolean;
  /** Round the arc ends. Default true. */
  round?: boolean;
}
export declare function RadialProgress(container: Container, options?: RadialProgressProps): ChartInstance<RadialProgressProps>;

export interface CountdownRingProps {
  /** Total seconds. Default 1500 (25 min). */
  seconds?: number;
  size?: number;
  thickness?: number;
  /** Default ember-soft → ember. */
  colors?: string[] | null;
  /** Text under the time, e.g. 'Deep Work'. */
  caption?: string;
  glow?: boolean;
  onTick?: (remaining: number) => void;
  onEnd?: () => void;
  onChange?: (state: { remaining: number; running: boolean; total: number }) => void;
}
export interface CountdownRingInstance extends ChartInstance<CountdownRingProps> {
  start(): void;
  pause(): void;
  /** Stop and refill; optionally set a new total. */
  reset(seconds?: number): void;
  /** Start, pause, or (at zero) reset. Bind this to the Start button. */
  toggle(): void;
  state(): { remaining: number; running: boolean; total: number; text: string };
}
export declare function CountdownRing(container: Container, options?: CountdownRingProps): CountdownRingInstance;

export interface ColumnDatum { label: string; value: number }
export interface ColumnChartProps {
  data?: ColumnDatum[];
  /** Which column is emphasised and carries the tooltip: 'max', an index, or null. */
  highlight?: 'max' | number | null;
  /** Tooltip text. Default one decimal + 'h'. */
  format?: (value: number) => string;
  width?: number | null;
  /** Default 150. */
  height?: number;
  /** Column width in px. Default 7. */
  barWidth?: number;
  glow?: boolean;
  animate?: boolean;
  tooltip?: boolean;
  /** Move the tooltip to the hovered column. Default true. */
  hover?: boolean;
}
export declare function ColumnChart(container: Container, options?: ColumnChartProps): ChartInstance<ColumnChartProps>;

export interface ProgressBarProps {
  label?: string;
  /** 0–1. */
  value?: number;
  format?: (value: number) => string;
  /** Default 58. */
  labelWidth?: number;
  /** Default 34. */
  valueWidth?: number;
  /** Meter height in px. Default 4. */
  height?: number;
  glow?: boolean;
  animate?: boolean;
  /** Color role; 'auto' derives it from value with the utilization thresholds. Default 'base'. */
  status?: Status | 'auto';
  thresholds?: [number, number] | null;
  /** Explicit token value; overrides status. The light stop is derived from it. */
  color?: string | null;
}
export declare function ProgressBar(container: Container, options?: ProgressBarProps): ChartInstance<ProgressBarProps>;

export type ColumnType = 'text' | 'mono' | 'time' | 'number' | 'level' | 'status';
export interface Column<Row = any> {
  key: keyof Row & string;
  label: string;
  /** Default 'text'. 'level' renders a role badge, 'status' a dot + word. */
  type?: ColumnType;
  /** px or any CSS width; unset columns share the remainder. */
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  /** Cell text. Default String(value). */
  format?: (value: any, row: Row) => string;
  /** Default true when the table is sortable. */
  sortable?: boolean;
}
export interface DataTableProps<Row = any> {
  columns: Column<Row>[];
  rows: Row[];
  /** Key holding a stable id; defaults to row index. */
  rowKey?: string | null;
  /** Default true. */
  sortable?: boolean;
  sortBy?: { key: string; dir: 'asc' | 'desc' } | null;
  /** 'compact' (32px rows, default) or 'comfortable' (40px). */
  density?: 'compact' | 'comfortable';
  /** Enables a scroll box with a sticky header. */
  maxHeight?: number | null;
  caption?: string | null;
  showCaption?: boolean;
  emptyText?: string;
  /** 'auto' → "N rows"; a string; or false. */
  footer?: 'auto' | string | false;
  onRowClick?: ((row: Row) => void) | null;
  zebra?: boolean;
}
export interface DataTableInstance<Row = any> extends ChartInstance<DataTableProps<Row>> {
  sort(key: string, dir?: 'asc' | 'desc'): void;
}
export declare function DataTable<Row = any>(container: Container, options: DataTableProps<Row>): DataTableInstance<Row>;

declare global {
  interface Window {
    Aurora: {
      /** Map a level/status word to a color role ('muted' for debug/trace). */
      roleOf(value: string): Status | 'muted';
      DataTable: typeof DataTable;
      version: string;
      /** Current token values read from tokens.css. */
      tokens(): Record<string, string>;
      /** Resolve a status from a value: 'auto' applies the utilization thresholds. */
      statusFor(value: number, status?: Status | 'auto', thresholds?: [number, number] | null): Status;
      /** [soft, strong] token values for a status. */
      statusColors(status: Status): [string, string];
      /** The default utilization cut points, [0.5, 0.9]. */
      thresholds: [number, number];
      TrendArea: typeof TrendArea;
      WaveLine: typeof WaveLine;
      RadialProgress: typeof RadialProgress;
      CountdownRing: typeof CountdownRing;
      ColumnChart: typeof ColumnChart;
      ProgressBar: typeof ProgressBar;
    };
  }
}
