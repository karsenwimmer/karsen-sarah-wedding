import Image from "next/image";

type SealMarkProps = {
  className?: string;
  priority?: boolean;
  size?: number;
};

export function SealMark({ className = "", priority = false, size = 96 }: SealMarkProps) {
  return (
    <span className={`seal-mark ${className}`} aria-label="Karsen and Sarah">
      <Image
        src="/images/seals/ks-flat-seal-transparent.png"
        alt=""
        width={size}
        height={size}
        priority={priority}
        sizes={`${size}px`}
      />
    </span>
  );
}
