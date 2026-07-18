import { useEffect } from "react";

// SEO for the SPA tier: swap the document title + meta description while a
// career page is mounted and restore the previous values on unmount. (Server
// rendering / react-helmet can replace this without touching page code — the
// call sites already pass exactly a title and a description.)
const useDocumentMeta = (title, description) => {
  useEffect(() => {
    if (!title) return undefined;
    const prevTitle = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    let created = false;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
      created = true;
    }
    const prevDescription = meta.getAttribute("content");
    if (description) meta.setAttribute("content", description);

    return () => {
      document.title = prevTitle;
      if (created) {
        meta.remove();
      } else if (prevDescription !== null) {
        meta.setAttribute("content", prevDescription);
      }
    };
  }, [title, description]);
};

export default useDocumentMeta;
