import type { SVGProps } from 'react';

export default function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" {...props}>
      <rect x="6" y="18" width="52" height="44" rx="4" fill="#ef4444" />
      <rect x="20" y="10" width="10" height="10" rx="2" fill="#991b1b" />
      <rect x="34" y="10" width="10" height="10" rx="2" fill="#991b1b" />
      <rect x="30" y="12" width="4" height="8" fill="#991b1b" />
      <rect x="30" y="18" width="4" height="44" fill="#991b1b" />
      <rect x="6" y="38" width="52" height="4" fill="#991b1b" />
    </svg>
  );
}

