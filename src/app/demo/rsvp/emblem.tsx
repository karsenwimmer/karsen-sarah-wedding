import Image from "next/image";

/** The approved generated PNG is shared by the header and invitation card. */
export function Emblem({ className }: { className?: string }) {
  return <Image
    className={className}
    src="/images/demo/luca-victoria-wildflower-monogram.png"
    alt=""
    width={512}
    height={512}
    loading="eager"
    unoptimized
    style={{ objectFit: "contain" }}
  />;
}
