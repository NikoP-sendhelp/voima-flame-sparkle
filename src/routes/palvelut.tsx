import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/palvelut")({
  component: () => <Outlet />,
});
