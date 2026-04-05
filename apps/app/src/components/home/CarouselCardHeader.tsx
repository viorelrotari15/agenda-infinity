import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';

type Props = {
  description: string;

  canPrev: boolean;

  canNext: boolean;

  onPrev: () => void;

  onNext: () => void;
};

export function CarouselCardHeader({ description, canPrev, canNext, onPrev, onNext }: Props) {
  const { t } = useTranslation();

  return (
    <div className="carousel-header">
      <p className="ui-muted">{description}</p>

      <div className="ui-actions">
        <Button variant="ghost" disabled={!canPrev} onClick={onPrev}>
          {t('carousel.prev')}
        </Button>

        <Button variant="ghost" disabled={!canNext} onClick={onNext}>
          {t('carousel.next')}
        </Button>
      </div>
    </div>
  );
}
