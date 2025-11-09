"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

export const Spotlight = ({
  children,
  className = "",
  fill = "rgba(255, 215, 0, 0.5)",
}: {
  children?: React.ReactNode;
  className?: string;
  fill?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const mouse = useRef({ x: 0, y: 0 });
  const containerSize = useRef({ w: 0, h: 0 });
  const [render, setRender] = useState(false);

  useEffect(() => {
    setRender(true);
  }, []);

  useEffect(() => {
    if (!render) return;
    
    const container = containerRef.current!;
    if (!container) return;
    
    const updateContainerSize = () => {
      const rect = container.getBoundingClientRect();
      containerSize.current.w = rect.width;
      containerSize.current.h = rect.height;
    };
    
    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);
    
    const updateMousePosition = (ev: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      mousePosition.current.x = x;
      mousePosition.current.y = y;
    };
    
    window.addEventListener("mousemove", updateMousePosition);
    
    let animationFrame: number;
    
    const updateAnimation = () => {
      const xDiff = mousePosition.current.x - mouse.current.x;
      const yDiff = mousePosition.current.y - mouse.current.y;
      
      mouse.current.x += xDiff * 0.2;
      mouse.current.y += yDiff * 0.2;
      
      container.style.setProperty("--mouse-x", `${mouse.current.x}px`);
      container.style.setProperty("--mouse-y", `${mouse.current.y}px`);
      
      animationFrame = requestAnimationFrame(updateAnimation);
    };
    
    updateAnimation();
    
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("resize", updateContainerSize);
      cancelAnimationFrame(animationFrame);
    };
  }, [render]);

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        "--mouse-x": "0px",
        "--mouse-y": "0px",
      } as React.CSSProperties}
    >
      {render && (
        <motion.div
          className="spotlight-effect absolute pointer-events-none"
          style={{
            background: `radial-gradient(700px circle at var(--mouse-x) var(--mouse-y), ${fill}, transparent 40%)`,
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            zIndex: 1,
            transform: "translateZ(0)",
          }}
        />
      )}
      {children}
    </motion.div>
  );
};