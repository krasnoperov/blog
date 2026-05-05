import styles from './icons.module.css';

/**
 * Lucide-derived line-style glyphs.
 *
 * Adopted from lucide.dev (MIT/ISC) and re-toned: 1.75 px stroke, rounded
 * caps/joins, currentColor, no fill. Default size 16 px; consumers pass
 * `size` for larger surfaces. Inherits text colour from the parent.
 */

interface IconProps {
  size?: number;
  'aria-hidden'?: boolean;
}

function Svg({
  size = 16,
  ariaHidden = true,
  children,
}: {
  size?: number;
  ariaHidden?: boolean;
  children: React.ReactNode;
}) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaHidden}
    >
      {children}
    </svg>
  );
}

export function ArrowLeftIcon({ size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <Svg size={size} ariaHidden={ariaHidden}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </Svg>
  );
}

export function ArrowRightIcon({ size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <Svg size={size} ariaHidden={ariaHidden}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

export function HashIcon({ size = 16, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <Svg size={size} ariaHidden={ariaHidden}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </Svg>
  );
}
