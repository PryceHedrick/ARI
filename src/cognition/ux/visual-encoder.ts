/**
 * Cognition UX — Visual Encoder
 *
 * Generates compact, text-first visual encodings (bars, ranges, heat, trend)
 * to make numeric cognitive outputs immediately interpretable.
 */

export type TrafficLight = 'PROCEED' | 'CAUTION' | 'STOP';

export interface BarOptions {
  width?: number; // number of cells
  filledChar?: string;
  emptyChar?: string;
}

export interface ProgressBarOptions extends BarOptions {
  min?: number;
  max?: number;
  showBounds?: boolean;
}

export interface RangeBarOptions extends BarOptions {
  min: number;
  max: number;
  markerChar?: string;
  showBounds?: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function safeWidth(width: number | undefined): number {
  return clamp(Math.floor(width ?? 20), 5, 60);
}

function normalize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) return 0;
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

export function renderProgressBar(value: number, opts: ProgressBarOptions = {}): string {
  const min = opts.min ?? 0;
  const max = opts.max ?? 100;
  const width = safeWidth(opts.width);
  const filledChar = opts.filledChar ?? '█';
  const emptyChar = opts.emptyChar ?? '░';

  const pct = normalize(value, min, max);
  const filled = Math.round(pct * width);
  const empty = width - filled;

  const bar = `${filledChar.repeat(filled)}${emptyChar.repeat(empty)}`;
  if (opts.showBounds) {
    return `[${min}] ${bar} [${max}]`;
  }
  return `[${bar}]`;
}

export function renderHeatBar(value: number, opts: ProgressBarOptions = {}): string {
  const min = opts.min ?? 0;
  const max = opts.max ?? 1;
  return renderProgressBar(value, { ...opts, min, max, showBounds: opts.showBounds ?? true });
}

export function renderRangeBar(value: number, opts: RangeBarOptions): string {
  const width = safeWidth(opts.width);
  const filledChar = opts.filledChar ?? '█';
  const emptyChar = opts.emptyChar ?? '░';
  const markerChar = opts.markerChar ?? '↑';

  const pct = normalize(value, opts.min, opts.max);
  const markerIndex = clamp(Math.round(pct * (width - 1)), 0, width - 1);

  const cells = Array.from({ length: width }, (_, i) => (i === markerIndex ? filledChar : emptyChar));
  const bar = cells.join('');
  const markerLine = `${' '.repeat(markerIndex)}${markerChar}`;

  if (opts.showBounds ?? true) {
    return `[${opts.min}] ${bar} [${opts.max}]\n      ${markerLine}`;
  }

  return `${bar}\n${markerLine}`;
}

export function renderTrafficLight(level: TrafficLight, opts?: { useEmoji?: boolean }): string {
  const useEmoji = opts?.useEmoji ?? true;
  if (!useEmoji) {
    if (level === 'PROCEED') return '[GREEN] PROCEED';
    if (level === 'CAUTION') return '[YELLOW] CAUTION';
    return '[RED] STOP';
  }

  if (level === 'PROCEED') return '🟢 PROCEED';
  if (level === 'CAUTION') return '🟡 CAUTION';
  return '🔴 STOP';
}

export function renderTrend(values: number[], opts?: { format?: (n: number) => string }): string {
  const format = opts?.format ?? ((n: number) => n.toString());
  if (values.length === 0) return '';
  if (values.length === 1) return format(values[0]);

  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const arrow = delta > 0 ? '↗' : delta < 0 ? '↘' : '→';
  const trend = delta > 0 ? 'IMPROVING' : delta < 0 ? 'DECLINING' : 'STABLE';

  return `${values.map(format).join(' → ')} ${arrow} ${trend}`;
}

