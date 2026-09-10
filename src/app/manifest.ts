import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Cartera",
    short_name: "Cartera",
    description: "Ingresos, gastos y balance personal.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f2ec",
    theme_color: "#173c35",
  };
}
