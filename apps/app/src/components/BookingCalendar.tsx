import { useCallback, useEffect, useMemo, useState } from 'react';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { getLocaleTag } from '../i18n/i18n';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useOccupiedSlotsQuery } from '../hooks/queries/useOccupiedSlotsQuery';
import { useSpecialistWorkingHoursQuery } from '../hooks/queries/useSpecialistWorkingHoursQuery';
import {
  bookingTimelinePlacement,
  dayWorkingMinutesRange,
  isWithinWorkingHours,
  slotTimeRange,
} from '../lib/bookingCalendarUtils';
import {
  addDays,
  isSameLocalDay,
  localDateKey,
  startOfLocalDay,
  startOfWeekMonday,
} from './agenda/agendaUtils';

const EMPTY_OCCUPIED_SLOTS: Array<{ start: string; end: string }> = [];
const SLOT_DURATION_MS = 30 * 60 * 1000;

interface Props {
  specialistId: string;
  serviceId: string;
  occupiedSlots: Array<{ start: string; end: string }>;
  selectedStart?: string;
  selectedEnd?: string;
  refreshNonce?: number;
  onSelectSlot: (isoStart: string) => void;
  onServerOccupiedSlotsChange?: (slots: Array<{ start: string; end: string }>) => void;
}

function slotsOverlappingDay(
  slots: Array<{ start: string; end: string }>,
  day: Date,
): Array<{ start: string; end: string }> {
  const day0 = startOfLocalDay(day);
  const day1 = addDays(day0, 1);
  const t0 = day0.getTime();
  const t1 = day1.getTime();
  return slots.filter((s) => {
    const es = new Date(s.start).getTime();
    const ee = new Date(s.end).getTime();
    return es < t1 && ee > t0;
  });
}

export default function BookingCalendar({
  specialistId,
  serviceId: _serviceId,
  occupiedSlots,
  selectedStart,
  selectedEnd,
  refreshNonce = 0,
  onSelectSlot,
  onServerOccupiedSlotsChange,
}: Props) {
  void _serviceId;
  const { t } = useTranslation();
  const loc = getLocaleTag();

  const [focusDay, setFocusDay] = useState(() => startOfLocalDay(new Date()));

  const workingHoursQuery = useSpecialistWorkingHoursQuery(specialistId);

  const workingRules = useMemo(
    () => (Array.isArray(workingHoursQuery.data) ? workingHoursQuery.data : []),
    [workingHoursQuery.data],
  );

  const fallbackRange = useMemo(() => slotTimeRange(workingRules), [workingRules]);

  const occupiedRange = useMemo(() => {
    const ws = startOfWeekMonday(focusDay);
    const we = addDays(ws, 7);
    return { from: ws.toISOString(), to: we.toISOString() };
  }, [focusDay]);

  const occupiedQuery = useOccupiedSlotsQuery(specialistId, occupiedRange, refreshNonce);

  const fetchedOccupiedSlots = useMemo(
    () => occupiedQuery.data ?? EMPTY_OCCUPIED_SLOTS,
    [occupiedQuery.data],
  );

  useEffect(() => {
    if (!specialistId) {
      onServerOccupiedSlotsChange?.(EMPTY_OCCUPIED_SLOTS);
      return;
    }
    if (occupiedQuery.isError) {
      onServerOccupiedSlotsChange?.(EMPTY_OCCUPIED_SLOTS);
      return;
    }
    if (occupiedQuery.isSuccess) {
      onServerOccupiedSlotsChange?.(fetchedOccupiedSlots);
    }
  }, [
    specialistId,
    occupiedQuery.isError,
    occupiedQuery.isSuccess,
    fetchedOccupiedSlots,
    onServerOccupiedSlotsChange,
  ]);

  useEffect(() => {
    if (!selectedStart) return;
    const d = startOfLocalDay(new Date(selectedStart));
    setFocusDay((prev) => (isSameLocalDay(d, prev) ? prev : d));
  }, [selectedStart]);

  const mergedOccupied = useMemo(() => {
    const seen = new Set<string>();
    return [...fetchedOccupiedSlots, ...occupiedSlots].filter((s) => {
      const k = `${s.start}\0${s.end}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [fetchedOccupiedSlots, occupiedSlots]);

  const dayOccupied = useMemo(
    () => slotsOverlappingDay(mergedOccupied, focusDay),
    [mergedOccupied, focusDay],
  );

  const dayRange = useMemo(() => {
    if (!workingHoursQuery.isSuccess || !workingRules.length) return null;
    return dayWorkingMinutesRange(workingRules, focusDay);
  }, [workingRules, workingHoursQuery.isSuccess, focusDay]);

  const hourLabels = useMemo(() => {
    if (dayRange) {
      const startH = Math.floor(dayRange.startMin / 60);
      const endH = Math.ceil(dayRange.endMin / 60);
      const labels: number[] = [];
      for (let h = startH; h <= endH; h++) labels.push(h);
      return labels;
    }
    const parseHm = (s: string) => {
      const [hh = 8, mm = 0] = s.split(':').map((x) => Number(x) || 0);
      return { h: hh, m: mm };
    };
    const a = parseHm(fallbackRange.slotMinTime);
    const b = parseHm(fallbackRange.slotMaxTime);
    const startH = a.h;
    const endH = b.h;
    const labels: number[] = [];
    for (let h = startH; h <= endH; h++) labels.push(h);
    return labels;
  }, [dayRange, fallbackRange]);

  const timelineRangeMin = useMemo(() => {
    if (dayRange) return dayRange;
    const parseHm = (s: string) => {
      const [hh = 8, mm = 0] = s.split(':').map((x) => Number(x) || 0);
      return hh * 60 + mm;
    };
    return {
      startMin: parseHm(fallbackRange.slotMinTime),
      endMin: parseHm(fallbackRange.slotMaxTime),
    };
  }, [dayRange, fallbackRange]);

  const allOccupiedForAllow = mergedOccupied;

  const selectAllowSlot = useCallback(
    (start: Date, end: Date) => {
      if (start.getTime() < Date.now()) return false;
      if (!workingHoursQuery.isSuccess || !workingRules.length) return false;
      if (!isWithinWorkingHours(start, end, workingRules)) return false;
      const t0 = start.getTime();
      const t1 = end.getTime();
      const overlaps = allOccupiedForAllow.some((slot) => {
        const slotStart = new Date(slot.start).getTime();
        const slotEnd = new Date(slot.end).getTime();
        return t0 < slotEnd && t1 > slotStart;
      });
      return !overlaps;
    },
    [allOccupiedForAllow, workingRules, workingHoursQuery.isSuccess],
  );

  const handleTimelinePointer = useCallback(
    (clientY: number, target: HTMLDivElement) => {
      if (!dayRange) return;
      const rect = target.getBoundingClientRect();
      const y = clientY - rect.top;
      const pct = Math.min(1, Math.max(0, y / rect.height));
      const totalMin = dayRange.endMin - dayRange.startMin;
      const clickedMin = dayRange.startMin + pct * totalMin;
      const snapped = Math.round(clickedMin / 30) * 30;
      const clamped = Math.min(Math.max(snapped, dayRange.startMin), dayRange.endMin - 30);
      const start = new Date(focusDay);
      start.setHours(0, 0, 0, 0);
      start.setMinutes(clamped);
      const end = new Date(start.getTime() + SLOT_DURATION_MS);
      if (!selectAllowSlot(start, end)) return;
      onSelectSlot(start.toISOString());
    },
    [dayRange, focusDay, onSelectSlot, selectAllowSlot],
  );

  const onTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const today = startOfLocalDay(new Date());
      if (focusDay.getTime() < today.getTime()) return;
      handleTimelinePointer(e.clientY, e.currentTarget);
    },
    [focusDay, handleTimelinePointer],
  );

  const weekStart = startOfWeekMonday(focusDay);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStart = startOfLocalDay(new Date());

  const weekDaySlotScores = useMemo(() => {
    if (!workingHoursQuery.isSuccess || !workingRules.length) return new Map<string, number>();
    const m = new Map<string, number>();
    for (const d of weekDays) {
      const dayStart = startOfLocalDay(d);
      if (dayStart.getTime() < todayStart.getTime()) {
        m.set(localDateKey(d), 0);
        continue;
      }
      const range = dayWorkingMinutesRange(workingRules, d);
      if (!range) {
        m.set(localDateKey(d), 0);
        continue;
      }
      let count = 0;
      for (let min = range.startMin; min <= range.endMin - 30; min += 30) {
        const start = new Date(dayStart);
        start.setMinutes(min);
        const end = new Date(start.getTime() + SLOT_DURATION_MS);
        if (!selectAllowSlot(start, end)) continue;
        count++;
      }
      m.set(localDateKey(d), count);
    }
    return m;
  }, [selectAllowSlot, todayStart, weekDays, workingHoursQuery.isSuccess, workingRules]);

  const heading = new Intl.DateTimeFormat(loc, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(focusDay);

  const sub = new Intl.DateTimeFormat(loc, { year: 'numeric' }).format(focusDay);

  const nowIndicatorPct = useMemo(() => {
    if (!dayRange || !isSameLocalDay(focusDay, new Date())) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    if (nowMin < dayRange.startMin || nowMin > dayRange.endMin) return null;
    const total = dayRange.endMin - dayRange.startMin;
    return ((nowMin - dayRange.startMin) / total) * 100;
  }, [dayRange, focusDay]);

  const selectedPlacement = useMemo(() => {
    if (!selectedStart || !selectedEnd || !dayRange) return null;
    return bookingTimelinePlacement(
      new Date(selectedStart),
      new Date(selectedEnd),
      focusDay,
      dayRange,
    );
  }, [selectedStart, selectedEnd, focusDay, dayRange]);

  const gridSegments = Math.max(1, hourLabels.length - 1);

  const loading = workingHoursQuery.isPending;

  return (
    <div className="agenda-day-plan booking-day-plan">
      <div className="agenda-day-nav">
        <IonButton
          fill="clear"
          onClick={() => {
            const next = addDays(focusDay, -1);
            if (next.getTime() < todayStart.getTime()) setFocusDay(todayStart);
            else setFocusDay(startOfLocalDay(next));
          }}
          aria-label={t('agenda.previousDay')}
        >
          <IonIcon slot="icon-only" icon={chevronBackOutline} />
        </IonButton>
        <div className="agenda-day-nav-center">
          <p className="agenda-day-nav-title">{heading}</p>
          <p className="agenda-day-nav-sub">{sub}</p>
          {!isSameLocalDay(focusDay, new Date()) ? (
            <IonButton
              size="small"
              fill="outline"
              className="agenda-today-btn"
              onClick={() => setFocusDay(startOfLocalDay(new Date()))}
            >
              {t('agenda.today')}
            </IonButton>
          ) : null}
        </div>
        <IonButton
          fill="clear"
          onClick={() => setFocusDay(startOfLocalDay(addDays(focusDay, 1)))}
          aria-label={t('agenda.nextDay')}
        >
          <IonIcon slot="icon-only" icon={chevronForwardOutline} />
        </IonButton>
      </div>

      <div className="agenda-week-strip" role="tablist" aria-label={t('agenda.weekAria')}>
        {weekDays.map((d) => {
          const selected = isSameLocalDay(d, focusDay);
          const isToday = isSameLocalDay(d, new Date());
          const dayStart = startOfLocalDay(d);
          const isPastDay = dayStart.getTime() < todayStart.getTime();
          const label = new Intl.DateTimeFormat(loc, { weekday: 'narrow' }).format(d);
          const num = d.getDate();
          const score = weekDaySlotScores.get(localDateKey(d)) ?? 0;
          const scoreTone = score === 0 ? 'zero' : score <= 3 ? 'low' : score <= 8 ? 'mid' : 'high';
          return (
            <button
              key={localDateKey(d)}
              type="button"
              role="tab"
              disabled={isPastDay}
              aria-selected={selected}
              className={`agenda-week-day ${selected ? 'agenda-week-day--selected' : ''} ${isToday ? 'agenda-week-day--today' : ''} ${isPastDay ? 'agenda-week-day--past' : ''}`}
              onClick={() => {
                if (isPastDay) return;
                setFocusDay(dayStart);
              }}
            >
              <span className="agenda-week-day-label">{label}</span>
              <span className="agenda-week-day-num">{num}</span>
              {!isPastDay ? (
                <span
                  className={`agenda-week-day-score agenda-week-day-score--${scoreTone}`}
                  aria-label={t('agenda.availableSlotsCount', { count: score })}
                >
                  {score}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div
          className="booking-day-plan-loading"
          aria-busy="true"
          aria-label={t('agenda.loadingAvailability')}
        >
          <IonSpinner name="crescent" color="primary" />
        </div>
      ) : workingHoursQuery.isError ? (
        <div className="booking-day-plan-unavailable">
          <p className="booking-day-plan-unavailable-title">{t('agenda.hoursLoadError')}</p>
          <p className="booking-day-plan-unavailable-hint">{t('agenda.hoursLoadHint')}</p>
        </div>
      ) : workingHoursQuery.isSuccess && workingRules.length > 0 && !dayRange ? (
        <div className="booking-day-plan-unavailable">
          <p className="booking-day-plan-unavailable-title">{t('agenda.noAvailability')}</p>
          <p className="booking-day-plan-unavailable-hint">{t('agenda.noAvailabilityHint')}</p>
        </div>
      ) : (
        <div className="agenda-timeline-wrap">
          <div className="agenda-timeline-hours" aria-hidden="true">
            {hourLabels.map((h) => (
              <div key={h} className="agenda-timeline-hour-row">
                <span className="agenda-timeline-hour-label">
                  {new Intl.DateTimeFormat(loc, { hour: 'numeric' }).format(
                    new Date(2000, 0, 1, h, 0, 0),
                  )}
                </span>
              </div>
            ))}
          </div>
          <div
            className={`agenda-timeline-track ${dayRange ? 'agenda-timeline-track--interactive' : ''}`}
            onClick={dayRange ? onTimelineClick : undefined}
            aria-label={dayRange ? t('agenda.chooseTimeline') : undefined}
          >
            <div className="agenda-timeline-grid">
              {Array.from({ length: Math.max(0, hourLabels.length - 2) }, (_, i) => (
                <div
                  key={i}
                  className="agenda-timeline-grid-line"
                  style={{ top: `${((i + 1) / gridSegments) * 100}%` }}
                />
              ))}
            </div>
            {nowIndicatorPct != null ? (
              <div
                className="booking-timeline-now-line"
                style={{ top: `${nowIndicatorPct}%` }}
                aria-hidden="true"
              />
            ) : null}
            {!workingRules.length ? (
              <div className="agenda-timeline-empty">
                <p className="agenda-timeline-empty-title">{t('agenda.hoursNotSet')}</p>
                <p className="agenda-timeline-empty-hint">{t('agenda.hoursNotSetHint')}</p>
              </div>
            ) : !dayRange ? null : dayOccupied.length === 0 && !selectedPlacement ? (
              <div className="agenda-timeline-empty booking-timeline-empty-soft">
                <p className="agenda-timeline-empty-title">{t('agenda.pickTime')}</p>
                <p className="agenda-timeline-empty-hint">{t('agenda.pickTimeHint')}</p>
              </div>
            ) : null}
            {dayOccupied.map((slot, i) => {
              const pos = bookingTimelinePlacement(
                new Date(slot.start),
                new Date(slot.end),
                focusDay,
                timelineRangeMin,
              );
              if (!pos) return null;
              return (
                <div
                  key={`${slot.start}-${slot.end}-${i}`}
                  className="agenda-block agenda-block--booking-occupied"
                  style={{
                    top: `${pos.topPct}%`,
                    height: `${pos.heightPct}%`,
                  }}
                >
                  <div className="agenda-block-inner">
                    <span className="agenda-block-title">{t('agenda.booked')}</span>
                  </div>
                </div>
              );
            })}
            {selectedPlacement ? (
              <div
                className="agenda-block agenda-block--booking-selected"
                style={{
                  top: `${selectedPlacement.topPct}%`,
                  height: `${selectedPlacement.heightPct}%`,
                }}
              >
                <div className="agenda-block-inner">
                  <span className="agenda-block-time">
                    {new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit' }).format(
                      new Date(selectedStart!),
                    )}
                    {' – '}
                    {new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit' }).format(
                      new Date(selectedEnd!),
                    )}
                  </span>
                  <span className="agenda-block-title">{t('agenda.yourSelection')}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
