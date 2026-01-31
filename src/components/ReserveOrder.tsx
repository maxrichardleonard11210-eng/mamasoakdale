import { Button } from '@/components/ui/button';
import { Calendar, ShoppingBag } from 'lucide-react';

export function ReserveOrder() {
  return (
    <section className="section-padding bg-primary text-primary-foreground">
      <div className="container-narrow text-center">
        <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">
          Ready to Dine?
        </h2>
        <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
          Whether you're joining us for dinner or enjoying our food at home, 
          we're here to serve you.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="secondary"
            size="xl"
            className="bg-cream text-foreground hover:bg-cream/90"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Reserve a Table
          </Button>
          <Button
            variant="outline"
            size="xl"
            className="border-cream/50 text-cream hover:bg-cream hover:text-foreground"
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            Order Online
          </Button>
        </div>
      </div>
    </section>
  );
}
