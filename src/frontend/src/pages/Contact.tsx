import { useState } from "react";
import { useSEO } from "../hooks/useSEO";

interface Props {
  isDark: boolean;
}

export default function Contact({ isDark }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  useSEO({
    title: "Contact — Mystoryova",
    description: "Get in touch with the Mystoryova team.",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    );
    window.location.href = `mailto:mystoryova@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${body}`;
  };

  const inputStyle = {
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    border: "1px solid rgba(212,175,55,0.2)",
    color: isDark ? "#f0ead6" : "#1a1a1a",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div
          className="text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: "#D4AF37" }}
        >
          Get in Touch
        </div>
        <h1
          className="text-4xl font-bold"
          style={{
            fontFamily: "Playfair Display, serif",
            color: isDark ? "#f0ead6" : "#1a1a1a",
          }}
        >
          Contact
        </h1>
        <p className="mt-4 text-sm" style={{ color: isDark ? "#888" : "#666" }}>
          Reach out via the form below or directly at{" "}
          <a href="mailto:mystoryova@gmail.com" style={{ color: "#D4AF37" }}>
            mystoryova@gmail.com
          </a>
        </p>
      </div>
      <div
        className="rounded-2xl p-8"
        style={{
          background: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(255,255,255,0.9)",
          border: "1px solid rgba(212,175,55,0.15)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="contact-name"
                className="block text-xs mb-2"
                style={{ color: isDark ? "#888" : "#666" }}
              >
                Name
              </label>
              <input
                id="contact-name"
                data-ocid="contact.input"
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs mb-2"
                style={{ color: isDark ? "#888" : "#666" }}
              >
                Email
              </label>
              <input
                id="contact-email"
                data-ocid="contact.input"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="contact-subject"
              className="block text-xs mb-2"
              style={{ color: isDark ? "#888" : "#666" }}
            >
              Subject
            </label>
            <input
              id="contact-subject"
              data-ocid="contact.input"
              type="text"
              value={form.subject}
              onChange={(e) =>
                setForm((p) => ({ ...p, subject: e.target.value }))
              }
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label
              htmlFor="contact-message"
              className="block text-xs mb-2"
              style={{ color: isDark ? "#888" : "#666" }}
            >
              Message
            </label>
            <textarea
              id="contact-message"
              data-ocid="contact.textarea"
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            data-ocid="contact.submit_button"
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F0D060)",
              color: "#0a0a0a",
            }}
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
