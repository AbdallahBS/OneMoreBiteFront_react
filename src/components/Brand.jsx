import { Link } from 'react-router-dom';

export default function Brand({ subtitle = 'Du bon goût à petit prix...', to = '/', light = false }) {
  return (
    <Link className="flex items-center gap-2.5 shrink-0 group" to={to}>
      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm relative group-hover:scale-105 transition-transform">
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
          <path d="M10 13c1.5 0 2.5-1 3.5-3 0 2 1.5 3 2.5 3-1.5 0-2.5 1-3.5 3 0-2-1.5-3-2.5-3z" fill="#74BF70" />
        </svg>
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
      </div>
      <div className="flex flex-col">
        <span
          className={`text-[19px] sm:text-[20px] font-extrabold leading-tight tracking-tight flex items-center gap-1 ${light ? 'text-white' : 'text-primary'
            }`}
        >
          One More Bite <span className="text-xs text-green-600">🍃</span>
        </span>
        {subtitle ? (
          <span
            className={`text-[10px] font-medium tracking-wide leading-tight ${light ? 'text-white/80' : 'text-on-surface-variant'
              }`}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
