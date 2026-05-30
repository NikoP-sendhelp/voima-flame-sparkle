import aanimaljaImg from "@/assets/service-aanimalja.jpg";
import sointukylpyImg from "@/assets/service-sointukylpy.jpg";
import vyohykeImg from "@/assets/service-vyohyke.jpg";
import hermorataImg from "@/assets/service-hermorata.jpg";
import faceliftImg from "@/assets/service-facelift.jpg";
import voimavaraImg from "@/assets/service-voimavara.jpg";

export type Service = {
  slug: string;
  number: string;
  name: string;
  tagline: string;
  short: string;
  body: string[];
  duration: string;
  price: string;
  image: string;
};

export const services: Service[] = [
  {
    slug: "aanimaljarentoutus",
    number: "01",
    name: "Äänimaljarentoutus",
    tagline: "Yksilöllinen matka värähtelyyn",
    short:
      "Käsintaotut messinkimaljat soivat kehollasi — pulssi hidastuu, hermosto vapautuu, mieli vaikenee.",
    body: [
      "Asetut peittojen alle pehmeälle alustalle. Maljat soivat vuoroin lähellä, vuoroin kehollasi, ja niiden värähtely kulkee kudosten läpi kuin lämmin aalto.",
      "Hoito sopii unettomuuteen, stressiin, palautumiseen ja hetkiin, jolloin tarvitset syvää lepoa enemmän kuin sanoja.",
    ],
    duration: "60 min",
    price: "75 €",
    image: aanimaljaImg,
  },
  {
    slug: "sointukylpy",
    number: "02",
    name: "Sointukylpy",
    tagline: "Ryhmärentoutus äänen virrassa",
    short:
      "Yhteinen meditaatio, jossa maljat ja gongit luovat tilan — kelluva, hiljainen, kantava.",
    body: [
      "Kokoonnumme keskiviikkoiltaisin Pasilan Urheilutalon studiohuoneeseen. Tunti alkaa klo 18:30, ja sinun tehtäväsi on vain hengittää.",
      "Sointukylpy on lempeä tapa irrottautua viikon kuormasta. Useimmat osallistujat kuvaavat oloaan jälkeenpäin sanalla ”koti”.",
    ],
    duration: "60 min",
    price: "25 €",
    image: sointukylpyImg,
  },
  {
    slug: "vyohyketerapia",
    number: "03",
    name: "Vyöhyketerapia",
    tagline: "Refleksologia, joka avaa lukot",
    short:
      "Jalkaterien heijastealueiden hellä käsittely tasapainottaa elimistöä ja rauhoittaa hermoston.",
    body: [
      "Kehossasi on kartta — jokaisella jalkaterän pisteellä on vastineensa elimissä ja kudoksissa. Vyöhyketerapia lukee tätä karttaa lempeästi ja palauttaa virtauksen sinne, missä se on takkuillut.",
      "Hoito tukee unen laatua, ruoansulatusta, hormonitasapainoa ja yleistä rentoutumista.",
    ],
    duration: "60 min",
    price: "70 €",
    image: vyohykeImg,
  },
  {
    slug: "hermoratahieronta",
    number: "04",
    name: "Hermoratahieronta",
    tagline: "Suomalainen syvähoito",
    short:
      "Perinteinen menetelmä, joka herättelee kehon omaa kykyä korjata ja palautua.",
    body: [
      "Hermoratahieronta käsittelee kehon hermoratoja ja kireitä kudoksia syvällä, mutta lempeällä otteella. Se sopii erityisesti niska-hartiakireyksiin, päänsärkyihin ja krooniseen jännitykseen.",
      "Hoito on vahva, mutta sen jälkitunne on kevyt — kuin keho olisi muistanut, miten hengittää uudelleen.",
    ],
    duration: "60 min",
    price: "75 €",
    image: hermorataImg,
  },
  {
    slug: "rentouttava-facelift",
    number: "05",
    name: "Rentouttava Facelift",
    tagline: "Kasvot vapaiksi jännityksestä",
    short:
      "Lempeä hoito, joka vapauttaa kasvojen lihaksia ja tuo esiin luonnollisen hehkun.",
    body: [
      "Kasvoissamme asuu päivän koko tarina — purettu leuka, kohotetut kulmat, kireä otsa. Rentouttava facelift purkaa nämä jännitykset pehmeästi ja palauttaa pinnan elävyyden.",
      "Hoito on rentouttava, ei-invasiivinen ja sopii kaikenikäisille.",
    ],
    duration: "45 min",
    price: "65 €",
    image: faceliftImg,
  },
  {
    slug: "voimavaraterapia",
    number: "06",
    name: "Voimavara-terapia & Lyhytterapia",
    tagline: "Sanat, jotka kantavat",
    short:
      "Ratkaisukeskeistä tukea elämän käännekohtiin — ilman diagnooseja, ilman kiirettä.",
    body: [
      "Joskus tarvitsemme tilan, jossa ajatella ääneen. Voimavara-terapia on luottamuksellinen keskustelu, joka auttaa sinua löytämään omat vastauksesi.",
      "Lähestymistapani on lempeä, ratkaisukeskeinen ja kunnioittaa sitä viisautta, joka sinussa jo asuu.",
    ],
    duration: "60 min",
    price: "85 €",
    image: voimavaraImg,
  },
];

export const sointukylpyDates: { year: number; month: number; day: number }[] = [
  { year: 2026, month: 1, day: 21 },
  { year: 2026, month: 1, day: 28 },
  { year: 2026, month: 2, day: 18 },
  { year: 2026, month: 2, day: 25 },
  { year: 2026, month: 3, day: 4 },
  { year: 2026, month: 3, day: 25 },
  { year: 2026, month: 4, day: 1 },
  { year: 2026, month: 4, day: 8 },
  { year: 2026, month: 4, day: 15 },
  { year: 2026, month: 4, day: 29 },
  { year: 2026, month: 6, day: 29 },
];

export const contact = {
  phone: "040 553 5388",
  phoneIntl: "+358405535388",
  email: "voimalyhty@gmail.com",
  address: "Pasilan Urheilutalo, Radiokatu 22, 00240 Helsinki",
  practitioner: "Nanna",
};
