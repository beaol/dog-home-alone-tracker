import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { forecast, forecastGoal, type EngineOptions, type ForecastDay, type ForecastSession } from '../lib/engine';
import { formatDuration } from '../lib/format';
import { useTheme } from '../lib/theme';
import type { Attempt } from '../lib/types';
import { ForecastDayList, KIND_WORD } from './ForecastCard';
import { Body, Card, Chip, H2, Label, Row } from './ui';

const RANGES = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 5, label: '5 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 21, label: '3 weeks' },
  { days: 30, label: '1 month' },
  { days: 60, label: '2 months' },
  { days: 90, label: '3 months' },
];

export function ForecastView({ attempts, dog, options }: { attempts: Attempt[]; dog: string; options: EngineOptions }) {
  const [rangeDays, setRangeDays] = useState(14);
  // Fixed "now" while the screen is open, so the forecast doesn't jump around
  const [now] = useState(() => new Date());

  const days = useMemo(() => forecast(attempts, now, rangeDays, options), [attempts, now, rangeDays, options]);
  const goal = useMemo(() => forecastGoal(attempts, now, options), [attempts, now, options]);
  const sessions = days.flatMap((d) => d.sessions);
  const trainingDays = days.filter((d) => d.sessions.length).length;
  const first = sessions[0];
  const longest = sessions.reduce((m, s) => Math.max(m, s.targetSec), 0);

  return (
    <View style={{ gap: 14 }}>
      <Card>
        <H2>Forecast</H2>
        <Body muted>
          If {dog} is calm every time and every session hits its target. Any stress sign changes the plan, so treat this as a
          preview, not a schedule.
        </Body>
        <Row>
          {RANGES.map((r) => (
            <Chip key={r.days} label={r.label} selected={rangeDays === r.days} onPress={() => setRangeDays(r.days)} />
          ))}
        </Row>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Stat label="Next session" value={first ? formatDuration(first.targetSec) : '–'} />
        <Stat label={`Longest in ${RANGES.find((r) => r.days === rangeDays)?.label}`} value={longest ? formatDuration(longest) : '–'} />
        <Stat label="Absences" value={String(sessions.length)} />
        <Stat label="Training days" value={`${trainingDays} of ${rangeDays}`} />
      </View>

      <Card>
        <Label>8-hour goal</Label>
        <Body>
          {goal
            ? goal.sessions === 1
              ? 'The next session is already at the 8-hour goal.'
              : `At this pace ${dog} reaches 8 hours around ${goal.at.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long' })}, after ${goal.sessions} calm sessions.`
            : 'Not within the next 8 months at this pace.'}
        </Body>
      </Card>

      {sessions.length > 1 && (
        <Card>
          <H2>Planned durations</H2>
          <ForecastChart sessions={sessions} start={days[0].date} end={new Date(days[days.length - 1].date.getTime() + 86_400_000)} />
        </Card>
      )}

      <Card>
        <H2>Day by day</H2>
        {rangeDays > 21 ? <WeekList days={days} now={now} dog={dog} /> : <ForecastDayList days={days} now={now} dog={dog} />}
        {sessions.length === 0 && <Body muted>No sessions planned in this period (rest days).</Body>}
      </Card>
    </View>
  );
}

function WeekList({ days, now, dog }: { days: ForecastDay[]; now: Date; dog: string }) {
  const t = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  const weeks: ForecastDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <View>
      {weeks.map((w, i) => {
        const s = w.flatMap((d) => d.sessions);
        const main = s.filter((x) => x.kind !== 'easy');
        const from = main[0]?.targetSec;
        const to = main[main.length - 1]?.targetSec;
        return (
          <View key={i} style={{ borderTopWidth: 1, borderTopColor: t.border }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open === i }}
              onPress={() => setOpen(open === i ? null : i)}
              style={{ paddingVertical: 10, gap: 2 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
                  {fmt(w[0].date)} – {fmt(w[w.length - 1].date)}
                </Text>
                <Text style={{ color: t.accent, fontWeight: '600' }}>{open === i ? 'Hide' : 'Days'}</Text>
              </View>
              <Text style={{ color: t.textSecondary, fontSize: 14 }}>
                {s.length
                  ? `${from === to ? formatDuration(from ?? 0) : `${formatDuration(from ?? 0)} → ${formatDuration(to ?? 0)}`} · ${s.length} absence${s.length > 1 ? 's' : ''} · ${w.filter((d) => !d.sessions.length).length} rest day(s)`
                  : 'Rest'}
              </Text>
            </Pressable>
            {open === i && <ForecastDayList days={w} now={now} dog={dog} />}
          </View>
        );
      })}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexGrow: 1, flexBasis: '45%', backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 }}>
      <Label>{label}</Label>
      <Text style={{ color: t.text, fontSize: 20, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

// ---------- chart ----------

const H = 220;
const PAD = { top: 14, right: 16, bottom: 30, left: 46 };

function niceStep(maxMin: number): number {
  const raw = maxMin / 4;
  return [0.25, 0.5, 1, 2, 5, 10, 15, 20, 30, 60, 120].find((s) => s >= raw) ?? 120;
}
function tickLabel(min: number): string {
  if (min === 0) return '0';
  if (min < 1) return `${Math.round(min * 60)}s`;
  if (min >= 60) return `${+(min / 60).toFixed(1)}h`;
  return `${min}m`;
}

function ForecastChart({ sessions, start, end }: { sessions: ForecastSession[]; start: Date; end: Date }) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const chartRef = useRef<ComponentRef<typeof View>>(null);

  const maxMin = Math.max(0.5, ...sessions.map((s) => s.targetSec / 60)) * 1.1;
  const step = niceStep(maxMin);
  const top = Math.ceil(maxMin / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(2));
  const plotW = Math.max(10, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const span = Math.max(1, end.getTime() - start.getTime());
  const x = (d: Date) => PAD.left + ((d.getTime() - start.getTime()) / span) * plotW;
  const y = (min: number) => PAD.top + plotH - (min / top) * plotH;

  const pts = sessions.map((s, i) => ({ s, i, cx: x(s.at), cy: y(s.targetSec / 60) }));
  const main = pts.filter((p) => p.s.kind !== 'easy');
  const path = main.map((p, k) => `${k ? 'L' : 'M'}${p.cx},${p.cy}`).join(' ');
  const r = sessions.length > 40 ? 3 : 4.5;
  const xLabels = [start, new Date(start.getTime() + span / 2), new Date(end.getTime() - 1)];
  const selected = sel !== null ? sessions[sel] : null;

  const pick = (lx: number) => {
    let best = 0;
    pts.forEach((p, k) => {
      if (Math.abs(p.cx - lx) < Math.abs(pts[best].cx - lx)) best = k;
    });
    setSel(best);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 6 }}>
        <Legend label="Planned absence">
          <Circle cx={8} cy={8} r={4.5} fill={t.accent} />
        </Legend>
        <Legend label="Easy session">
          <Circle cx={8} cy={8} r={4} fill={t.surface} stroke={t.accent} strokeWidth={1.5} />
        </Legend>
      </View>
      <View ref={chartRef} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: H }}>
        {width > 0 && (
          <Svg width={width} height={H} accessibilityLabel="Chart of planned absence durations">
            {ticks.map((tk) => (
              <G key={tk}>
                <Line x1={PAD.left} x2={PAD.left + plotW} y1={y(tk)} y2={y(tk)} stroke={t.grid} strokeWidth={1} />
                <SvgText x={PAD.left - 8} y={y(tk) + 4} fontSize={11} fill={t.textMuted} textAnchor="end">
                  {tickLabel(tk)}
                </SvgText>
              </G>
            ))}
            {xLabels.map((d, k) => (
              <SvgText key={k} x={x(d)} y={H - 10} fontSize={11} fill={t.textMuted} textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'}>
                {d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </SvgText>
            ))}
            {selected && <Line x1={x(selected.at)} x2={x(selected.at)} y1={PAD.top} y2={PAD.top + plotH} stroke={t.textMuted} strokeDasharray="3,3" />}
            <Path d={path} stroke={t.accent} strokeWidth={2} fill="none" strokeLinejoin="round" />
            {pts.map((p) =>
              p.s.kind === 'easy' ? (
                <Circle key={p.i} cx={p.cx} cy={p.cy} r={r} fill={t.surface} stroke={t.accent} strokeWidth={1.5} />
              ) : (
                <Circle key={p.i} cx={p.cx} cy={p.cy} r={sel === p.i ? r + 2 : r} fill={t.accent} stroke={t.surface} strokeWidth={1.5} />
              ),
            )}
          </Svg>
        )}
        {/* Transparent layer on top. The web press event has no locationX, so use pageX minus the chart's position on screen. */}
        <Pressable
          accessibilityLabel="Select a session in the chart"
          onPress={(e) => {
            const pageX = e.nativeEvent.pageX;
            chartRef.current?.measure((_x, _y, _w, _h, left) => pick(pageX - left));
          }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </View>
      <View style={{ minHeight: 44, marginTop: 6, padding: 10, borderRadius: 10, backgroundColor: t.surfaceAlt }}>
        <Text style={{ color: selected ? t.text : t.textSecondary, fontSize: 14 }}>
          {selected
            ? `${selected.at.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatDuration(selected.targetSec)} · ${KIND_WORD[selected.kind]}`
            : 'Tap the chart to see a session.'}
        </Text>
      </View>
    </View>
  );
}

function Legend({ label, children }: { label: string; children: React.ReactNode }) {
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
