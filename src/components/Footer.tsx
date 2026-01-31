import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-cream py-16">
      <div className="container-wide px-5 md:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <span className="font-serif text-3xl font-semibold">Mama's</span>
              <span className="block text-xs tracking-[0.2em] uppercase text-cream/60">
                Oakdale
              </span>
            </div>
            <p className="text-cream/70 text-sm leading-relaxed">
              Classic Italian cuisine made with heart, served with love.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-medium mb-4 text-cream">Quick Links</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li>
                <a href="#menu" className="hover:text-cream transition-colors">
                  Our Menu
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-cream transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-cream transition-colors">
                  Reviews
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-cream transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium mb-4 text-cream">Contact</h4>
            <ul className="space-y-3 text-sm text-cream/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:6315899640" className="hover:text-cream transition-colors">
                  (631) 589-9640
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  587 Montauk Hwy<br />
                  Oakdale, NY 11769
                </span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-medium mb-4 text-cream">Hours</h4>
            <ul className="space-y-1 text-sm text-cream/70">
              <li>Mon: Closed</li>
              <li>Tue-Thu: 11 AM – 9 PM</li>
              <li>Fri-Sat: 11 AM – 10 PM</li>
              <li>Sun: 12 PM – 8 PM</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-cream/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-cream/50">
            © {currentYear} Mama's Oakdale. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-cream/50">
            <a href="#" className="hover:text-cream transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-cream transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
