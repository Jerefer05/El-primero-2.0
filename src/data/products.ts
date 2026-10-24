export type Product = {
  id: string;
  name: string;
  priceLabel: string;
  price: number;
  image: string;
  alt: string;
  category: "velas" | "recarga";
  inStock?: boolean; // false = se muestra como "Agotado"
  features?: { label: string; value: string }[];
};

// Los productos ahora se cargan desde el almacén (/almacen).
// Esta lista queda como respaldo por si la base no responde.
export const featuredProducts: Product[] = [
  {
    id: "pecera-grande",
    name: "Vela Pecera Grande",
    priceLabel: "$18.000",
    price: 18000,
    image:
      "https://images.unsplash.com/photo-1602607688737-cef3c33bd608?w=800&q=80",
    alt: "Vela artesanal pecera grande sobre fondo neutro",
    category: "velas",
  },
  {
    id: "triangulo",
    name: "Vela Triángulo",
    priceLabel: "$15.000",
    price: 15000,
    image:
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80",
    alt: "Velas minimalistas de forma triangular",
    category: "velas",
  },
  {
    id: "esmeralda",
    name: "Vela Esmeralda",
    priceLabel: "$12.150",
    price: 12150,
    image:
      "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=800&q=80",
    alt: "Vela esmeralda en recipiente de vidrio",
    category: "velas",
  },
  {
    id: "textura",
    name: "Vela Textura",
    priceLabel: "$12.000",
    price: 12000,
    image:
      "https://images.unsplash.com/photo-1599751449128-eb7249c3d6b1?w=800&q=80",
    alt: "Vela artesanal con superficie texturada",
    category: "velas",
  },
  {
    id: "cera-250",
    name: "Cera de Recarga 250gr",
    priceLabel: "$4.200",
    price: 4200,
    image:
      "https://images.unsplash.com/photo-1608181831688-ba9436e9f8a1?w=800&q=80",
    alt: "Cera de recarga de 250 gramos para velas artesanales",
    category: "recarga",
  },
  {
    id: "cera-500",
    name: "Cera de Recarga 500gr",
    priceLabel: "$7.200",
    price: 7200,
    image:
      "https://images.unsplash.com/photo-1608181831688-ba9436e9f8a1?w=800&q=80",
    alt: "Cera de recarga de 500 gramos para velas artesanales",
    category: "recarga",
  },
  {
    id: "cera-1kg",
    name: "Cera de Recarga 1kg",
    priceLabel: "$15.000",
    price: 15000,
    image:
      "https://images.unsplash.com/photo-1608181831688-ba9436e9f8a1?w=800&q=80",
    alt: "Cera de recarga de 1 kilo para velas artesanales",
    category: "recarga",
  },
];

export const heroSlides = [
  {
    src: "https://images.unsplash.com/photo-1602607688737-cef3c33bd608?w=1920&q=80",
    alt: "Vela pecera artesanal",
  },
  {
    src: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1920&q=80",
    alt: "Velas triangulares encendidas",
  },
  {
    src: "https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=1920&q=80",
    alt: "Vela esmeralda en vidrio",
  },
];

export function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}
