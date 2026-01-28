import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-300 via-dark-200 to-dark-300">
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
      <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }} className="inline-block mb-4">
        <Globe className="w-16 h-16 text-primary-500" />
      </motion.div>
      <h2 className="font-display text-3xl gradient-text tracking-wider">Chargement...</h2>
      <div className="mt-4 flex justify-center space-x-2">
        {[0, 1, 2].map((i) => (<motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} className="w-3 h-3 bg-primary-500 rounded-full" />))}
      </div>
    </motion.div>
  </div>
);

export default LoadingScreen;
