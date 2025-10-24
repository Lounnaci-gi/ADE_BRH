import React from 'react';
import { motion } from 'framer-motion';

const KpiCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue', 
  percentage, 
  showProgress = false,
  size = 'normal' // 'compact' or 'normal'
}) => {
  const colorVariants = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-800',
      value: 'text-blue-900',
      icon: 'text-blue-600'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-800',
      value: 'text-green-900',
      icon: 'text-green-600'
    },
    yellow: {
      gradient: 'from-yellow-500 to-yellow-600',
      bg: 'from-yellow-50 to-yellow-100',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      value: 'text-yellow-900',
      icon: 'text-yellow-600'
    },
    red: {
      gradient: 'from-red-500 to-red-600',
      bg: 'from-red-50 to-red-100',
      border: 'border-red-200',
      text: 'text-red-800',
      value: 'text-red-900',
      icon: 'text-red-600'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      text: 'text-purple-800',
      value: 'text-purple-900',
      icon: 'text-purple-600'
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'from-indigo-50 to-indigo-100',
      border: 'border-indigo-200',
      text: 'text-indigo-800',
      value: 'text-indigo-900',
      icon: 'text-indigo-600'
    },
    emerald: {
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      value: 'text-emerald-900',
      icon: 'text-emerald-600'
    },
    cyan: {
      gradient: 'from-cyan-500 to-cyan-600',
      bg: 'from-cyan-50 to-cyan-100',
      border: 'border-cyan-200',
      text: 'text-cyan-800',
      value: 'text-cyan-900',
      icon: 'text-cyan-600'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'from-orange-50 to-orange-100',
      border: 'border-orange-200',
      text: 'text-orange-800',
      value: 'text-orange-900',
      icon: 'text-orange-600'
    }
  };

  const colors = colorVariants[color] || colorVariants.blue;

  const cardSize = size === 'compact' 
    ? 'p-3 min-h-[100px]' 
    : 'p-4 min-h-[120px]';

  const titleSize = size === 'compact' 
    ? 'text-xs font-medium' 
    : 'text-sm font-semibold';

  const valueSize = size === 'compact' 
    ? 'text-lg font-bold' 
    : 'text-2xl font-bold';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
      transition={{ 
        duration: 0.3,
        ease: "easeOut"
      }}
      className={`
        relative overflow-hidden rounded-xl border-2 ${colors.border} 
        bg-gradient-to-br ${colors.bg} shadow-lg hover:shadow-xl 
        transition-all duration-300 cursor-pointer group
        ${cardSize}
      `}
    >
      {/* Animated background gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.1 }}
      />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className={`${titleSize} ${colors.text} truncate`}>
            {title}
          </h3>
          {Icon && (
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className={`${colors.icon} opacity-80 group-hover:opacity-100`}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
          )}
        </div>

        {/* Value */}
        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className={`${valueSize} ${colors.value} mb-1`}
          >
            {value}
          </motion.div>
          
          {subtitle && (
            <div className={`text-xs ${colors.text} opacity-75`}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && percentage !== undefined && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className={colors.text}>Progression</span>
              <span className={`${colors.text} font-medium`}>{typeof percentage === 'number' ? percentage.toFixed(2).replace('.', ',') : percentage}%</span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
      />
    </motion.div>
  );
};

export default KpiCard;
