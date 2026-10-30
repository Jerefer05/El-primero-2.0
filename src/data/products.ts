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
  description?: string; // texto de la ficha: tamaño, duración, cómo se recarga
  featured?: boolean; // se muestra primero, con cartel de "Destacado"
};

// Los productos ahora se cargan desde el almacén (/almacen).
// Esta lista queda como respaldo por si la base no responde.
export const featuredProducts: Product[] = [
  {
    id: "pecera-grande",
    name: "Vela Pecera Grande",
    priceLabel: "$18.000",
    price: 18000,
    image: "/productos/vela-pecera.jpg",
    alt: "Vela pecera de vidrio redondo con cera blanca",
    category: "velas",
  },
  {
    id: "triangulo",
    name: "Vela Triángulo",
    priceLabel: "$15.000",
    price: 15000,
    image: "/productos/vela-triangulo.jpg",
    alt: "Vela triángulo en vaso de vidrio facetado",
    category: "velas",
  },
  {
    id: "esmeralda",
    name: "Vela Esmerilada",
    priceLabel: "$12.150",
    price: 12150,
    image: "/productos/vela-esmerilada.jpg",
    alt: "Vela en vaso de vidrio esmerilado",
    category: "velas",
  },
  {
    id: "textura",
    name: "Vela Textura",
    priceLabel: "$12.000",
    price: 12000,
    image: "/productos/vela-textura.jpg",
    alt: "Vela en vaso de vidrio con textura",
    category: "velas",
  },
  {
    id: "cera-250",
    name: "Cera de Recarga 250gr",
    priceLabel: "$4.200",
    price: 4200,
    image: "/productos/cera-250gr.jpg",
    alt: "Bolsa de cera de recarga Tesoria de 250 gramos",
    category: "recarga",
  },
  {
    id: "cera-500",
    name: "Cera de Recarga 500gr",
    priceLabel: "$7.200",
    price: 7200,
    image: "/productos/cera-500gr.jpg",
    alt: "Bolsa de cera de recarga Tesoria de 500 gramos",
    category: "recarga",
  },
  {
    id: "cera-1kg",
    name: "Cera de Recarga 1kg",
    priceLabel: "$15.000",
    price: 15000,
    image: "/productos/cera-1kg.jpg",
    alt: "Bolsas de cera de recarga Tesoria",
    category: "recarga",
  },
];

export function formatPrice(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}
