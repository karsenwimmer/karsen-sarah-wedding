import Image from "next/image";

/** The approved generated PNG is shared by the header and invitation card. */
export function Emblem({ className }: { className?: string }) {
  return <Image
    className={className}
    src="/images/demo/luca-victoria-monogram-generated.png"
    alt=""
    width={1254}
    height={1254}
    loading="eager"
    unoptimized
    style={{ objectFit: "contain" }}
  />;
}
