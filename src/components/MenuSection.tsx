import { useState } from 'react';
import { Button } from '@/components/ui/button';
import appetizer from '@/assets/appetizer.jpg';
import pizza from '@/assets/pizza.jpg';

const menuCategories = [
  { id: 'appetizers', name: 'Appetizers' },
  { id: 'pasta', name: 'Pasta' },
  { id: 'entrees', name: 'Entrées' },
  { id: 'pizza', name: 'Pizza' },
  { id: 'desserts', name: 'Desserts' },
  { id: 'drinks', name: 'Drinks' },
];

const menuItems = {
  appetizers: [
    { name: 'Bruschetta Classica', description: 'Fresh tomatoes, garlic, basil, extra virgin olive oil', price: '$12' },
    { name: 'Calamari Fritti', description: 'Lightly fried calamari with marinara and lemon aioli', price: '$16' },
    { name: 'Caprese Salad', description: 'Fresh mozzarella, vine tomatoes, basil, balsamic reduction', price: '$14' },
    { name: 'Antipasto Board', description: 'Cured meats, aged cheeses, olives, roasted peppers', price: '$22' },
  ],
  pasta: [
    { name: 'Spaghetti Carbonara', description: 'Guanciale, egg yolk, pecorino Romano, black pepper', price: '$24' },
    { name: 'Fettuccine Alfredo', description: 'House-made pasta, butter, parmigiano-Reggiano', price: '$22' },
    { name: 'Penne alla Vodka', description: 'San Marzano tomatoes, cream, vodka, fresh basil', price: '$21' },
    { name: 'Lasagna della Nonna', description: "Mama's recipe, bolognese, béchamel, three cheeses", price: '$26' },
  ],
  entrees: [
    { name: 'Chicken Parmigiana', description: 'Breaded cutlet, marinara, melted mozzarella, spaghetti', price: '$28' },
    { name: 'Veal Marsala', description: 'Tender veal, mushrooms, Marsala wine reduction', price: '$34' },
    { name: 'Branzino al Forno', description: 'Whole roasted Mediterranean sea bass, herbs, lemon', price: '$38' },
    { name: 'Osso Buco', description: 'Braised veal shank, gremolata, saffron risotto', price: '$42' },
  ],
  pizza: [
    { name: 'Margherita DOC', description: 'San Marzano tomatoes, fresh mozzarella, basil', price: '$18' },
    { name: 'Diavola', description: 'Spicy salami, tomato sauce, mozzarella, chili oil', price: '$21' },
    { name: 'Quattro Formaggi', description: 'Mozzarella, gorgonzola, fontina, parmigiano', price: '$22' },
    { name: 'Prosciutto e Rucola', description: 'Prosciutto di Parma, arugula, shaved parmesan', price: '$24' },
  ],
  desserts: [
    { name: 'Tiramisù', description: 'Classic espresso-soaked ladyfingers, mascarpone cream', price: '$12' },
    { name: 'Cannoli Siciliani', description: 'Crispy shells, sweet ricotta, chocolate chips', price: '$10' },
    { name: 'Panna Cotta', description: 'Vanilla bean, mixed berry compote', price: '$11' },
    { name: 'Affogato', description: 'Vanilla gelato, fresh espresso, amaretti', price: '$9' },
  ],
  drinks: [
    { name: 'Italian Red Wine', description: 'Selection of Chianti, Barolo, Montepulciano', price: '$12+' },
    { name: 'Aperol Spritz', description: 'Aperol, prosecco, soda, orange slice', price: '$14' },
    { name: 'Limoncello', description: 'House-made Amalfi lemon liqueur', price: '$10' },
    { name: 'Espresso', description: 'Double shot, served with biscotti', price: '$5' },
  ],
};

export function MenuSection() {
  const [activeCategory, setActiveCategory] = useState('appetizers');

  return (
    <section id="menu" className="section-padding bg-card">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-olive text-sm uppercase tracking-widest mb-2 block">
            Our Selection
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">
            The Menu
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Traditional recipes passed down through generations, prepared with the finest ingredients
          </p>
        </div>

        {/* Category Images */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="relative overflow-hidden rounded-lg aspect-[4/3] group">
            <img
              src={appetizer}
              alt="Fresh bruschetta"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="font-serif text-2xl text-cream">Starters & Shared</span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-lg aspect-[4/3] group">
            <img
              src={pizza}
              alt="Wood-fired pizza"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="font-serif text-2xl text-cream">Wood-Fired Pizza</span>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {menuCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 max-w-4xl mx-auto">
          {menuItems[activeCategory as keyof typeof menuItems].map((item, index) => (
            <div
              key={item.name}
              className="flex justify-between items-start py-4 border-b border-border animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex-1 pr-4">
                <h3 className="font-serif text-lg font-medium text-foreground mb-1">
                  {item.name}
                </h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <span className="font-medium text-primary whitespace-nowrap">{item.price}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button variant="hero" size="lg">
            Order Online
          </Button>
        </div>
      </div>
    </section>
  );
}
