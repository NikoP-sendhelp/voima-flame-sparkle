import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import ogImage from "@/assets/og-cover.jpg";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="max-w-md text-center">
        <p className="text-[10px] uppercase tracking-luxe text-ember">404</p>
        <h1 className="mt-4 font-display text-5xl italic text-driftwood">
          Polku katosi sumuun
        </h1>
        <p className="mt-4 text-sm text-driftwood/60">
          Etsimääsi sivua ei löytynyt. Palaa etusivulle ja löydä takaisin tielle.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block border border-driftwood px-6 py-3 text-[11px] uppercase tracking-luxe text-driftwood transition hover:bg-driftwood hover:text-sand"
        >
          Etusivulle
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl italic">Hetkinen…</h1>
        <p className="mt-2 text-sm text-driftwood/60">
          Jotain meni vikaan. Yritä uudelleen tai palaa etusivulle.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="border border-driftwood px-5 py-2 text-[11px] uppercase tracking-luxe hover:bg-driftwood hover:text-sand"
          >
            Yritä uudelleen
          </button>
          <a
            href="/"
            className="border border-driftwood/30 px-5 py-2 text-[11px] uppercase tracking-luxe"
          >
            Etusivulle
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Voima Lyhty — Sointu sisälläsi | Helsinki Pasila" },
      {
        name: "description",
        content:
          "Äänimaljarentoutusta, sointukylpyjä ja kosketuksellisia hoitoja Pasilan Urheilutalolla. Tervetuloa rauhoittumaan.",
      },
      { name: "author", content: "Voima Lyhty" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "fi_FI" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Voima Lyhty — Sointu sisälläsi | Helsinki Pasila" },
      { name: "twitter:title", content: "Voima Lyhty — Sointu sisälläsi | Helsinki Pasila" },
      { name: "description", content: "A dynamic, animated website for Voimalyhty Innovations, showcasing their services with modern design and Finnish content." },
      { property: "og:description", content: "A dynamic, animated website for Voimalyhty Innovations, showcasing their services with modern design and Finnish content." },
      { name: "twitter:description", content: "A dynamic, animated website for Voimalyhty Innovations, showcasing their services with modern design and Finnish content." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e5970c8a-bcc9-4c65-9535-0da19c34edf3/id-preview-7d31349b--2085e859-b047-4758-8b38-e3940a1f2f15.lovable.app-1780001457508.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e5970c8a-bcc9-4c65-9535-0da19c34edf3/id-preview-7d31349b--2085e859-b047-4758-8b38-e3940a1f2f15.lovable.app-1780001457508.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <SiteNav />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <SiteFooter />
    </QueryClientProvider>
  );
}

// Reserved for future OG image use on routes that opt-in.
export const defaultOgImage = ogImage;
