import { createFileRoute, Link } from "@tanstack/react-router";
import nannaPortrait from "@/assets/nanna-portrait.jpg";
import { Reveal } from "@/components/Reveal";

export const Route = createFileRoute("/nanna")({
  head: () => ({
    meta: [
      { title: "Nanna — Voima Lyhdyn yrittäjä" },
      {
        name: "description",
        content:
          "Tutustu Nannaan — sertifioitu hoitaja, äänimaljaohjaaja ja lyhytterapeutti Helsingin Pasilassa.",
      },
      { property: "og:title", content: "Nanna — Voima Lyhty" },
      {
        property: "og:description",
        content: "Voima Lyhdyn sydän ja käsi.",
      },
      { property: "og:image", content: nannaPortrait },
    ],
  }),
  component: NannaPage,
});

function NannaPage() {
  return (
    <div className="bg-sand pt-32">
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-12 md:px-10 md:py-32">
        <Reveal as="div" className="md:col-span-5">
          <div className="relative">
            <img
              src={nannaPortrait}
              alt="Nanna, Voima Lyhdyn yrittäjä"
              width={1024}
              height={1280}
              className="aspect-[4/5] w-full object-cover"
            />
            <span className="absolute -bottom-6 left-6 bg-sun px-5 py-2 text-[10px] uppercase tracking-luxe text-driftwood">
              Yrittäjä
            </span>
          </div>
        </Reveal>

        <div className="md:col-span-7 md:pl-8">
          <Reveal>
            <span className="text-[10px] uppercase tracking-luxe text-ember">
              Tutustu
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-6 font-display text-5xl italic leading-[1.05] text-driftwood md:text-7xl">
              Nanna
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 font-display text-2xl italic text-ember md:text-3xl">
              Voima Lyhdyn sydän ja käsi.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-10 space-y-6 text-base leading-relaxed text-driftwood/75 md:text-lg">
              <p>
                Olen Nanna — sertifioitu hoitaja, äänimaljaohjaaja ja
                lyhytterapeutti. Olen viettänyt vuosia kuunnellen, mitä keho
                kertoo silloin, kun mieli vielä vaikenee. Tästä syntyi
                Voima Lyhty.
              </p>
              <p>
                Työskentelyni perusta on läsnäolo. Uskon, että jokaisessa
                meissä asuu syvä viisaus — ja että tehtäväni on tarjota tila,
                jossa se voi nousta pintaan ilman kiirettä. Ääni, kosketus ja
                hiljaisuus ovat välineitäni; lempeys on tapani.
              </p>
              <p>
                Studioni on Pasilan Urheilutalon iltavalossa, missä gongien
                kaiku sekoittuu kaupungin sykkeeseen. Tervetuloa rauhaan.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <blockquote className="mt-12 border-l-2 border-ember pl-6 font-display text-2xl italic leading-snug text-driftwood md:text-3xl">
              ”Kohtaan jokaisen asiakkaan lämmöllä ja läsnäololla. Se on
              ainoa, mitä todella voin luvata — ja se on usein juuri se,
              mitä tarvitsemme eniten.”
            </blockquote>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                to="/palvelut"
                className="bg-driftwood px-8 py-3 text-[11px] uppercase tracking-luxe text-sand hover:bg-ember"
              >
                Katso palvelut
              </Link>
              <Link
                to="/yhteys"
                className="border border-driftwood px-8 py-3 text-[11px] uppercase tracking-luxe text-driftwood hover:bg-driftwood hover:text-sand"
              >
                Ota yhteyttä
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
