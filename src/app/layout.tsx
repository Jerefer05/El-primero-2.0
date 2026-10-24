import type { Metadata } from "next";
import { Prata, Quicksand } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import WhatsAppButton from "@/components/WhatsAppButton";
import AddedToCartModal from "@/components/AddedToCartModal";
import DiscountPopup from "@/components/DiscountPopup";
import "./globals.css";

const prata = Prata({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-prata",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tesoria | Velas artesanales y Home Deco",
  description:
    "Ilumina tu hogar sin límites con velas recargables artesanales. Home deco, añade nostálgico.",
  openGraph: {
    title: "Tesoria | Velas artesanales y Home Deco",
    description:
      "Velas recargables artesanales, home deco y polaroids. Envío gratis superando los $50.000.",
    locale: "es_AR",
    type: "website",
    siteName: "Tesoria",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${prata.variable} ${quicksand.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-[#2E2E2E]">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartSidebar />
          <AddedToCartModal />
          <DiscountPopup />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
