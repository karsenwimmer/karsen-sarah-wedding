import { SealMark } from "@/components/SealMark";
import { weddingConfig } from "@/config/wedding";

type SaveDateMarkProps = {
  className?: string;
  headingId?: string;
  includeVenue?: boolean;
  sealPriority?: boolean;
  sealSize?: number;
  titleElement?: "h1" | "span";
};

export function SaveDateMark({
  className = "",
  headingId,
  includeVenue = false,
  sealPriority = false,
  sealSize = 160,
  titleElement: TitleElement = "span"
}: SaveDateMarkProps) {
  return (
    <div className={`save-date-mark ${className}`}>
      <SealMark className="save-date-mark__seal" priority={sealPriority} size={sealSize} />
      <p className="save-date-mark__kicker">Save the Date</p>
      <TitleElement className="save-date-mark__names" id={headingId}>
        {weddingConfig.couple.displayName}
      </TitleElement>
      <p className="save-date-mark__date">{weddingConfig.date.shortLabel}</p>
      {includeVenue ? (
        <p className="save-date-mark__venue">{weddingConfig.venue.reception}</p>
      ) : null}
    </div>
  );
}
