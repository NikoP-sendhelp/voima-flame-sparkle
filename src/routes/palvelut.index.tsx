import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";
import { services } from "@/lib/site-data";

export const Route = createFileRoute("/palvelut/")({
  head: () => ({
    meta: [
      { title: "Palvelut — Voima Lyhty | Äänimaljat, hieronta, terapia" },
      {
        name: "description",
        content:
          "Äänimaljarentoutus, sointukylpy, vyöhyketerapia, hermoratahieronta, rentouttava facelift ja voimavara-terapia Helsingin Pasilassa.",
      },
      { property: "og:title", content: "Palvelut — Voima Lyhty" },
      {
        property: "og:description",
        content: "Kuusi hoitoa kehon ja mielen tasapainoon.",
      },
    ],
  }),
  component: PalvelutPage,
});

function PalvelutPage() {
  return (
    <div className="bg-sand pt-32">
      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:px-10">
        <Reveal>
          <span className="text-[10px] uppercase tracking-luxe text-ember">
            Palvelut
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-6 font-display text-5xl italic leading-[1.05] text-driftwood md:text-7xl">
            Kuusi tietä{" "}
            <span className="text-ember">syvempään lepoon.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-driftwood/70">
            Jokainen hoito on hidas matka kohti hermoston hiljentymistä.
            Valitse, mikä juuri nyt kutsuu — voit aina kysyä, jos olet
            epävarma. Ohjaan sinut oikealle polulle.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl space-y-24 px-6 py-20 md:px-10 md:space-y-32">
        {services.map((s, i) => (
          <Reveal key={s.slug} delay={0}>
            <article
              className={`grid items-center gap-12 md:grid-cols-2 md:gap-20 ${
                i % 2 === 1 ? "md:[&>:first-child]:order-2" : ""
              }`}
            >
              <Link
                to="/palvelut/$slug"
                params={{ slug: s.slug }}
                className="group block overflow-hidden"
              >
                <img
                  src={s.image}
                  alt={s.name}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                />
              </Link>
              <div>
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-2xl italic text-ember">
                    {s.number}
                  </span>
                  <span className="h-px flex-1 bg-driftwood/20" />
                  <span className="text-[10px] uppercase tracking-luxe text-driftwood/50">
                    {s.duration} · {s.price}
                  </span>
                </div>
                <h2 className="mt-6 font-display text-4xl italic text-driftwood md:text-5xl">
                  {s.name}
                </h2>
                <p className="mt-3 text-[11px] uppercase tracking-luxe text-ember">
                  {s.tagline}
                </p>
                <p className="mt-6 text-base leading-relaxed text-driftwood/70">
                  {s.short}
                </p>
                <Link
                  to="/palvelut/$slug"
                  params={{ slug: s.slug }}
                  className="mt-8 inline-block border-b border-driftwood pb-1 text-[11px] uppercase tracking-luxe text-driftwood hover:text-ember hover:border-ember"
                >
                  Lue lisää →
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
