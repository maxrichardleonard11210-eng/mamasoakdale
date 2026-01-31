import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { MenuSection } from '@/components/MenuSection';
import { About } from '@/components/About';
import { Reviews } from '@/components/Reviews';
import { Contact } from '@/components/Contact';
import { ReserveOrder } from '@/components/ReserveOrder';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <MenuSection />
        <About />
        <Reviews />
        <Contact />
        <ReserveOrder />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
