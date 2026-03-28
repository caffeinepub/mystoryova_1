import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminApp from "./admin/AdminApp";
import Footer from "./components/Footer";
import Header from "./components/Header";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BookDetail from "./pages/BookDetail";
import Books from "./pages/Books";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Library from "./pages/Library";
import OrderTracking from "./pages/OrderTracking";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import SearchPage from "./pages/SearchPage";
import Store from "./pages/Store";
import Terms from "./pages/Terms";
import Wishlist from "./pages/Wishlist";

function PublicLayout({
  isDark,
  toggleTheme,
}: { isDark: boolean; toggleTheme: () => void }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: isDark ? "#0a0a0a" : "#f8f4f0",
        color: isDark ? "#f0ead6" : "#1a1a1a",
      }}
    >
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home isDark={isDark} />} />
          <Route path="/books" element={<Books isDark={isDark} />} />
          <Route path="/books/:id" element={<BookDetail isDark={isDark} />} />
          <Route path="/blog" element={<Blog isDark={isDark} />} />
          <Route path="/blog/:id" element={<BlogPost isDark={isDark} />} />
          <Route path="/about" element={<About isDark={isDark} />} />
          <Route path="/contact" element={<Contact isDark={isDark} />} />
          <Route path="/search" element={<SearchPage isDark={isDark} />} />
          <Route path="/wishlist" element={<Wishlist isDark={isDark} />} />
          <Route path="/store" element={<Store isDark={isDark} />} />
          <Route path="/cart" element={<Cart isDark={isDark} />} />
          <Route path="/checkout" element={<Checkout isDark={isDark} />} />
          <Route
            path="/order-tracking"
            element={<OrderTracking isDark={isDark} />}
          />
          <Route path="/library" element={<Library isDark={isDark} />} />
          <Route
            path="/privacy-policy"
            element={<PrivacyPolicy isDark={isDark} />}
          />
          <Route path="/terms" element={<Terms isDark={isDark} />} />
          <Route
            path="/return-policy"
            element={<ReturnPolicy isDark={isDark} />}
          />
        </Routes>
      </main>
      <Footer isDark={isDark} />
    </div>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("mystoryova_theme");
    if (stored === "light") {
      setIsDark(false);
      document.body.classList.add("light");
      document.body.classList.remove("dark");
    } else {
      setIsDark(true);
      document.body.classList.add("dark");
      document.body.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.body.classList.add("dark");
      document.body.classList.remove("light");
      localStorage.setItem("mystoryova_theme", "dark");
    } else {
      document.body.classList.add("light");
      document.body.classList.remove("dark");
      localStorage.setItem("mystoryova_theme", "light");
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route
          path="/*"
          element={<PublicLayout isDark={isDark} toggleTheme={toggleTheme} />}
        />
      </Routes>
      <Toaster richColors position="bottom-right" />
    </BrowserRouter>
  );
}
