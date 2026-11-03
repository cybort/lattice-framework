import { createFileRoute } from "@tanstack/react-router";
import { LatticeApp } from "@/components/lattice/LatticeApp";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <LatticeApp />;
}
