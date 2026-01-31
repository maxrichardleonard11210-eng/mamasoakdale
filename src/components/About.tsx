import restaurantInterior from '@/assets/restaurant-interior.jpg';

export function About() {
  return (
    <section id="about" className="section-padding">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-lg overflow-hidden shadow-hero">
              <img
                src={restaurantInterior}
                alt="Mama's Oakdale restaurant interior"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border-2 border-olive rounded-lg -z-10" />
          </div>

          {/* Content */}
          <div>
            <span className="text-olive text-sm uppercase tracking-widest mb-4 block">
              Our Story
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-medium mb-6">
              A Family Tradition
              <span className="block text-primary">Since Day One</span>
            </h2>
            
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Mama's Oakdale is more than just a restaurant—it's a gathering place for the community, 
                where friends become family and every meal tells a story.
              </p>
              <p>
                Our recipes have been passed down through generations, from Nonna's kitchen in Sicily 
                to our home here in Oakdale. Every dish is prepared with the same love and attention 
                to detail that made our family's table the heart of every celebration.
              </p>
              <p>
                We believe in using only the freshest ingredients, making our pasta by hand daily, 
                and treating every guest like they're sitting at our own dinner table. 
                Welcome to the family.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-border">
              <div>
                <span className="font-serif text-3xl text-primary block">15+</span>
                <span className="text-sm text-muted-foreground">Years Serving</span>
              </div>
              <div>
                <span className="font-serif text-3xl text-primary block">50+</span>
                <span className="text-sm text-muted-foreground">Family Recipes</span>
              </div>
              <div>
                <span className="font-serif text-3xl text-primary block">1000s</span>
                <span className="text-sm text-muted-foreground">Happy Guests</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
