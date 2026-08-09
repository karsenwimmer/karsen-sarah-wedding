import { SealMark } from "@/components/SealMark";

const navItems = [
  ["Home", "#home"],
  ["Save the Date", "#save-the-date"],
  ["Updates", "#updates"],
  ["FAQ", "#faq"]
];

export function SiteHeader() {
  return (
    <header className="site-header" aria-label="Primary navigation">
      <a className="site-header__brand" href="#home" aria-label="Karsen and Sarah home">
        <SealMark size={52} />
      </a>
      <nav className="site-header__nav">
        {navItems.map(([label, href]) => (
          <a href={href} key={href}>
            {label}
          </a>
        ))}
      </nav>
      <details className="site-header__menu">
        <summary aria-label="Open navigation menu">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </summary>
        <nav aria-label="Mobile navigation">
          {navItems.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>
      </details>
    </header>
  );
}
