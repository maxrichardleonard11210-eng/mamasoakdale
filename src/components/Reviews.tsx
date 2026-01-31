import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    name: 'Maria S.',
    rating: 5,
    text: "Best Italian food on Long Island! The chicken parm is incredible and the homemade pasta melts in your mouth. Feels like eating at grandma's house.",
    date: '2 weeks ago',
  },
  {
    name: 'Robert T.',
    rating: 5,
    text: "We've been coming here for years and it never disappoints. The staff treats you like family and the food is consistently excellent. Try the lasagna!",
    date: '1 month ago',
  },
  {
    name: 'Jennifer L.',
    rating: 4,
    text: "Wonderful atmosphere and delicious food. The tiramisu is the best I've had outside of Italy. Only wish they were open on Mondays!",
    date: '3 weeks ago',
  },
  {
    name: 'Anthony C.',
    rating: 5,
    text: "Authentic Italian cuisine at its finest. The osso buco is a masterpiece. Great wine selection too. Perfect for date night or family dinners.",
    date: '1 week ago',
  },
];

export function Reviews() {
  return (
    <section id="reviews" className="section-padding bg-muted/30">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-olive text-sm uppercase tracking-widest mb-2 block">
            What People Say
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">
            Guest Reviews
          </h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < 4 ? 'fill-gold text-gold' : 'fill-gold/40 text-gold/40'}`}
                />
              ))}
            </div>
            <span>4.4 out of 5 · 239 reviews on Google</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-card rounded-lg p-6 shadow-soft relative"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-muted/50" />
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'fill-gold text-gold' : 'fill-muted text-muted'
                    }`}
                  />
                ))}
              </div>

              <p className="text-foreground mb-4 leading-relaxed">"{review.text}"</p>

              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{review.name}</span>
                <span className="text-sm text-muted-foreground">{review.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
