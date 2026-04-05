import { useTranslation } from 'react-i18next';
import { getLocaleTag } from '../../i18n/i18n';
import type { AgendaEntry } from './agendaUtils';
import { bookingStatusClass, bookingStatusLabel } from './bookingStatusUi';
import { formatDayHeading, groupByDay, startOfLocalDay } from './agendaUtils';

type Props = {
  entries: AgendaEntry[];
  onSessionClick?: (id: string) => void;
  statusPerspective?: 'specialist' | 'client';
};

export function AgendaGroupedList({
  entries,
  onSessionClick,
  statusPerspective = 'specialist',
}: Props) {
  const { t } = useTranslation();
  const loc = getLocaleTag();
  const grouped = groupByDay(entries);
  const keys = Array.from(grouped.keys()).sort();

  if (keys.length === 0) {
    return (
      <div className="agenda-empty">
        <p className="agenda-empty-title">{t('agenda.emptySessions')}</p>
        <p className="agenda-empty-hint">{t('agenda.emptySessionsHint')}</p>
      </div>
    );
  }

  return (
    <div className="agenda-grouped">
      {keys.map((key) => {
        const [y, m, d] = key.split('-').map(Number);
        const day = startOfLocalDay(new Date(y, m - 1, d));
        const dayItems = grouped.get(key) ?? [];
        return (
          <section key={key} className="agenda-day-group">
            <h3 className="agenda-day-group-title">{formatDayHeading(day)}</h3>
            <ul className="agenda-card-list">
              {dayItems.map((ev) => {
                const start = new Date(ev.start);
                const end = new Date(ev.end);
                const timeFmt = new Intl.DateTimeFormat(loc, {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
                const body = (
                  <>
                    <div className="agenda-session-card-accent" aria-hidden />
                    <div className="agenda-session-card-body">
                      <div className="agenda-session-card-top">
                        <span className={bookingStatusClass(ev.status)}>
                          {bookingStatusLabel(ev.status, statusPerspective)}
                        </span>
                        <span className="agenda-session-time">
                          {timeFmt.format(start)} – {timeFmt.format(end)}
                          <span className="agenda-session-dur">
                            {' '}
                            · {t('agenda.min', { count: durMin })}
                          </span>
                        </span>
                      </div>
                      <h4 className="agenda-session-title">{ev.title}</h4>
                      {ev.subtitle ? <p className="agenda-session-sub">{ev.subtitle}</p> : null}
                    </div>
                  </>
                );
                return (
                  <li key={ev.id} className="agenda-session-card-wrap">
                    {onSessionClick ? (
                      <button
                        type="button"
                        className="agenda-session-card agenda-session-card--clickable"
                        onClick={() => onSessionClick(ev.id)}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="agenda-session-card">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
