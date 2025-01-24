interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-12 w-auto" }: LogoProps) {
  const logoUrl = "https://firebasestorage.googleapis.com/v0/b/baf-ub.firebasestorage.app/o/baf-png-ok.png?alt=media&token=771689ee-1cb2-430a-98c1-ebc8f3ad6db8";

  return (
    <img 
      src={logoUrl} 
      alt="BAF Logo" 
      className={className}
    />
  );
}