import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Welcome to SkyScribble
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover honest reviews from real travelers around the world
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Link
              to="/airlines"
              className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Exploring Reviews
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home; 