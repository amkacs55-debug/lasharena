import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/public/Hero";
import { ServicesSection } from "@/components/public/ServicesSection";
import { GallerySection } from "@/components/public/GallerySection";
import { ContactSection } from "@/components/public/ContactSection";
import { BookingWizard } from "@/features/booking/BookingWizard";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navbar />
      <main>
        <Hero />
        <ServicesSection />
        <GallerySection />
        <ContactSection />
      </main>
      <Footer />
      <BookingWizard />
    </div>
  );
}
