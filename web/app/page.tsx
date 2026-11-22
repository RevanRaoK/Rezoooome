import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: {
    absolute: "Resume match checker | rezoooo.me",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
