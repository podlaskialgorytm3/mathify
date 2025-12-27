"use client";

import { useEffect } from "react";

export function HydrationFix() {
  useEffect(() => {
    // Remove bis_skin_checked attributes added by browser extensions
    const removeExtensionAttributes = () => {
      const elements = document.querySelectorAll("[bis_skin_checked]");
      elements.forEach((el) => {
        el.removeAttribute("bis_skin_checked");
      });
    };

    // Run immediately
    removeExtensionAttributes();

    // Also run after a short delay to catch any late additions
    const timeoutId = setTimeout(removeExtensionAttributes, 100);

    // Set up a MutationObserver to remove attributes as they're added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "bis_skin_checked"
        ) {
          const target = mutation.target as Element;
          target.removeAttribute("bis_skin_checked");
        }
      });
    });

    // Observe the entire document for attribute changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["bis_skin_checked"],
      subtree: true,
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return null;
}
