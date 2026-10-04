import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyMoney",
    short_name: "MyMoney",
    description:
      "MyMoney — a personal money manager for tracking income, expenses, budgets and accounts.",
    start_url: "/records",
    display: "standalone",
    orientation: "portrait",
    background_color: "#191c19",
    theme_color: "#191c19",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
