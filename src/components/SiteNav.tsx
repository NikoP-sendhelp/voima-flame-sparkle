import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ESC sulkee, body lukkoon, fokus takaisin avauspainikkeeseen
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      openButtonRef.current?.focus();
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "bg-sand/85 backdrop-blur-md border-b border-driftwood/10"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10">
        <Link to="/" className="group flex items-baseline gap-2" aria-label="Voima Lyhty — etusivu">
          <span className={`font-display text-2xl italic tracking-tight transition-colors ${scrolled ? "text-driftwood" : "text-sand drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"}`}>
            Voima Lyhty
          </span>
          <span className={`hidden text-[10px] tracking-luxe uppercase md:inline transition-colors ${scrolled ? "text-ember/80" : "text-sun drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"}`}>
            Helsinki
          </span>
        </Link>

        <nav aria-label="Päävalikko" className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`group relative text-[11px] font-medium uppercase tracking-luxe transition-colors hover:text-ember ${scrolled ? "text-driftwood/80" : "text-sand drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"}`}
              activeProps={{ className: "text-ember", "aria-current": "page" }}
            >
              {l.label}
              <span aria-hidden="true" className="absolute -bottom-1 left-0 h-px w-0 bg-ember transition-all duration-500 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <a
          href={`https://wa.me/${contact.phoneIntl.replace("+", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`hidden rounded-full border px-6 py-2.5 text-[11px] font-medium uppercase tracking-luxe transition-all duration-500 md:inline-block ${scrolled ? "border-driftwood text-driftwood hover:bg-driftwood hover:text-sand" : "border-sand text-sand hover:bg-sand hover:text-driftwood drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"}`}
        >
          Varaa aika
          <span className="sr-only"> WhatsAppilla</span>
        </a>

        <button
          ref={openButtonRef}
          aria-label="Avaa valikko"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen(true)}
          className={`md:hidden inline-flex min-h-11 min-w-11 items-center justify-center ${scrolled ? "text-driftwood" : "text-sand drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"}`}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Sivuston valikko"
        aria-hidden={!open}
        className={`fixed inset-0 z-50 bg-sand transition-opacity duration-500 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <span className="font-display text-2xl italic">Voima Lyhty</span>
          <button
            ref={closeButtonRef}
            aria-label="Sulje valikko"
            onClick={() => setOpen(false)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Mobiilivalikko" className="flex flex-col items-center justify-center gap-8 pt-16">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className="font-display text-4xl italic text-driftwood"
              activeProps={{ "aria-current": "page" }}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={`https://wa.me/${contact.phoneIntl.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={open ? 0 : -1}
            className="mt-8 border border-driftwood px-8 py-3 text-xs uppercase tracking-luxe"
          >
            Varaa aika
          </a>
        </nav>
      </div>
    </header>
  );
}
