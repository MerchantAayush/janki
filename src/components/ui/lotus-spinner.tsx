import { motion } from "framer-motion";

export function LotusSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center w-12 h-12 ${className}`}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((rotation, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-6 bg-pink-300/60 rounded-full origin-bottom"
          style={{ rotate: rotation, bottom: '50%' }}
          animate={{
            scaleY: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute w-3 h-3 bg-primary rounded-full z-10" />
    </div>
  );
}
