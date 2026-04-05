import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CarouselCardHeader } from './CarouselCardHeader';

const SWIPE_THRESHOLD = 40;

type Props = {
  photos: string[];
  specialistId: string;
  displayName: string;
};

export function PhotoCarousel({ photos, specialistId, displayName }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const canPrev = index > 0;
  const canNext = index + 1 < photos.length;

  useEffect(() => {
    setIndex(0);
  }, [specialistId]);

  const goToPrev = () => setIndex((prev) => Math.max(0, prev - 1));
  const goToNext = () => setIndex((prev) => Math.min(Math.max(0, photos.length - 1), prev + 1));

  const handleTouchStart = (event: React.TouchEvent<HTMLImageElement>) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLImageElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX ?? null;
    touchStartXRef.current = null;
    if (startX == null || endX == null) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0 && canNext) {
      goToNext();
    } else if (deltaX > 0 && canPrev) {
      goToPrev();
    }
  };

  if (photos.length === 0) return null;

  return (
    <Card className="ui-elevated">
      <CardHeader>
        <CardTitle>{t('photoCarousel.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <CarouselCardHeader
          description={t('photoCarousel.description')}
          canPrev={canPrev}
          canNext={canNext}
          onPrev={goToPrev}
          onNext={goToNext}
        />
        <img
          className="photo-carousel-image"
          src={photos[index]}
          alt={`${displayName} photo ${index + 1}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      </CardContent>
    </Card>
  );
}
