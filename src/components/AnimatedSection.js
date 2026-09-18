import React from 'react';
import { motion } from 'framer-motion';

const defaultVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const AnimatedSection = ({ children, className = '', style = {}, duration = 0.32, variants = defaultVariants, ...props }) => {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
