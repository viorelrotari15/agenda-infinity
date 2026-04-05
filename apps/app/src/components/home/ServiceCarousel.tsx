import { useEffect, useRef, useState } from 'react';
import type { ServiceDto } from '@agenda/shared';
import { useTranslation } from 'react-i18next';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CarouselCardHeader } from './CarouselCardHeader';

const SWIPE_THRESHOLD = 40;

type Props = {
  services: ServiceDto[];
  specialistId: string;
  isMobileViewport: boolean;
  selectedServiceId: string;
  onSelectServiceAndGoToCalendar: (serviceId: string) => void;
};

export function ServiceCarousel({
  services,
  specialistId,
  isMobileViewport,
  selectedServiceId,
  onSelectServiceAndGoToCalendar,
}: Props) {
  const { t } = useTranslation();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const visibleCount = isMobileViewport ? 1 : 3;
  const servicePage = services.slice(carouselIndex, carouselIndex + visibleCount);
  const canPrev = carouselIndex > 0;
  const canNext = carouselIndex + visibleCount < services.length;

  useEffect(() => {
    setCarouselIndex(0);
  }, [services.length, specialistId]);

  const goToPrev = () => setCarouselIndex((prev) => Math.max(0, prev - 1));
  const goToNext = () =>
    setCarouselIndex((prev) => Math.min(Math.max(0, services.length - visibleCount), prev + 1));

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
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

  return (
    <Card className="ui-elevated">
      <CardHeader>
        <CardTitle>Services Carousel</CardTitle>
      </CardHeader>
      <CardContent>
        <CarouselCardHeader
          description="Choose a service before selecting a slot."
          canPrev={canPrev}
          canNext={canNext}
          onPrev={goToPrev}
          onNext={goToNext}
        />
        <div
          className="service-carousel"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {servicePage.map((service) => (
            <button
              type="button"
              key={service.id}
              className={`service-slide ${selectedServiceId === service.id ? 'service-slide-selected' : ''}`}
              onClick={() => onSelectServiceAndGoToCalendar(service.id)}
            >
              <h3>{service.name}</h3>
              <p>{t('serviceCarousel.minutes', { count: service.durationMinutes })}</p>
              <p>{t('serviceCarousel.buffer', { count: service.bufferMinutes })}</p>
              {selectedServiceId === service.id ? (
                <Badge>{t('serviceCarousel.selected')}</Badge>
              ) : null}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
