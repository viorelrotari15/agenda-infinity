import { useTranslation } from 'react-i18next';
import { PillSegmentedControl } from '../PillSegmentedControl';

export type HomeView = 'specialist' | 'calendar';

type Props = {
  value: HomeView;
  onChange: (view: HomeView) => void;
};

export function HomeViewSegment({ value, onChange }: Props) {
  const { t } = useTranslation();
  const options: { value: HomeView; label: string }[] = [
    { value: 'specialist', label: t('home.viewSpecialist') },
    { value: 'calendar', label: t('home.viewCalendar') },
  ];
  return <PillSegmentedControl value={value} options={options} onChange={onChange} />;
}
