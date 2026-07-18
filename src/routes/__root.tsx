import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "../lib/cart-store";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="kicker mb-4">404 / OFF THE GRID</p>
        <h1 className="display-h text-6xl text-foreground">Nothing here.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          This page slipped out of the drop.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-foreground/20 px-6 py-3 text-xs uppercase tracking-[0.28em] font-mono hover:bg-foreground hover:text-background transition-colors"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="kicker mb-4">SYSTEM ERROR</p>
        <h1 className="display-h text-4xl text-foreground">Signal lost.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Something broke on our end.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="border border-foreground/20 px-6 py-3 text-xs uppercase tracking-[0.28em] font-mono hover:bg-foreground hover:text-background transition-colors"
          >
            Retry
          </button>
          <a
            href="/"
            className="px-6 py-3 text-xs uppercase tracking-[0.28em] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
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
      { title: "NICKY BOY — The Signature Drop / Editorial Streetwear" },
      { name: "description", content: "The signature NICKY BOY crewneck. Heavyweight cotton fleece, hand-drawn anime graphic, limited drop. Ships from India." },
      { name: "theme-color", content: "#0A0A0A" },
      { property: "og:title", content: "NICKY BOY — The Signature Drop" },
      { property: "og:description", content: "Heavyweight cotton crewneck. Hand-drawn anime graphic. Limited drop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Caveat:wght@400;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
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
      <CartProvider>
        <Outlet />
        <Toaster theme="dark" position="bottom-right" />
      </CartProvider>
    </QueryClientProvider>
  );
}
