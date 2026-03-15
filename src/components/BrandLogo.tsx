import logoUrl from '../assets/itineris-logo.svg';

type BrandLogoProps = {
  className?: string;
  alt?: string;
};

export function BrandLogo({ className = '', alt = 'Itineris' }: BrandLogoProps) {
  return <img src={logoUrl} alt={alt} className={className} />;
}
