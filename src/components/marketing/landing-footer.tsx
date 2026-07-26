import Link from "next/link";
import { BrandIcon } from "@/components/brand-icon";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#product", label: "Overview" },
      { href: "#features", label: "Features" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "App",
    links: [
      { href: "/register", label: "Get started" },
      { href: "/login", label: "Log in" },
      { href: "/feed", label: "Open feed" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "#privacy", label: "Privacy" },
      { href: "#faq", label: "FAQ" },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0c1524]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-12">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <BrandIcon variant="tile" size={32} />
              <span className="text-sm font-semibold tracking-tight text-white">
                Observolife
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              A personal observation engine. Log what happened. Discover patterns
              you&apos;re too close to see.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-white/35 uppercase">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <a
                      href={link.href}
                      className="text-sm text-white/55 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} Observolife
          </p>
          <p className="text-xs text-white/35">
            No judgment. No prescriptions. Just observation.
          </p>
        </div>
      </div>
    </footer>
  );
}
