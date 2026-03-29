import { useEffect } from "react";

interface SEOOptions {
  title: string;
  description: string;
  type?: string;
}

export function useSEO({ title, description, type = "website" }: SEOOptions) {
  useEffect(() => {
    document.title = title;

    function upsertMeta(selector: string, attr: string, value: string) {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        if (selector.includes("property")) {
          const prop = selector.match(/property="([^"]+)"/)?.[1] ?? "";
          el.setAttribute("property", prop);
        } else {
          const name = selector.match(/name="([^"]+)"/)?.[1] ?? "";
          el.setAttribute("name", name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    }

    upsertMeta('meta[name="description"]', "content", description);
    upsertMeta('meta[property="og:title"]', "content", title);
    upsertMeta('meta[property="og:description"]', "content", description);
    upsertMeta('meta[property="og:type"]', "content", type);
    upsertMeta('meta[name="twitter:title"]', "content", title);
    upsertMeta('meta[name="twitter:description"]', "content", description);
    upsertMeta('meta[name="twitter:card"]', "content", "summary");
  }, [title, description, type]);
}
