import type { MetadataRoute } from "next";

// Makes Beeline installable on phones and desktops ("Add to Home Screen" / "Install app").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Beeline Accommodation",
    short_name: "Beeline",
    description: "A direct route to your next stay. Stay local, book direct.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#111111",
    categories: ["travel", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My stays", short_name: "My stays", url: "/account" },
      { name: "Gympie Accommodation", short_name: "Gympie", url: "/gympie" },
    ],
  };
}
