import { createFileRoute } from "@tanstack/react-router";
import { Reveal } from "@/components/Reveal";
import { contact } from "@/lib/site-data";

export const Route = createFileRoute("/yhteys")({
  head: () => ({
    meta: [
      { title: "Yhteys — Voima Lyhty | Pasilan Urheilutalo Helsinki" },
      {
        name: "description",
        content:
          "Varaa aika WhatsApp-viestillä 040 553 5388 tai sähköpostilla. Pasilan Urheilutalo, Radiokatu 22, Helsinki.",
      },
      { property: "og:title", content: "Yhteys — Voima Lyhty" },
      {
        property: "og:description",
        content: "Ota yhteyttä ja varaa aika.",
      },
    ],
  }),
  component: YhteysPage,
});

function YhteysPage() {
  return (
    <div className="bg-sand pt-32">
      <section className="mx-auto max-w-5xl px-6 py-20 text-center md:px-10">
        <Reveal>
          <span className="text-[10px] uppercase tracking-luxe text-ember">
            Yhteys
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className="mt-6 font-display text-5xl italic leading-[1.05] text-driftwood md:text-7xl">
            Lähetä viesti.{" "}
            <span className="text-ember">Vastaan pian.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-driftwood/70">
            Helpoin tapa varata aika tai kysyä lisää on tekstiviesti tai
            WhatsApp. Vastaan iltaisin viimeistään seuraavana päivänä.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
        <div className="grid gap-px overflow-hidden border border-driftwood/15 bg-driftwood/10 md:grid-cols-2">
          <Reveal as="div" className="bg-sand p-10 md:p-14">
            <span className="text-[10px] uppercase tracking-luxe text-ember">
              Puhelin & WhatsApp
            </span>
            <a
              href={`https://wa.me/${contact.phoneIntl.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block font-display text-4xl italic text-driftwood hover:text-ember md:text-5xl"
            >
              {contact.phone}
            </a>
            <p className="mt-4 text-sm leading-relaxed text-driftwood/60">
              Tekstiviestit ja WhatsApp-viestit toivotuimpia. Puheluihin
              vastaan kun se on mahdollista.
            </p>
          </Reveal>

          <Reveal as="div" className="bg-mist p-10 md:p-14">
            <span className="text-[10px] uppercase tracking-luxe text-ember">
              Sähköposti
            </span>
            <a
              href={`mailto:${contact.email}`}
              className="mt-4 block break-words font-display text-3xl italic text-driftwood hover:text-ember md:text-4xl"
            >
              {contact.email}
            </a>
            <p className="mt-4 text-sm leading-relaxed text-driftwood/60">
              Sopii pidempiin kysymyksiin, ryhmien tiedusteluihin ja
              lahjakorttitilauksiin.
            </p>
          </Reveal>

          <Reveal as="div" className="bg-driftwood p-10 text-sand md:col-span-2 md:p-14">
            <div className="grid gap-10 md:grid-cols-3">
              <div>
                <span className="text-[10px] uppercase tracking-luxe text-sun">
                  Sijainti
                </span>
                <p className="mt-4 font-display text-2xl italic leading-snug">
                  Pasilan Urheilutalo
                  <br />
                  Radiokatu 22
                  <br />
                  00240 Helsinki
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-luxe text-sun">
                  Aukioloajat
                </span>
                <p className="mt-4 font-display text-2xl italic leading-snug">
                  Iltaisin klo 17 alkaen
                  <br />
                  Sointukylvyt ke klo 18:30
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-luxe text-sun">
                  Käytännön asiat
                </span>
                <p className="mt-4 text-sm leading-relaxed text-sand/80">
                  Saapuminen viimeistään 10 min ennen hoitoa. Maksu paikan
                  päällä käteisellä tai MobilePaylla. Peruutukset 24 h ennen.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal as="div" className="relative bg-mist md:col-span-2">
            <iframe
              title="Kartta — Radiokatu 22, Helsinki"
              src="https://www.google.com/maps?q=Radiokatu+22,+Helsinki&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-80 w-full border-0 grayscale"
            />
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Radiokatu+22,+Helsinki"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 bg-driftwood px-5 py-2 text-[11px] uppercase tracking-luxe text-sand hover:bg-ember"
            >
              Avaa reittiohjeet →
            </a>
          </Reveal>

        </div>
      </section>
    </div>
  );
}
