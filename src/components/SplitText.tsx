import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import React, { useRef, useState, useEffect } from 'react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface SplitTextProps {
  text: string;
  className?: string;
  /** 각 단위 사이 stagger 간격 (ms) */
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: 'chars' | 'words' | 'lines';
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  /** ScrollTrigger 진입 threshold (0~1) */
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
  onLetterAnimationComplete?: () => void;
}

function splitText(text: string, type: 'chars' | 'words' | 'lines'): string[] {
  if (type === 'chars') return [...text]; // Unicode-safe split
  if (type === 'words') return text.split(/(\s+)/); // 공백 포함 유지
  if (type === 'lines') return text.split('\n').filter(Boolean);
  return [...text];
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  tag = 'p',
  textAlign = 'center',
  onLetterAnimationComplete,
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  const units = splitText(text, splitType);

  useGSAP(
    () => {
      if (!containerRef.current || !fontsLoaded) return;

      const targets = containerRef.current.querySelectorAll<HTMLElement>('.split-unit');
      if (!targets.length) return;

      // rootMargin → ScrollTrigger start 값으로 변환
      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? (marginMatch[2] ?? 'px') : 'px';
      const offset =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? ` -=${Math.abs(marginValue)}${marginUnit}`
            : ` +=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${offset}`;

      gsap.fromTo(targets, { ...from }, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        willChange: 'transform, opacity',
        force3D: true,
        scrollTrigger: {
          trigger: containerRef.current,
          start,
          once: true,
          fastScrollEnd: true,
        },
        onComplete: () => {
          onLetterAnimationComplete?.();
        },
      });
    },
    {
      dependencies: [
        text, delay, duration, ease, splitType,
        JSON.stringify(from), JSON.stringify(to),
        threshold, rootMargin, fontsLoaded,
      ],
      scope: containerRef,
    },
  );

  const Tag = (tag ?? 'p') as React.ElementType;

  return (
    <Tag
      ref={containerRef}
      className={`split-parent overflow-hidden inline-block whitespace-normal ${className}`}
      style={{ textAlign, wordWrap: 'break-word' }}
    >
      {units.map((unit, i) => {
        // 공백만인 토큰은 그대로 렌더링 (words 모드에서 공백 유지)
        if (/^\s+$/.test(unit)) {
          return <span key={i} aria-hidden="true">{unit}</span>;
        }
        return (
          <span
            key={i}
            className="split-unit"
            style={{ display: 'inline-block' }}
          >
            {unit}
          </span>
        );
      })}
    </Tag>
  );
};

export default SplitText;
