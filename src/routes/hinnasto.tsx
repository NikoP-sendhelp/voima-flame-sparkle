import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";
import { services, contact } from "@/lib/site-data";

export const Route = createFileRoute("/hinnasto")({
  head: () => ({
    meta: [
      { title: "Hinnasto — Voima Lyhty" },
      {
        name: "description",
        content:
          "Voima Lyhdyn hoitojen hinnasto: sointukylpy, äänimaljarentoutus, vyöhyketerapia, hermoratahieronta, facelift ja voimavara-terapia.",
      },
      { property: "og:title", content: "Hinnasto — Voima Lyhty" },
      {
        property: "og:description",
        content: "Hoidot alkaen 25 €.",
      },
    ],
  }),
  component: HinnastoPage,
});

function HinnastoPage() {
  return (
    <div className="bg-sand pt-32">
      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:px-10">
        <Reveal>
          <span className="text-[10px] uppercase tracking-luxe text-ember">
            Hinnasto
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-6 font-display text-5xl italic leading-[1.05] text-driftwood md:text-7xl">
            Selkeä,{" "}
            <span className="text-ember">rehellinen, läsnä.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-driftwood/70">
            Hinnat sisältävät arvonlisäveron. Maksu käteisellä tai
            MobilePaylla paikan päällä. Peruutukset toivotaan vähintään 24 h
            ennen aikaa.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-32 md:px-10">
        <Reveal>
          <ul className="divide-y divide-driftwood/10 border-y border-driftwood/10">
            {services.map((s) => (
              <li
                key={s.slug}
                className="group grid grid-cols-12 items-baseline gap-6 py-8"
              >
                <span className="col-span-1 font-display text-xl italic text-ember">
                  {s.number}
                </span>
                <div className="col-span-7 md:col-span-8">
                  <Link
                    to="/palvelut/$slug"
                    params={{ slug: s.slug }}
                    className="font-display text-2xl italic text-driftwood group-hover:text-ember md:text-3xl"
                  >
                    {s.name}
                  </Link>
                  <p className="mt-1 text-[11px] uppercase tracking-luxe text-driftwood/50">
                    {s.tagline} · {s.duration}
                  </p>
                </div>
                <span className="col-span-4 col-start-9 text-right font-display text-2xl italic text-driftwood md:col-span-3 md:text-3xl">
                  {s.price}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-20 bg-mist p-10 md:p-14">
            <span className="text-[10px] uppercase tracking-luxe text-ember">
              Lahjaksi
            </span>
            <h2 className="mt-4 font-display text-3xl italic text-driftwood md:text-4xl">
              Lahjakortit & paketit
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-driftwood/70">
              Lahjakortin voi tilata mihin tahansa hoitoon tai vapaalla
              summalla. Pyydä yksilöllinen lahjakortti viestillä — toimitan
              sen joko sähköpostitse PDF:nä tai painettuna noudettavaksi.
            </p>
            <a
              href={`mailto:${contact.email}?subject=Lahjakortti`}
              className="mt-8 inline-block border border-driftwood px-8 py-3 text-[11px] uppercase tracking-luxe text-driftwood hover:bg-driftwood hover:text-sand"
            >
              Tilaa lahjakortti
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
