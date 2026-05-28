import { Link } from "@tanstack/react-router";
import { contact } from "@/lib/site-data";
import { SoundWave } from "./SoundWave";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-driftwood text-sand">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sun/60 to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 md:grid-cols-12 md:px-10">
        <div className="md:col-span-5">
          <div className="flex items-center gap-4">
            <span className="font-display text-4xl italic">Voima Lyhty</span>
            <SoundWave className="h-8 w-16 text-sun" />
          </div>
          <p className="mt-6 max-w-sm font-display text-2xl italic leading-snug text-sand/80">
            Sointu sisälläsi — rauha, johon palata.
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-sand/60">
            Äänimaljarentoutusta, kosketuksellisia hoitoja ja lyhytterapiaa
            Helsingin Pasilassa. Tervetuloa vanhat ja uudet ystävät.
          </p>
        </div>

        <div className="md:col-span-3">
          <h4 className="mb-6 text-[10px] font-medium uppercase tracking-luxe text-sun">
            Sijainti
          </h4>
          <p className="text-sm leading-loose text-sand/70">
            Pasilan Urheilutalo
            <br />
            Radiokatu 22
            <br />
            00240 Helsinki
            <br />
            <span className="text-sand/40">Iltaisin klo 17 alkaen</span>
          </p>
        </div>

        <div className="md:col-span-4">
          <h4 className="mb-6 text-[10px] font-medium uppercase tracking-luxe text-sun">
            Ota yhteyttä
          </h4>
          <ul className="space-y-4 text-sm text-sand/70">
            <li>
              <a
                href={`https://wa.me/${contact.phoneIntl.replace("+", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex flex-col gap-1 hover:text-sun"
              >
                <span className="font-display text-xl">{contact.phone}</span>
                <span className="text-[10px] uppercase tracking-luxe text-sand/40 group-hover:text-sun">
                  WhatsApp / Tekstiviesti
                </span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contact.email}`}
                className="font-display text-xl hover:text-sun"
              >
                {contact.email}
              </a>
            </li>
          </ul>
          <div className="mt-8 flex gap-3">
            {["IG", "FB"].map((s) => (
              <span
                key={s}
                className="grid size-9 place-items-center rounded-full border border-sand/15 text-[10px] font-semibold uppercase tracking-luxe text-sun"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-sand/10 px-6 py-8 text-[10px] uppercase tracking-luxe text-sand/40 md:flex-row md:px-10">
        <p>© {new Date().getFullYear()} Voima Lyhty — Nanna</p>
        <nav className="flex gap-6">
          <Link to="/palvelut" className="hover:text-sun">Palvelut</Link>
          <Link to="/hinnasto" className="hover:text-sun">Hinnasto</Link>
          <Link to="/yhteys" className="hover:text-sun">Yhteys</Link>
        </nav>
      </div>
    </footer>
  );
}
