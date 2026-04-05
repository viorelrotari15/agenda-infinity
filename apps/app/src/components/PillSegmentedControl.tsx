import { IonIcon, IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';

export type PillSegmentOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
  /** ionicons icon data (optional) */
  icon?: string;
};

type Props<T extends string> = {
  value: T;
  options: readonly PillSegmentOption<T>[];
  onChange: (value: T) => void;
  /** Appended to `pill-segmented-control` for layout (e.g. margins). */
  className?: string;
  /** When true, segment scrolls horizontally (useful for many options). */
  scrollable?: boolean;
};

export function PillSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className = '',
  scrollable = false,
}: Props<T>) {
  return (
    <IonSegment
      mode="ios"
      scrollable={scrollable}
      className={`pill-segmented-control ${className}`.trim()}
      value={value}
      onIonChange={(e) => {
        const v = e.detail.value as T | undefined;
        if (v != null && v !== '') onChange(v);
      }}
    >
      {options.map((opt) => (
        <IonSegmentButton key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.icon ? (
            <IonIcon icon={opt.icon} className="pill-segmented-control__icon" aria-hidden />
          ) : null}
          <IonLabel>{opt.label}</IonLabel>
        </IonSegmentButton>
      ))}
    </IonSegment>
  );
}
