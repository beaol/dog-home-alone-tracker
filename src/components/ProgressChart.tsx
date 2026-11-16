import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { stressOnset } from '../lib/engine';
import { formatDuration } from '../lib/format';
import { useTheme } from '../lib/theme';
import { KIND_LABEL, type Attempt } from '../lib/types';

const H = 240;
const PAD = { top: 14, right: 18, bottom: 34, left: 44 };

function niceStep(maxMin: number): number {
  const raw = maxMin / 4;
  const steps = [0.25, 0.5, 1, 2, 5, 10, 15, 20, 30, 60];
  return steps.find((s) => s >= raw) ?? 60;
}

function tickLabel(min: number): string {
  if (min === 0) return '0';
  if (min < 1) return `${Math.round(min * 60)}s`;
  if (min >= 60 && min % 60 === 0) return `${min / 60}h`;
  return `${min}m`;
}

export function ProgressChart({ attempts, nextTarget }: { attempts: Attempt[]; nextTarget?: number }) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const [sel, setSel] = useState<number | null>(null);

  const points = useMemo(
    () => attempts.map((a) => ({ a, onset: stressOnset(a), min: a.durationSec / 60 })),
    [attempts],
  );
  const n = points.length + (nextTarget ? 1 : 0);
  const maxMin = Math.max(0.5, ...points.map((p) => p.min), nextTarget ? nextTarget / 60 : 0) * 1.1;
  const step = niceStep(maxMin);
  const top = Math.ceil(maxMin / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(2));

  const plotW = Math.max(10, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (min: number) => PAD.top + plotH - (min / top) * plotH;

  const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.min)}`).join(' ');
  const lastIdx = points.length - 1;
  const selected = sel !== null ? points[sel] : null;
  const colW = n > 0 ? plotW / Math.max(1, n - 1) : plotW;

  const dateLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const labelIdx = new Set<number>([0, lastIdx, Math.floor(lastIdx / 2)].filter((i) => i >= 0));

  return (
    <View>
      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 8 }}>
        <LegendItem label="Calm">
          <Circle cx={8} cy={8} r={5} fill={t.good} />
        </LegendItem>
        <LegendItem label="Stress signs">
          <Path d="M8,2 L14,8 L8,14 L2,8 Z" fill={t.critical} />
        </LegendItem>
        <LegendItem label="First sign">
          <Path d="M3,8 L13,8" stroke={t.critical} strokeWidth={2} strokeLinecap="round" />
        </LegendItem>
        {nextTarget ? (
          <LegendItem label="Next target">
            <Circle cx={8} cy={8} r={5} fill={t.surface} stroke={t.accent} strokeWidth={2} />
          </LegendItem>
        ) : null}
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: H }}>
        {width > 0 && (
          <Svg width={width} height={H} accessibilityLabel="Chart of time alone per attempt">
            {ticks.map((tk) => (
              <G key={tk}>
                <Line x1={PAD.left} x2={PAD.left + plotW} y1={y(tk)} y2={y(tk)} stroke={t.grid} strokeWidth={1} />
                <SvgText x={PAD.left - 8} y={y(tk) + 4} fontSize={11} fill={t.textMuted} textAnchor="end">
                  {tickLabel(tk)}
                </SvgText>
              </G>
            ))}
            {points.map((p, i) =>
              labelIdx.has(i) ? (
                <SvgText key={`d${i}`} x={x(i)} y={H - 12} fontSize={11} fill={t.textMuted} textAnchor="middle">
                  {dateLabel(p.a.startedAt)}
                </SvgText>
              ) : null,
            )}
            {nextTarget ? (
              <SvgText x={x(n - 1)} y={H - 12} fontSize={11} fill={t.accent} textAnchor="middle">
                Next
              </SvgText>
            ) : null}

            {sel !== null && (
              <Line x1={x(sel)} x2={x(sel)} y1={PAD.top} y2={PAD.top + plotH} stroke={t.textMuted} strokeWidth={1} strokeDasharray="3,3" />
            )}

            <Path d={linePath} stroke={t.accent} strokeWidth={2} fill="none" strokeLinejoin="round" />
            {nextTarget && lastIdx >= 0 ? (
              <Line
                x1={x(lastIdx)}
                y1={y(points[lastIdx].min)}
                x2={x(n - 1)}
                y2={y(nextTarget / 60)}
                stroke={t.accent}
                strokeWidth={2}
                strokeDasharray="5,4"
              />
            ) : null}

            {points.map((p, i) => {
              const cx = x(i);
              const cy = y(p.min);
              const big = sel === i;
              return (
                <G key={p.a.id}>
                  {p.onset !== null && (
                    <Line
                      x1={cx - 7}
                      x2={cx + 7}
                      y1={y(p.onset / 60)}
                      y2={y(p.onset / 60)}
                      stroke={t.critical}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  )}
                  {p.onset === null ? (
                    <Circle cx={cx} cy={cy} r={big ? 7 : 5} fill={t.good} stroke={t.surface} strokeWidth={2} />
                  ) : (
                    <Path
                      d={`M${cx},${cy - (big ? 8 : 6.5)} L${cx + (big ? 8 : 6.5)},${cy} L${cx},${cy + (big ? 8 : 6.5)} L${cx - (big ? 8 : 6.5)},${cy} Z`}
                      fill={t.critical}
                      stroke={t.surface}
                      strokeWidth={2}
                    />
                  )}
                </G>
              );
            })}
            {nextTarget ? (
              <Circle cx={x(n - 1)} cy={y(nextTarget / 60)} r={6} fill={t.surface} stroke={t.accent} strokeWidth={2} />
            ) : null}
            <Rect x={PAD.left} y={PAD.top + plotH} width={plotW} height={1} fill={t.border} />
          </Svg>
        )}
        {/* Tap targets wider than the marks */}
        {width > 0 &&
          points.map((p, i) => (
            <Pressable
              key={`hit${p.a.id}`}
              accessibilityLabel={`Attempt on ${dateLabel(p.a.startedAt)}, ${formatDuration(p.a.durationSec)}`}
              onPress={() => setSel(sel === i ? null : i)}
              onHoverIn={() => setSel(i)}
              style={{ position: 'absolute', top: 0, bottom: 0, left: x(i) - Math.max(colW, 22) / 2, width: Math.max(colW, 22) }}
            />
          ))}
      </View>

      <View style={{ minHeight: 56, marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: t.surfaceAlt }}>
        {selected ? (
          <>
            <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>
              {new Date(selected.a.startedAt).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {formatDuration(selected.a.durationSec)}
            </Text>
            <Text style={{ color: t.textSecondary, fontSize: 14, marginTop: 2 }}>
              {selected.onset === null
                ? '✓ Calm the whole time'
                : `⚠ First sign at ${formatDuration(selected.onset)}: ` +
                  [...selected.a.events]
                    .sort((a, b) => a.atSec - b.atSec)
                    .map((e) => `${KIND_LABEL[e.kind].toLowerCase()} (${formatDuration(e.atSec)})`)
                    .join(', ')}
            </Text>
          </>
        ) : (
          <Text style={{ color: t.textSecondary, fontSize: 14 }}>Tap a point to see the details.</Text>
        )}
      </View>
    </View>
  );
}

function LegendItem({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Svg width={16} height={16}>
        {children}
      </Svg>
      <Text style={{ color: t.textSecondary, fontSize: 13 }}>{label}</Text>
    </View>
  );
}
