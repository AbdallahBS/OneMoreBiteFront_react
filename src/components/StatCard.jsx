export default function StatCard({ icon, label, value, hint, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary-fixed text-primary',
    secondary: 'bg-secondary-fixed text-on-secondary-fixed',
    tertiary: 'bg-tertiary-fixed text-on-tertiary-fixed',
    neutral: 'bg-surface-container-high text-on-surface',
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-6 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${tones[tone]}`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div>
        <p className="font-display-xl text-headline-lg font-extrabold tracking-tight text-on-surface">
          {value}
        </p>
        <p className="font-label-lg text-label-lg text-on-surface">{label}</p>
        {hint ? <p className="mt-1 font-body-sm text-body-sm text-outline">{hint}</p> : null}
      </div>
    </div>
  );
}
