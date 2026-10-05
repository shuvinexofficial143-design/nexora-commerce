import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nexora Commerce",
    short_name: "Nexora",
    description:
      "Video-first commerce storefront with simple checkout and smart product discovery.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f8f6",
    theme_color: "#f8f8f6",
  };
}
