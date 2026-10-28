"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Send, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in your name, email and message.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to send message.");
        setLoading(false);
        return;
      }
      setSent(true);
      toast.success(data.message || "Message sent successfully!");
    } catch {
      toast.error("Network error. Please try again or reach out on WhatsApp.");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-forest/30 bg-forest/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-forest" />
        <h3 className="mt-3 font-display text-xl font-bold text-ink">Message Received</h3>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed max-w-md mx-auto">
          Thank you for reaching out to us. A member of our boutique team will review your inquiry and reply to{" "}
          <strong>{form.email}</strong> shortly.
        </p>
        <button
          onClick={() => {
            setForm({ name: "", email: "", phone: "", subject: "", message: "" });
            setSent(false);
            setLoading(false);
          }}
          className="mt-6 text-xs font-semibold uppercase tracking-wider text-signal underline hover:text-ink"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border hairline bg-paper p-6 sm:p-8 shadow-sm">
      <h3 className="font-display text-xl font-bold text-ink mb-1">Send Us a Direct Message</h3>
      <p className="text-xs text-ink-soft mb-6">
        Have questions about saree fabrics, bridal draping, custom blouse styling or order dispatch? Write to us below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gold mb-1.5">
            Your Name *
          </label>
          <input
            required
            type="text"
            placeholder="e.g. Shravani Reddy"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border hairline bg-cream/50 px-3.5 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gold mb-1.5">
            Email Address *
          </label>
          <input
            required
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border hairline bg-cream/50 px-3.5 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gold mb-1.5">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border hairline bg-cream/50 px-3.5 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gold mb-1.5">
            Subject *
          </label>
          <input
            required
            type="text"
            placeholder="e.g. Saree fabric / Bridal inquiry"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded-lg border hairline bg-cream/50 px-3.5 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gold mb-1.5">
          Your Message *
        </label>
        <textarea
          required
          rows={4}
          placeholder="Tell us what you're looking for or how we can assist you..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-lg border hairline bg-cream/50 px-3.5 py-2.5 text-sm focus:border-signal focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-signal px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-cream shadow transition-colors hover:bg-ink disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        <span>{loading ? "Sending…" : "Send Message"}</span>
      </button>
    </form>
  );
}

