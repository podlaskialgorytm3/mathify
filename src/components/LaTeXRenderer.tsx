"use client";

import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LaTeXRendererProps {
  content: string;
  className?: string;
}

export default function LaTeXRenderer({
  content,
  className = "",
}: LaTeXRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    try {
      // Wzory inline: $...$
      // Wzory blokowe: $$...$$
      const processedContent = content.replace(
        /\$\$([^\$]+)\$\$|\$([^\$]+)\$/g,
        (match, displayMath, inlineMath) => {
          try {
            const math = displayMath || inlineMath;
            const isDisplay = !!displayMath;

            return katex.renderToString(math, {
              displayMode: isDisplay,
              throwOnError: false,
              output: "html",
            });
          } catch (error) {
            console.error("KaTeX rendering error:", error);
            return match;
          }
        }
      );

      if (containerRef.current) {
        containerRef.current.innerHTML = processedContent;
      }
    } catch (error) {
      console.error("LaTeX rendering error:", error);
      if (containerRef.current) {
        containerRef.current.textContent = content;
      }
    }
  }, [content]);

  return <div ref={containerRef} className={className} />;
}
