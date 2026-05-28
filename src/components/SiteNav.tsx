import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { contact } from "@/lib/site-data";

const links = [
  { to: "/palvelut", label: "Palvelut" },
  { to: "/nanna", label: "Nanna" },
  { to: "/hinnasto", label: "Hinnasto" },
  { to: "/yhteys", label: "Yhteys" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "bg-sand/85 backdrop-blur-md border-b border-driftwood/10"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10">
        <Link to="/" className="group flex items-baseline gap-2">
          <span className="font-display text-2xl italic tracking-tight text-driftwood">
            Voima Lyhty
          </span>
          <span className="hidden text-[10px] tracking-luxe uppercase text-ember/80 md:inline">
            Helsinki
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="group relative text-[11px] font-medium uppercase tracking-luxe text-driftwood/80 transition-colors hover:text-ember"
              activeProps={{ className: "text-ember" }}
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ember transition-all duration-500 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <a
          href={`https://wa.me/${contact.phoneIntl.replace("+", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden border border-driftwood px-6 py-2.5 text-[11px] font-medium uppercase tracking-luxe text-driftwood transition-all duration-500 hover:bg-driftwood hover:text-sand md:inline-block"
        >
          Varaa aika
        </a>

        <button
          aria-label="Avaa valikko"
          onClick={() => setOpen(true)}
          className="md:hidden text-driftwood"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 bg-sand transition-opacity duration-500 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <span className="font-display text-2xl italic">Voima Lyhty</span>
          <button aria-label="Sulje" onClick={() => setOpen(false)}>
            <X size={22} />
          </button>
        </div>
        <nav className="flex flex-col items-center justify-center gap-8 pt-16">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="font-display text-4xl italic text-driftwood"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={`https://wa.me/${contact.phoneIntl.replace("+", "")}`}
            className="mt-8 border border-driftwood px-8 py-3 text-xs uppercase tracking-luxe"
          >
            Varaa aika
          </a>
        </nav>
      </div>
    </header>
  );
}
