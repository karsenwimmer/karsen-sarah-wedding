import { weddingConfig } from "@/config/wedding";

type WeddingMonogramProps = {
  className?: string;
};

export function WeddingMonogram({ className = "" }: WeddingMonogramProps) {
  return (
    <span className={`monogram ${className}`} aria-label="Karsen and Sarah">
      {weddingConfig.couple.initials}
    </span>
  );
}
