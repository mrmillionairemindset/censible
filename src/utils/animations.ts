import { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const slideInFromRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
};

export const slideInFromLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export const fabExpand: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const fabStagger: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const ringProgress = (percentage: number) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: percentage / 100,
    opacity: 1,
    transition: {
      pathLength: {
        type: 'spring',
        duration: 1.5,
        bounce: 0.4,
      },
      opacity: { duration: 0.3 },
    },
  },
});

export const counterAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 },
};

export const swipeAnimation = {
  swipeThreshold: 100,
  rubberBandFactor: 0.3,
  swipeVelocityThreshold: 500,
};

export const toastAnimation = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

export const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const springConfig = {
  stiffness: 300,
  damping: 30,
  mass: 1,
};

export const smoothTransition = {
  duration: 0.3,
  ease: [0.4, 0.0, 0.2, 1],
};

export const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const shimmerAnimation = {
  backgroundImage: [
    'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
  ],
  backgroundPosition: ['-200% 0', '200% 0'],
  transition: {
    backgroundPosition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};