import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

// Leaflet touches `window`, so the map is loaded on the client only.
const MapApp = lazy(() => import("../components/MapApp"));

export const Route = createFileRoute("/")({
  component: () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted ? (
      <Suspense fallback={null}><MapApp /></Suspense>
    ) : null;
  },
});
