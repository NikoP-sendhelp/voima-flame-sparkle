## Voima Lyhty — uudistettu premium-sivusto

Rakennetaan modernisti animoitu, hybridi-rakenteinen suomenkielinen sivusto, jossa valitun "Ethereal Nordic luxe" -prototyypin sommittelu yhdistetään lämpimään "ranta, rauha, rento, aurinko" -palettiin. Tekstit kirjoitetaan kokonaan uusiksi runollisempaan, premium-sävyyn.

### Visuaalinen järjestelmä

**Värit (oklch):**
- `--sand` #faf5ec — luonnonvalkoinen ranta-pohja
- `--driftwood` #2d2620 — syvä lämmin ruskea (teksti & tumma osio)
- `--sun` #e8a87c — pehmeä auringonlasku-persikka (aksentti & CTA)
- `--ember` #c4654a — terrakotta (otsikkokorostukset)
- `--seafoam` #87a878 — salviavihreä (linkki-hover, footer-aksentti)
- `--mist` #efe7d8 — pehmeä hiekka-savi (osio-vaihtelu)

**Typografia:** Cormorant Garamond (display, kursiivi-painotettu) + Karla (body) → `@fontsource`-pakettien kautta, ei CDN:ää.

**Liikkeet:**
- Hidas parallax-hero (sointuaalto-SVG hengittää taustalla)
- Scroll-reveal jokaiselle osiolle (Framer Motion, useInView)
- Sointuvärinä-animaatio numero-otsikoissa (subtle ripple)
- Kuva-hover scale-700ms, "Lue lisää" -nuolen liukuminen
- Sticky-nav blur + ohut alarivi
- "Float" scroll-vihjain herossa

### Reititys (hybridi)

```
src/routes/
  __root.tsx           ← shell + nav + footer
  index.tsx            ← rikas etusivu, kaikki osiot
  palvelut.tsx         ← yleiskatsaus + 6 palvelua
  palvelut.$slug.tsx   ← yksittäinen palvelu (dynaaminen)
  nanna.tsx            ← Nannan tarina
  hinnasto.tsx         ← täysi hinnasto + Voimavara-terapia
  yhteys.tsx           ← yhteystiedot, kartta-embed, WhatsApp CTA
```

Jokaiselle reitille oma `head()` (title, description, og:title, og:description). Slugit: `aanimaljarentoutus`, `sointukylpy`, `vyohyketerapia`, `hermoratahieronta`, `rentouttava-facelift`.

### Etusivun osiot (ylhäältä alas)

1. **Hero** — koko ruudun parallax-kuva (auringonlasku-äänimalja), kursiivi-otsikko "Sointu sisälläsi" + alaotsikko "Pasilan Urheilutalo, Helsinki", CTA "Tutustu hoitoihin", float-scroll-vihje
2. **Brändilupaus** — leveä cream-kaista, lyhyt manifesti hidastumisesta ja äänen voimasta
3. **Palvelut (3 nostoa)** — kortit kuvilla, hover-scale, numerot 01–03, linkki "Katso kaikki palvelut"
4. **Nanna (tumma driftwood-osio)** — split-screen muotokuva + lainaus-bubble + tarina
5. **Tulevat sointukylvyt — Kevät 2026** — eleganti listaus kaikista päivämääristä (21.1, 28.1, 18.2, 25.2, 4.3, 25.3, 1.4, 8.4, 15.4, 29.4 klo 18:30), jokainen rivi hover-glow
6. **Hinnasto-tease + lahjakortti** — mist-pohja, kaksi korttia
7. **Yhteys-CTA** — WhatsApp 040 553 5388, voimalyhty@gmail.com, Radiokatu 22
8. **Footer** — brand-rivi, sijainti, yhteys, sosiaaliset, copyright

### Sisältö & teksti

Kaikki tekstit kirjoitetaan suomeksi uudelleen runollisempaan, modernimpaan sävyyn säilyttäen alkuperäiset faktat (sijainti, yrittäjä Nanna, yhteystiedot, hinnat, päivämäärät). Kuusi palvelua: Äänimaljarentoutus, Sointukylpy, Vyöhyketerapia/Refleksologia, Hermoratahieronta, Rentouttava Facelift, Voimavara-terapia & Lyhytterapia.

### AI-generoidut kuvat (`src/assets/`)

Generoidaan `imagegen--generate_image` -työkalulla, sovitettuna lämpimään ranta-paletiin:
1. `hero-bowl.jpg` (1920×1080) — messinki-äänimalja iltavalossa, hiekan ja meren sävyt
2. `service-aanimalja.jpg` (800×1000) — sointukylpy yläkulmasta
3. `service-vyohyke.jpg` (800×1000) — jalkahieronta lämpimässä valossa
4. `service-facelift.jpg` (800×1000) — kasvojen rentoutus
5. `service-sointukylpy.jpg`, `service-hermorata.jpg`, `service-voimavara.jpg` — alasivuille
6. `nanna-portrait.jpg` (1080×1350) — lämmin, läsnäoleva muotokuva (ei oikea henkilö, vain tunnelma; asiakas vaihtaa oikeaan)
7. `og-cover.jpg` (1200×630) — jako-kuva

### Tekniset yksityiskohdat

- Värit ja fontit `src/styles.css`:n `@theme inline` -lohkoon; ei kovakoodattuja värejä komponenteissa
- Framer Motion (`bun add framer-motion`) reveal-animaatioihin
- `@fontsource/cormorant-garamond` + `@fontsource/karla` (`bun add`)
- SEO: jokaisella reitillä oma metadata; `og:image` vain leaf-routeilla
- Nav-linkit `<Link to="..." />` (TanStack Router)
- Saavutettavuus: semanttiset H1–H3, kontrasti AA, `prefers-reduced-motion` kunnioitus
- Mobiilinavigaatio: Sheet-komponentti shadcnista

### QA ennen toimitusta

- Tarkista jokainen reitti selaimessa (desktop + mobile)
- Varmista että animaatiot toimivat eivätkä blokkaa scrollia
- Tarkista linkit, WhatsApp-tel-linkki, sähköposti-mailto
- Varmista että kaikki päivämäärät, hinnat ja yhteystiedot vastaavat alkuperäistä

---

Kun hyväksyt suunnitelman, rakennan koko sivuston yhdessä iteraatiossa: paletti & fontit, reitit, jaetut komponentit (Nav, Footer, ServiceCard, ScheduleRow), kaikki kuusi sivua sekä AI-kuvat.