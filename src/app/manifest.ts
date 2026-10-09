import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elite Ambiental — CRM",
    short_name: "Elite CRM",
    description: "Central operacional da Elite Ambiental",
    start_url: "/",
    display: "standalone",
    background_color: "#FBFBF8",
    theme_color: "#0F1715",
    icons: [
      {
        src: "/brand/icone-app.png",
        sizes: "432x432",
        type: "image/png",
      },
    ],
  };
}
