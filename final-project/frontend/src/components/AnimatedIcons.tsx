import { motion } from 'framer-motion';
import {
  Home,
  Users,
  Plus,
  Map,
  User,
  Bell,
  Search,
  Settings,
  ChevronRight,
  ArrowLeft,
  MessageCircle,
  Zap,
  Trophy,
  Clock,
  Calendar,
  MapPin,
  LogOut,
  Lock,
  Info,
  Trash2,
  X,
} from 'lucide-react';

// 動畫變體
const iconVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.1 },
  tap: { scale: 0.9 },
  active: { scale: 1.05 },
};

const bounceVariants = {
  initial: { y: 0 },
  animate: {
    y: [-2, 0, -2],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const pulseVariants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const shakeVariants = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

interface AnimatedIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}

// Home Icon with subtle bounce
export const AnimatedHome = ({ size = 20, className, animate = false, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={animate ? bounceVariants : iconVariants}
    initial="initial"
    animate={animate ? 'animate' : 'initial'}
    whileHover="hover"
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Home size={size} className={className} />
  </motion.div>
);

// Users Icon with pulse
export const AnimatedUsers = ({ size = 20, className, animate = false, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={animate ? pulseVariants : iconVariants}
    initial="initial"
    animate={animate ? 'animate' : 'initial'}
    whileHover="hover"
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Users size={size} className={className} />
  </motion.div>
);

// Plus Icon with rotation on hover
export const AnimatedPlus = ({ size = 24, className, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ rotate: 0 }}
    whileHover={{ rotate: 90, scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 300 }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Plus size={size} className={className} />
  </motion.div>
);

// Map Icon with bounce
export const AnimatedMap = ({ size = 20, className, animate = false, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={animate ? bounceVariants : iconVariants}
    initial="initial"
    animate={animate ? 'animate' : 'initial'}
    whileHover="hover"
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Map size={size} className={className} />
  </motion.div>
);

// User Icon
export const AnimatedUser = ({ size = 20, className, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <User size={size} className={className} />
  </motion.div>
);

// Bell Icon with shake animation
export const AnimatedBell = ({ size = 22, className, animate = false, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={animate ? shakeVariants : iconVariants}
    initial="initial"
    animate={animate ? 'animate' : 'initial'}
    whileHover="hover"
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Bell size={size} className={className} />
  </motion.div>
);

// Search Icon
export const AnimatedSearch = ({ size = 20, className, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={iconVariants}
    initial="initial"
    whileHover={{ scale: 1.1, rotate: 15 }}
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Search size={size} className={className} />
  </motion.div>
);

// Settings Icon with rotation
export const AnimatedSettings = ({ size = 20, className, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ rotate: 0 }}
    whileHover={{ rotate: 90 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 200 }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Settings size={size} className={className} />
  </motion.div>
);

// ChevronRight with slide
export const AnimatedChevronRight = ({ size = 18, className, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ x: 0 }}
    whileHover={{ x: 4 }}
    transition={{ type: 'spring', stiffness: 400 }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <ChevronRight size={size} className={className} />
  </motion.div>
);

// ArrowLeft
export const AnimatedArrowLeft = ({ size = 20, className, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ x: 0 }}
    whileHover={{ x: -4 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 400 }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <ArrowLeft size={size} className={className} />
  </motion.div>
);

// MessageCircle
export const AnimatedMessageCircle = ({ size = 18, className, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={iconVariants}
    initial="initial"
    whileHover={{ scale: 1.15 }}
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <MessageCircle size={size} className={className} />
  </motion.div>
);

// Zap with electric animation
export const AnimatedZap = ({ size = 16, className, animate = false, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ scale: 1 }}
    animate={animate ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] } : {}}
    whileHover={{ scale: 1.2, rotate: 10 }}
    whileTap={{ scale: 0.9 }}
    transition={animate ? { duration: 0.3, repeat: 2 } : { type: 'spring' }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Zap size={size} className={className} />
  </motion.div>
);

// Trophy with bounce
export const AnimatedTrophy = ({ size = 20, className, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ y: 0 }}
    whileHover={{ y: -4, scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 300 }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Trophy size={size} className={className} />
  </motion.div>
);

// Clock
export const AnimatedClock = ({ size = 12, className, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Clock size={size} className={className} />
  </motion.div>
);

// Calendar
export const AnimatedCalendar = ({ size = 18, className, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={iconVariants}
    initial="initial"
    whileHover="hover"
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Calendar size={size} className={className} />
  </motion.div>
);

// MapPin with drop animation
export const AnimatedMapPin = ({ size = 16, className, animate = false, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ y: animate ? -10 : 0, opacity: animate ? 0 : 1 }}
    animate={{ y: 0, opacity: 1 }}
    whileHover={{ y: -2, scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 300 }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <MapPin size={size} className={className} />
  </motion.div>
);

// LogOut
export const AnimatedLogOut = ({ size = 20, className, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ x: 0 }}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 400 }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <LogOut size={size} className={className} />
  </motion.div>
);

// Lock
export const AnimatedLock = ({ size = 20, className, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={iconVariants}
    initial="initial"
    whileHover={{ scale: 1.1, rotate: -5 }}
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Lock size={size} className={className} />
  </motion.div>
);

// Info
export const AnimatedInfo = ({ size = 20, className, onClick }: AnimatedIconProps) => (
  <motion.div
    variants={pulseVariants}
    initial="initial"
    whileHover="hover"
    whileTap="tap"
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Info size={size} className={className} />
  </motion.div>
);

// Trash2
export const AnimatedTrash = ({ size = 16, className, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ rotate: 0 }}
    whileHover={{ rotate: 10, scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <Trash2 size={size} className={className} />
  </motion.div>
);

// X with rotation
export const AnimatedX = ({ size = 16, className, onClick }: AnimatedIconProps) => (
  <motion.div
    initial={{ rotate: 0 }}
    whileHover={{ rotate: 90 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 300 }}
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <X size={size} className={className} />
  </motion.div>
);

