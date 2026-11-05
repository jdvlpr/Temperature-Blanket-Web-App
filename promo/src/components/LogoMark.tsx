import React from 'react';
import { LOGO_STRIPES } from '../brand';

// AppLogo's mark: four stripes with a slot from the top into a circle cut out
export const LogoMark: React.FC<{ size: number; stripes?: string[] }> = ({
  size,
  stripes = LOGO_STRIPES,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{
        display: 'block',
        filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.45))',
      }}
    >
      <defs>
        <mask id="logo-hole">
          <path
            fill="white"
            fillRule="evenodd"
            d="M0 0H32V32H0Z M12 0H20V13.07A8 8 0 1 1 12 13.07Z"
          />
        </mask>
        <clipPath id="logo-round">
          <rect width="32" height="32" rx={3.2} />
        </clipPath>
      </defs>
      <g mask="url(#logo-hole)" clipPath="url(#logo-round)">
        {stripes.map((c, i) => (
          <rect key={i} x={0} y={i * 8} width={32} height={8.2} fill={c} />
        ))}
      </g>
    </svg>
  );
};
