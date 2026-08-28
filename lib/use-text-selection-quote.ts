"use client";

import { useState, useEffect, RefObject } from "react";

export function useTextSelectionQuote(containerRef: RefObject<HTMLElement | null>) {
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);
  const [selectedQuoteText, setSelectedQuoteText] = useState<string>("");
  const [hasActiveSelection, setHasActiveSelection] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;

    const checkSelection = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          setHasActiveSelection(false);
          return;
        }

        const text = selection.toString().trim();
        if (text.length < 5) {
          setHasActiveSelection(false);
          return;
        }

        if (containerRef.current) {
          try {
            const range = selection.getRangeAt(0);
            if (containerRef.current.contains(range.commonAncestorContainer)) {
              setSelectedQuoteText(text);
              setHasActiveSelection(true);
              return;
            }
          } catch {
            // Ignora
          }
        }
        setHasActiveSelection(false);
      }, 120);
    };

    const handleMouseUp = () => checkSelection();
    const handleTouchEnd = () => checkSelection();

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mouseup", handleMouseUp);
      container.addEventListener("touchend", handleTouchEnd);
    }
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setHasActiveSelection(false);
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      clearTimeout(timer);
      if (container) {
        container.removeEventListener("mouseup", handleMouseUp);
        container.removeEventListener("touchend", handleTouchEnd);
      }
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [containerRef]);

  return {
    quoteModalOpen,
    setQuoteModalOpen,
    selectedQuoteText,
    setSelectedQuoteText,
    hasActiveSelection,
    setHasActiveSelection,
  };
}
