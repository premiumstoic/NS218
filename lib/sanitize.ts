import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Allows safe HTML tags like p, strong, em, h2, h3, ul, ol, li, code, pre, a, br.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  const config = {
    ALLOWED_TAGS: ["p", "strong", "em", "h2", "h3", "ul", "ol", "li", "code", "pre", "a", "br"],
    ALLOWED_ATTR: ["href", "title"],
    KEEP_CONTENT: true
  };

  return DOMPurify.sanitize(html, config);
}
