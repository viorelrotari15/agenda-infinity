import { useTranslation } from 'react-i18next';

import { Badge } from '../ui/badge';

import { Card, CardContent } from '../ui/card';

type Props = {
  displayName: string;

  heroPhotoUrl: string;

  specializations?: string[];

  licenses?: string[];
};

export function SpecialistHeroCard({
  displayName,

  heroPhotoUrl,

  specializations,

  licenses,
}: Props) {
  const { t } = useTranslation();

  const defaultSpecs = t('specialistHero.defaultSpecs', { returnObjects: true }) as string[];

  const defaultLicenses = t('specialistHero.defaultLicenses', { returnObjects: true }) as string[];

  const specList = specializations ?? defaultSpecs;

  const licenseList = licenses ?? defaultLicenses;

  return (
    <Card className="ui-elevated specialist-hero-card">
      <CardContent>
        <div className="specialist-hero-layout">
          <img
            className="specialist-hero-photo"
            src={heroPhotoUrl}
            alt={`${displayName} profile`}
          />

          <div>
            <h2 className="specialist-hero-title">{displayName}</h2>

            <p className="ui-muted specialist-hero-about">{t('specialistHero.about')}</p>

            <div className="specialist-info-grid">
              <div>
                <p className="ui-label">{t('specialistHero.specsTitle')}</p>

                <div className="tag-wrap">
                  {specList.map((item) => (
                    <Badge key={item}>{item}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="ui-label">{t('specialistHero.licensesTitle')}</p>

                <ul className="license-list">
                  {licenseList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
