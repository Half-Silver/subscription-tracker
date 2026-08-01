import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/subscriptions")({
  head: () => ({
    meta: [
      { title: "Subscriptions — MAYDAY" },
      { name: "description", content: "All tracked subscriptions with payment method and status filters." },
      { property: "og:title", content: "Subscriptions — MAYDAY" },
      { property: "og:description", content: "All tracked subscriptions with payment method and status filters." },
    ],
  }),
  component: () => <Outlet />,
});