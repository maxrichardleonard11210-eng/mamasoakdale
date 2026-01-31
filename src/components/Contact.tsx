import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

const hours = [
  { day: 'Monday', hours: 'Closed' },
  { day: 'Tuesday', hours: '11 AM – 9 PM' },
  { day: 'Wednesday', hours: '11 AM – 9 PM' },
  { day: 'Thursday', hours: '11 AM – 9 PM' },
  { day: 'Friday', hours: '11 AM – 10 PM' },
  { day: 'Saturday', hours: '11 AM – 10 PM' },
  { day: 'Sunday', hours: '12 PM – 8 PM' },
];

export function Contact() {
  return (
    <section id="contact" className="section-padding">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Info */}
          <div>
            <span className="text-olive text-sm uppercase tracking-widest mb-4 block">
              Visit Us
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-medium mb-8">
              Location & Hours
            </h2>

            {/* Address */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Address</h3>
                <p className="text-muted-foreground">
                  587 Montauk Hwy<br />
                  Oakdale, NY 11769
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Phone</h3>
                <a
                  href="tel:6315899640"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  (631) 589-9640
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-lg mb-3">Hours</h3>
                <div className="space-y-2">
                  {hours.map((item) => (
                    <div
                      key={item.day}
                      className="flex justify-between text-sm border-b border-border pb-2 last:border-0"
                    >
                      <span className="text-muted-foreground">{item.day}</span>
                      <span className={item.hours === 'Closed' ? 'text-primary' : 'text-foreground'}>
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Directions Button */}
            <Button
              variant="heroOutline"
              size="lg"
              className="w-full sm:w-auto"
              asChild
            >
              <a
                href="https://maps.google.com/?q=587+Montauk+Hwy+Oakdale+NY+11769"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </a>
            </Button>
          </div>

          {/* Map Placeholder */}
          <div className="relative">
            <div className="aspect-square lg:aspect-auto lg:h-full min-h-[400px] rounded-lg overflow-hidden bg-muted">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.0!2d-73.1389!3d40.7389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzIwLjAiTiA3M8KwMDgnMjAuMCJX!5e0!3m2!1sen!2sus!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale contrast-[1.1] opacity-90"
                title="Mama's Oakdale Location"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
