import { useEffect } from 'react';

const STYLES = {
  success: {
    icon: 'check_circle',
    shell: 'bg-primary-container text-on-primary',
  },
  error: {
    icon: 'error',
    shell: 'bg-error-container text-on-error-container',
  },
  info: {
    icon: 'info',
    shell: 'bg-surface-container-highest text-on-surface',
  },
};

export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  if (!toast) {
    return null;
  }

  const style = STYLES[toast.type] || STYLES.info;

  return (
    <div className="fixed bottom-6 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm sm:right-6">
      <div
        className={`flex items-start gap-3 rounded-lg p-4 shadow-xl ${style.shell}`}
        role="status"
      >
        <span className="material-symbols-outlined text-[22px]">{style.icon}</span>
        <p className="flex-1 font-body-sm text-body-sm leading-relaxed">{toast.message}</p>
        <button
          aria-label="Fermer la notification"
          className="rounded-full p-0.5 opacity-80 transition-opacity hover:opacity-100"
          onClick={onDismiss}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}
