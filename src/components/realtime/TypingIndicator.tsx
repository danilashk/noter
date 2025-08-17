'use client'

import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  name: string
  color: string
}

export function TypingIndicator({ name, color }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute -top-8 left-2 z-10"
    >
      <div
        className="px-2 py-1 rounded-md text-xs text-white font-medium flex items-center gap-1 shadow-sm"
        style={{ backgroundColor: color }}
      >
        <span>{name} печатает</span>
        <div className="flex gap-0.5">
          <motion.div
            className="w-1 h-1 bg-white rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-1 h-1 bg-white rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-1 h-1 bg-white rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
      
      {/* Стрелка */}
      <div 
        className="absolute top-full left-3 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent"
        style={{ borderTopColor: color }}
      />
    </motion.div>
  )
}