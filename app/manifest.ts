import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "INPTIC",
    short_name: "INPTIC",
    description:
      "Institut National de la Poste, des Technologies de l'Information et de la Communication",

    start_url: "/",
    scope: "/",
    display: "standalone",

    background_color: "#ffffff",
    theme_color: "#ffffff",

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}