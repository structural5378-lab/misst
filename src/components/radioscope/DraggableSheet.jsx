import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useAnimationControls, useMotionValue, useDragControls, useTransform } from "framer-motion";
import { X } from "lucide-react";

const SNAP_POINTS = [0.40, 0.75, 0.95];

export default function DraggableSheet({ onClose, header, footer, children, initialSnap = 0.75 }) {
  const [windowHeight, setWindowHeight] = useState(() =>
    window.visualViewport?.height || window.innerHeight
  );
  const controls = useAnimationControls();
  const dragControls = useDragControls();
  const y = useMotionValue(windowHeight);
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const update = () => setWindowHeight(window.visualViewport?.height || window.innerHeight);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", update);
    };
  }, []);

  const snapToY = useCallback((snap) => (1 - snap) * windowHeight, [windowHeight]);

  const backdropOpacity = useTransform(
    y,
    [snapToY(0.95), snapToY(0.75), snapToY(0.40), windowHeight],
    [0.5, 0.45, 0.35, 0]
  );

  // Enter animation on mount
  useEffect(() => {
    controls.start({
      y: snapToY(initialSnap),
      transition: { type: "spring", stiffness: 380, damping: 38 },
    });
  }, []); // eslint-disable-line

  // Adjust position on resize / orientation change
  useEffect(() => {
    if (!isClosing) y.set(snapToY(currentSnap));
  }, [windowHeight]); // eslint-disable-line

  const animateToSnap = useCallback(
    (snap) => {
      setCurrentSnap(snap);
      controls.start({
        y: snapToY(snap),
        transition: { type: "spring", stiffness: 380, damping: 38 },
      });
    },
    [snapToY, controls]
  );

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    controls
      .start({ y: windowHeight, transition: { type: "spring", stiffness: 380, damping: 38 } })
      .then(() => onClose());
  }, [isClosing, controls, windowHeight, onClose]);

  const handleDragEnd = useCallback(
    (_, info) => {
      const currentY = y.get();
      const velocity = info.velocity.y;
      const allTargets = [0, ...SNAP_POINTS];
      let target;

      if (Math.abs(velocity) > 500) {
        const idx = allTargets.indexOf(currentSnap);
        target =
          velocity > 0
            ? allTargets[Math.max(0, idx - 1)]
            : allTargets[Math.min(allTargets.length - 1, idx + 1)];
      } else {
        let minDist = Infinity;
        for (const snap of allTargets) {
          const d = Math.abs(snapToY(snap) - currentY);
          if (d < minDist) {
            minDist = d;
            target = snap;
          }
        }
      }

      if (target === 0) handleClose();
      else animateToSnap(target);
    },
    [currentSnap, snapToY, y, animateToSnap, handleClose]
  );

  return createPortal(
    <>
      <motion.div
        onClick={handleClose}
        className="fixed inset-0 z-[85] bg-black backdrop-blur-sm"
        style={{ opacity: backdropOpacity }}
      />
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: snapToY(0.95), bottom: snapToY(0) }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ y, height: windowHeight }}
        className="fixed bottom-0 left-0 right-0 z-[90] bg-card rounded-t-3xl border-t border-cyan-500/30 flex flex-col will-change-transform shadow-2xl"
      >
        {/* Drag handle */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="shrink-0 cursor-grab active:cursor-grabbing touch-none pt-2.5 pb-1.5 flex justify-center"
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/40" />
        </div>

        {/* Header — always visible, not draggable */}
        <div className="flex items-start justify-between px-4 pt-1 pb-3 shrink-0">
          <div className="flex-1 min-w-0">{header}</div>
          <button
            onClick={handleClose}
            className="p-2 -m-1 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 overscroll-contain px-4 pb-4">{children}</div>

        {/* Footer — always visible above safe area */}
        {footer && (
          <div className="shrink-0 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] border-t border-border/50">
            {footer}
          </div>
        )}
      </motion.div>
    </>,
    document.body
  );
}