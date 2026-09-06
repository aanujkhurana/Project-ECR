import { redirect } from "next/navigation";

// Keep a single search entry point so the landing and results flows share one route.
export default function Home() {
  redirect("/vehicles");
}
