import { Star, MapPin, Clock, Utensils, ShoppingBag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroPasta from '@/assets/hero-pasta.jpg';

export function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroPasta}
          alt="Delicious Italian pasta"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 section-padding container-wide w-full pt-32">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 animate-fade-up">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < 4 ? 'fill-gold text-gold' : 'fill-gold/40 text-gold/40'}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">4.4 · 239 reviews</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium leading-tight mb-4 animate-fade-up stagger-1">
            Mama's
            <span className="block text-primary">Oakdale</span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-muted-foreground font-light italic mb-6 animate-fade-up stagger-2">
            Classic Italian. Made with Heart.
          </p>

          {/* Info Pills */}
          <div className="flex flex-wrap gap-3 mb-8 animate-fade-up stagger-3">
            <span className="inline-flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-2 text-sm">
              <MapPin className="h-4 w-4 text-olive" />
              Oakdale, NY
            </span>
            <span className="inline-flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-2 text-sm">
              <Clock className="h-4 w-4 text-olive" />
              Opens 11 AM
            </span>
            <span className="inline-flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-2 text-sm font-medium">
              $20–30
            </span>
          </div>

          {/* Service Options */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10 animate-fade-up stagger-3">
            <span className="inline-flex items-center gap-2">
              <Utensils className="h-4 w-4" /> Dine-in
            </span>
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Takeout
            </span>
            <span className="inline-flex items-center gap-2">
              <Truck className="h-4 w-4" /> Delivery
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up stagger-4">
            <Button variant="hero" size="xl" asChild>
              <a href="tel:6315899640">Reserve a Table</a>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <a href="tel:6315899640">Order Online</a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-foreground/50 rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
}
