import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";
import { services, contact } from "@/lib/site-data";

export const Route = createFileRoute("/palvelut/$slug")({
  loader: ({ params }) => {
    const service = services.find((s) => s.slug === params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.service.name} — Voima Lyhty` },
          { name: "description", content: loaderData.service.short },
          {
            property: "og:title",
            content: `${loaderData.service.name} — Voima Lyhty`,
          },
          { property: "og:description", content: loaderData.service.short },
          { property: "og:image", content: loaderData.service.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="bg-sand pt-40 pb-20 text-center">
      <h1 className="font-display text-5xl italic">Palvelua ei löytynyt</h1>
      <Link
        to="/palvelut"
        className="mt-8 inline-block border-b border-driftwood pb-1 text-xs uppercase tracking-luxe"
      >
        Takaisin palveluihin
      </Link>
    </div>
  ),
  component: ServicePage,
});

function ServicePage() {
  const { service } = Route.useLoaderData();
  const idx = services.findIndex((s) => s.slug === service.slug);
  const next = services[(idx + 1) % services.length];

  return (
    <article className="bg-sand pt-32">
      <section className="relative">
        <div className="relative h-[70svh] overflow-hidden">
          <img
            src={service.image}
            alt={service.name}
            className="h-full w-full object-cover"
            width={1024}
            height={1024}
          />
          <div className="absolute inset-0 bg-driftwood/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-sand">
            <Reveal>
              <span className="text-[10px] uppercase tracking-luxe text-sun">
                {service.number} · {service.tagline}
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-6 max-w-3xl font-display text-5xl italic leading-tight md:text-7xl">
                {service.name}
              </h1>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <Reveal>
          <p className="font-display text-2xl italic leading-snug text-ember md:text-3xl">
            {service.short}
          </p>
        </Reveal>
        <div className="mt-12 space-y-6 text-base leading-relaxed text-driftwood/75 md:text-lg">
          {service.body.map((p: string, i: number) => (
            <Reveal key={i} delay={i * 0.1}>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <dl className="mt-16 grid gap-px overflow-hidden border border-driftwood/15 bg-driftwood/10 sm:grid-cols-2">
            <div className="bg-sand p-8">
              <dt className="text-[10px] uppercase tracking-luxe text-driftwood/50">
                Kesto
              </dt>
              <dd className="mt-2 font-display text-3xl italic text-driftwood">
                {service.duration}
              </dd>
            </div>
            <div className="bg-sand p-8">
              <dt className="text-[10px] uppercase tracking-luxe text-driftwood/50">
                Hinta
              </dt>
              <dd className="mt-2 font-display text-3xl italic text-driftwood">
                {service.price}
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-16 bg-ember p-10 text-center text-sand md:p-14">
            <h3 className="font-display text-3xl italic md:text-4xl">
              Varaa aikasi
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-sand/80">
              Tekstiviestillä, WhatsApp-viestillä tai sähköpostilla — vastaan
              mahdollisimman pian.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <a
                href={`https://wa.me/${contact.phoneIntl.replace("+", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-sand px-8 py-3 text-[11px] font-semibold uppercase tracking-luxe text-driftwood hover:bg-sun"
              >
                {contact.phone}
              </a>
              <a
                href={`mailto:${contact.email}?subject=${encodeURIComponent(service.name)}`}
                className="border border-sand px-8 py-3 text-[11px] uppercase tracking-luxe hover:bg-sand hover:text-driftwood"
              >
                Lähetä sähköposti
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-driftwood/10 bg-mist py-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6">
          <Link
            to="/palvelut"
            className="text-[11px] uppercase tracking-luxe text-driftwood/60 hover:text-ember"
          >
            ← Kaikki palvelut
          </Link>
          <Link
            to="/palvelut/$slug"
            params={{ slug: next.slug }}
            className="text-right"
          >
            <span className="block text-[10px] uppercase tracking-luxe text-driftwood/50">
              Seuraava
            </span>
            <span className="font-display text-2xl italic text-driftwood">
              {next.name} →
            </span>
          </Link>
        </div>
      </section>
    </article>
  );
}
