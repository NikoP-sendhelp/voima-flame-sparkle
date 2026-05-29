import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import heroVideo from "@/assets/hero-bg.webm";
import nannaPortrait from "@/assets/nanna-portrait.jpg";
import ogImage from "@/assets/og-cover.jpg";
import { services, sointukylpyDates2026, contact } from "@/lib/site-data";
import { Reveal } from "@/components/Reveal";
import { SoundWave } from "@/components/SoundWave";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Voima Lyhty — Sointu sisälläsi | Äänimaljarentoutus Helsinki" },
      {
        name: "description",
        content:
          "Äänimaljarentoutus, sointukylvyt ja kosketukselliset hoidot Pasilan Urheilutalolla. Tervetuloa rauhoittumaan Helsingin sydämeen.",
      },
      { property: "og:title", content: "Voima Lyhty — Sointu sisälläsi" },
      {
        property: "og:description",
        content:
          "Äänimaljarentoutusta ja kosketuksellisia hoitoja Helsingin Pasilassa.",
      },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Hero />
      <BrandPromise />
      <ServicesPreview />
      <NannaBlock />
      <Schedule />
      <PricingTease />
      <ContactCTA />
    </>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] w-full overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <video
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-driftwood/30 via-driftwood/10 to-driftwood/60" />
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[11px] uppercase tracking-luxe text-sand/90"
        >
          Pasilan Urheilutalo · Helsinki
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-4xl font-display text-6xl italic leading-[0.95] text-sand md:text-8xl lg:text-[8.5rem]"
        >
          Sointu <br />
          <span className="text-sun">sisälläsi.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.6 }}
          className="mt-8 max-w-xl text-base font-light leading-relaxed text-sand/85 md:text-lg"
        >
          Äänimaljojen värähtely, lempeä kosketus ja iltavalon rauha — paikka,
          jossa keho saa muistaa hiljaisuuden.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            to="/palvelut"
            className="group rounded-full bg-sun px-10 py-4 text-[11px] font-semibold uppercase tracking-luxe text-driftwood shadow-lg shadow-sun/20 transition-all duration-500 hover:bg-sand hover:shadow-xl"
          >
            Tutustu hoitoihin
          </Link>
          <Link
            to="/yhteys"
            className="rounded-full px-6 py-3 text-[11px] uppercase tracking-luxe text-sand/90 underline-offset-8 hover:text-sun hover:underline"
          >
            Varaa aika →
          </Link>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float-soft">
        <SoundWave className="h-8 w-20 text-sand/70" />
      </div>
    </section>
  );
}

function BrandPromise() {
  return (
    <section className="relative bg-sand py-32 md:py-44">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <span className="block text-[10px] uppercase tracking-luxe text-ember">
            Läsnäolon taito
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mx-auto mt-8 max-w-3xl font-display text-4xl leading-[1.05] text-driftwood md:text-6xl">
            Pysähdy hetkeksi.{" "}
            <span className="italic text-ember">Kuule, mitä kehosi kuiskaa.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-10 max-w-2xl text-base leading-relaxed text-driftwood/70 md:text-lg">
            Voima Lyhty on rauhan saareke Helsingin sydämessä. Käytämme ääntä,
            kosketusta ja hiljaisuutta työkaluina, jotka palauttavat sinut
            takaisin omaan rytmiisi — siihen, joka tiesi alusta asti, miten levätä.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function ServicesPreview() {
  const featured = services.slice(0, 3);
  return (
    <section className="bg-mist py-32 md:py-40">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <div className="mb-20 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="text-[10px] uppercase tracking-luxe text-ember">
                Palvelumme
              </span>
              <h2 className="mt-4 font-display text-4xl italic text-driftwood md:text-6xl">
                Hoidot, jotka resonoivat sinussa
              </h2>
            </div>
            <Link
              to="/palvelut"
              className="border-b border-ember pb-1 text-[11px] uppercase tracking-luxe text-driftwood hover:text-ember"
            >
              Katso kaikki palvelut →
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-12 md:grid-cols-3">
          {featured.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.12}>
              <Link
                to="/palvelut/$slug"
                params={{ slug: s.slug }}
                className="group block"
              >
                <div className="overflow-hidden rounded-3xl">
                  <img
                    src={s.image}
                    alt={s.name}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                </div>
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-display text-sm italic text-ember">
                    {s.number}
                  </span>
                  <span className="h-px flex-1 bg-driftwood/15" />
                </div>
                <h3 className="mt-3 font-display text-3xl italic text-driftwood">
                  {s.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-driftwood/65">
                  {s.short}
                </p>
                <span className="mt-5 inline-block text-[11px] font-semibold uppercase tracking-luxe text-ember transition-all duration-300 group-hover:translate-x-1">
                  Lue lisää →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function NannaBlock() {
  return (
    <section className="relative overflow-hidden bg-driftwood py-32 text-sand md:py-44">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2 md:px-10">
        <Reveal>
          <div className="relative">
            <img
              src={nannaPortrait}
              alt="Nanna, Voima Lyhdyn yrittäjä"
              loading="lazy"
              width={1024}
              height={1280}
              className="aspect-[4/5] w-full rounded-3xl object-cover"
            />
            <div className="absolute -bottom-6 -right-6 hidden max-w-[14rem] rounded-3xl bg-sun p-6 text-driftwood shadow-xl md:block">
              <p className="font-display text-lg italic leading-snug">
                ”Kohtaan jokaisen asiakkaan lämmöllä ja läsnäololla.”
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div>
            <span className="text-[10px] uppercase tracking-luxe text-sun">
              Nannan tarina
            </span>
            <h2 className="mt-4 font-display text-4xl italic leading-tight md:text-6xl">
              Voima Lyhdyn takana
            </h2>
            <div className="mt-8 space-y-5 text-base font-light leading-relaxed text-sand/80">
              <p>
                Olen Nanna — sertifioitu hoitaja, äänimaljaohjaaja ja
                lyhytterapeutti. Matkani hyvinvoinnin äärelle alkoi halusta
                tarjota ihmisille tila, jossa voi kuulla itseään ilman kohinaa.
              </p>
              <p>
                Pasilan urheilutalon studio on minulle turvasatama, jonne ääni,
                kosketus ja hiljaisuus kutoutuvat yhdeksi kokonaisuudeksi.
                Uskon, että jokaisessa meissä asuu voimavaroja, jotka odottavat
                vain lupaa loistaa.
              </p>
            </div>
            <Link
              to="/nanna"
              className="mt-10 inline-block rounded-full border border-sun px-8 py-3 text-[11px] uppercase tracking-luxe text-sun transition hover:bg-sun hover:text-driftwood"
            >
              Tutustu Nannaan
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Schedule() {
  return (
    <section className="bg-sand py-32 md:py-40">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-luxe text-ember">
              Kevät 2026
            </span>
            <h2 className="mt-4 font-display text-4xl italic text-driftwood md:text-6xl">
              Tulevat sointukylvyt
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-driftwood/65">
              Kokoonnumme keskiviikkoiltaisin klo 18:30 Pasilan Urheilutalon
              studiohuoneeseen. Olethan paikalla viimeistään klo 18:25.
              Ilmoittautumiset Urheiluhallit Oy:n kautta.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <ul className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sointukylpyDates2026.map((d) => (
              <li
                key={d.date}
                className="group flex items-center gap-5 rounded-3xl border border-driftwood/10 bg-mist/40 p-5 transition-all duration-500 hover:-translate-y-1 hover:border-ember/40 hover:bg-sand hover:shadow-xl"
              >
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-ember text-sand transition-colors group-hover:bg-driftwood">
                  <span className="font-display text-3xl italic leading-none">
                    {d.date}
                  </span>
                  <span className="mt-1 text-[9px] uppercase tracking-luxe text-sun">
                    {d.month}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-xl italic text-driftwood">
                    Sointukylpy
                  </span>
                  <span className="mt-1 text-[11px] uppercase tracking-luxe text-driftwood/55">
                    klo 18:30 · Pasila
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function PricingTease() {
  return (
    <section className="bg-mist py-32">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-2 md:px-10">
        <Reveal>
        <Reveal>
          <div className="flex h-full flex-col justify-between rounded-3xl bg-sand p-10 shadow-sm md:p-14">
            <div>
              <span className="text-[10px] uppercase tracking-luxe text-ember">
                Hinnasto
              </span>
              <h3 className="mt-4 font-display text-3xl italic text-driftwood md:text-4xl">
                Hoidot alkaen 25 €
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-driftwood/65">
                Sointukylpy ryhmässä 25 €. Yksilöhoidot 65–85 €.
                Voimavara-terapia 85 € / 60 min.
              </p>
            </div>
            <Link
              to="/hinnasto"
              className="mt-10 self-start rounded-full border border-driftwood/30 px-6 py-2.5 text-[11px] uppercase tracking-luxe text-driftwood transition hover:border-ember hover:bg-driftwood hover:text-sand"
            >
              Koko hinnasto →
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="flex h-full flex-col justify-between rounded-3xl bg-ember p-10 text-sand shadow-sm md:p-14">
            <div>
              <span className="text-[10px] uppercase tracking-luxe text-sand/70">
                Lahjaksi rauhaa
              </span>
              <h3 className="mt-4 font-display text-3xl italic md:text-4xl">
                Lahjakortti hoitoihin
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-sand/80">
                Anna lahjaksi aikaa. Lahjakortit kaikkiin hoitoihin yksilön
                toiveen mukaan — tilaus tekstiviestillä tai sähköpostilla.
              </p>
            </div>
            <a
              href={`mailto:${contact.email}?subject=Lahjakortti`}
              className="mt-10 self-start rounded-full border border-sand/40 px-6 py-2.5 text-[11px] uppercase tracking-luxe text-sand transition hover:bg-sand hover:text-ember"
            >
              Tilaa lahjakortti →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section className="relative bg-sand py-32 md:py-44">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <span className="text-[10px] uppercase tracking-luxe text-ember">
            Aloita
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 font-display text-5xl italic leading-tight text-driftwood md:text-7xl">
            Matka rauhaan{" "}
            <span className="text-ember">alkaa viestillä.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-col items-center justify-center gap-10 md:flex-row md:gap-16">
            <a
              href={`https://wa.me/${contact.phoneIntl.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <span className="block text-[10px] uppercase tracking-luxe text-driftwood/50">
                WhatsApp
              </span>
              <span className="mt-2 block font-display text-3xl italic text-driftwood group-hover:text-ember">
                {contact.phone}
              </span>
            </a>
            <span className="hidden h-12 w-px bg-driftwood/15 md:block" />
            <a href={`mailto:${contact.email}`} className="group">
              <span className="block text-[10px] uppercase tracking-luxe text-driftwood/50">
                Sähköposti
              </span>
              <span className="mt-2 block font-display text-3xl italic text-driftwood group-hover:text-ember">
                {contact.email}
              </span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
