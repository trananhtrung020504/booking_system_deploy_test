'use client';

import { useLayoutEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGsapExperience(rootRef: RefObject<HTMLElement | null>, signature: string) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const hoverCleanups: Array<() => void> = [];
    const refreshScrollTriggers = () => ScrollTrigger.refresh();

    const context = gsap.context(() => {
      gsap.fromTo(
        root,
        { autoAlpha: 0, y: 18, filter: 'blur(10px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.7,
          ease: 'power3.out',
          clearProps: 'transform,filter,opacity,visibility',
        }
      );

      gsap.from('[data-gsap-hero] > *', {
        autoAlpha: 0,
        y: 36,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.08,
        clearProps: 'transform,opacity,visibility',
      });

      const revealElements = gsap
        .utils
        .toArray<HTMLElement>('[data-gsap-reveal]')
        .filter((element) => !element.parentElement?.closest('[data-gsap-reveal]'));

      revealElements.forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 44, scale: 0.985 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: 'power3.out',
            clearProps: 'transform,opacity,visibility',
            scrollTrigger: {
              trigger: element,
              start: 'top 98%',
              invalidateOnRefresh: true,
              once: true,
            },
          }
        );
      });

      gsap.utils.toArray<HTMLElement>('.gsap-card').forEach((card) => {
        const enter = () => {
          gsap.to(card, {
            y: -8,
            scale: 1.018,
            boxShadow: '0 26px 70px rgba(216,169,79,0.22)',
            duration: 0.35,
            ease: 'power3.out',
          });
        };
        const leave = () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            boxShadow: '0 18px 44px rgba(0,0,0,0.32)',
            duration: 0.45,
            ease: 'power3.out',
          });
        };

        card.addEventListener('mouseenter', enter);
        card.addEventListener('mouseleave', leave);
        hoverCleanups.push(() => {
          card.removeEventListener('mouseenter', enter);
          card.removeEventListener('mouseleave', leave);
        });
      });

      requestAnimationFrame(refreshScrollTriggers);
    }, root);

    const refreshTimeout = window.setTimeout(refreshScrollTriggers, 350);
    window.addEventListener('load', refreshScrollTriggers, { once: true });

    return () => {
      window.clearTimeout(refreshTimeout);
      window.removeEventListener('load', refreshScrollTriggers);
      hoverCleanups.forEach((cleanup) => cleanup());
      context.revert();
    };
  }, [rootRef, signature]);
}
