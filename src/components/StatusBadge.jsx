const STATUS = {
  EN_ATTENTE: {
    label: 'En attente',
    className: 'bg-tertiary-fixed text-on-tertiary-fixed',
    icon: 'hourglass_top',
  },
  CONFIRMEE: {
    label: 'Confirmée',
    className: 'bg-primary-fixed text-on-primary-fixed',
    icon: 'check_circle',
  },
  RECUPEREE: {
    label: 'Retirée',
    className: 'bg-secondary-container text-on-secondary-container',
    icon: 'task_alt',
  },
  REFUSEE: {
    label: 'Refusée',
    className: 'bg-error-container text-on-error-container',
    icon: 'cancel',
  },
  ANNULEE: {
    label: 'Annulée',
    className: 'bg-surface-container-high text-on-surface-variant',
    icon: 'block',
  },
};

export default function StatusBadge({ status }) {
  const style = STATUS[String(status || '').toUpperCase()] || {
    label: status || 'Inconnu',
    className: 'bg-surface-container-high text-on-surface-variant',
    icon: 'help',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-label-sm text-label-sm ${style.className}`}
    >
      <span className="material-symbols-outlined text-[14px]">{style.icon}</span>
      {style.label}
    </span>
  );
}
