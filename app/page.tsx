import { ForecastView } from "@/components/ForecastView";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main className="flex-1">
        <ForecastView />
      </main>
      <Footer />
    </>
  );
}
