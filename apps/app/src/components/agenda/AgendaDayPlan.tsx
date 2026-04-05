import { IonButton, IonIcon } from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { getLocaleTag } from '../../i18n/i18n';
import {
  AGENDA_DAY_END_HOUR,
  AGENDA_DAY_START_HOUR,
  addDays,
  entriesForDay,
  type AgendaEntry,
  startOfLocalDay,
  isSameLocalDay,
  localDateKey,
  startOfWeekMonday,
  timelinePlacement,
} from './agendaUtils';

type Props = {
  focusDay: Date;
  onDayChange: (d: Date) => void;
  entries: AgendaEntry[];
  onSessionClick?: (id: string) => void;
};

const HOUR_LABELS: number[] = [];
for (let h = AGENDA_DAY_START_HOUR; h <= AGENDA_DAY_END_HOUR; h++) {
  HOUR_LABELS.push(h);
}

export function AgendaDayPlan({ focusDay, onDayChange, entries, onSessionClick }: Props) {
  const { t } = useTranslation();
  const loc = getLocaleTag();
  const dayEntries = entriesForDay(entries, focusDay);
  const weekStart = startOfWeekMonday(focusDay);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const heading = new Intl.DateTimeFormat(loc, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(focusDay);

  const sub = new Intl.DateTimeFormat(loc, { year: 'numeric' }).format(focusDay);

  return (
    <div className="agenda-day-plan">
      <div className="agenda-day-nav">
        <IonButton
          fill="clear"
          onClick={() => onDayChange(addDays(focusDay, -1))}
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
              onClick={() => onDayChange(startOfLocalDay(new Date()))}
            >
              {t('agenda.today')}
            </IonButton>
          ) : null}
        </div>
        <IonButton
          fill="clear"
          onClick={() => onDayChange(addDays(focusDay, 1))}
          aria-label={t('agenda.nextDay')}
        >
          <IonIcon slot="icon-only" icon={chevronForwardOutline} />
        </IonButton>
      </div>

      <div className="agenda-week-strip" role="tablist" aria-label={t('agenda.weekAria')}>
        {weekDays.map((d) => {
          const dKey = localDateKey(d);
          const selected = isSameLocalDay(d, focusDay);
          const isToday = isSameLocalDay(d, new Date());
          const label = new Intl.DateTimeFormat(loc, { weekday: 'narrow' }).format(d);
          const num = d.getDate();
          return (
            <button
              key={dKey}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`agenda-week-day ${selected ? 'agenda-week-day--selected' : ''} ${isToday ? 'agenda-week-day--today' : ''}`}
              onClick={() => onDayChange(startOfLocalDay(d))}
            >
              <span className="agenda-week-day-label">{label}</span>
              <span className="agenda-week-day-num">{num}</span>
            </button>
          );
        })}
      </div>

      <div className="agenda-timeline-wrap">
        <div className="agenda-timeline-hours" aria-hidden="true">
          {HOUR_LABELS.map((h) => (
            <div key={h} className="agenda-timeline-hour-row">
              <span className="agenda-timeline-hour-label">
                {new Intl.DateTimeFormat(loc, { hour: 'numeric' }).format(
                  new Date(2000, 0, 1, h, 0, 0),
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="agenda-timeline-track">
          <div className="agenda-timeline-grid">
            {Array.from({ length: Math.max(0, HOUR_LABELS.length - 2) }, (_, i) => {
              const segments = HOUR_LABELS.length - 1;
              return (
                <div
                  key={i}
                  className="agenda-timeline-grid-line"
                  style={{ top: `${((i + 1) / segments) * 100}%` }}
                />
              );
            })}
          </div>
          {dayEntries.length === 0 ? (
            <div className="agenda-timeline-empty">
              <p className="agenda-timeline-empty-title">{t('agenda.clearSchedule')}</p>
              <p className="agenda-timeline-empty-hint">{t('agenda.clearScheduleHint')}</p>
            </div>
          ) : (
            dayEntries.map((ev) => {
              const start = new Date(ev.start);
              const end = new Date(ev.end);
              const pos = timelinePlacement(start, end, focusDay);
              if (!pos) return null;
              const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
              return (
                <div
                  key={ev.id}
                  role={onSessionClick ? 'button' : undefined}
                  tabIndex={onSessionClick ? 0 : undefined}
                  className={`agenda-block agenda-block--${String(ev.status).toLowerCase()} ${
                    onSessionClick ? 'agenda-block--interactive' : ''
                  }`}
                  style={{
                    top: `${pos.topPct}%`,
                    height: `${pos.heightPct}%`,
                  }}
                  onClick={onSessionClick ? () => onSessionClick(ev.id) : undefined}
                  onKeyDown={
                    onSessionClick
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSessionClick(ev.id);
                          }
                        }
                      : undefined
                  }
                >
                  <div className="agenda-block-inner">
                    <span className="agenda-block-time">
                      {new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit' }).format(
                        start,
                      )}
                      {' – '}
                      {new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit' }).format(
                        end,
                      )}
                    </span>
                    <span className="agenda-block-title">{ev.title}</span>
                    {durMin >= 25 ? (
                      <span className="agenda-block-meta">
                        {t('agenda.min', { count: durMin })}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
