import { useTitle } from "../../hooks/useTitle";
import { Hero } from "./components/Hero";
import { FeaturedProducts } from "./components/FeaturedProducts";
import { FeaturedVideos } from "./components/FeaturedVideos";
import { FeaturedMusic } from "./components/FeaturedMusic";
import { Testimonials } from "./components/Testimonials";
import { Faq } from "./components/Faq";
import { Footer } from "../../components";

export const HomePage = () => {
  useTitle("DigiHub");

  return (
    <main>
        <Hero />
        <FeaturedProducts />
        <FeaturedVideos />
        <FeaturedMusic />
        <Testimonials />
        <Faq />
        <Footer />
    </main>
  )
}