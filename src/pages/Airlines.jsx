import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAirlines } from '../services/api';

const Airlines = () => {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAirlines = async () => {
      try {
        const data = await getAirlines();
        setAirlines(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load airlines. Please try again later.');
        setLoading(false);
      }
    };

    fetchAirlines();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Function to render stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating);
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else {
        stars.push(<span key={i} className="text-gray-300">★</span>);
      }
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading airlines...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-center text-blue-900 mb-12">
          Airline Reviews
        </h1>
        
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2"
        >
          {airlines.map((airline) => (
            <motion.div
              key={airline.id}
              variants={item}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link to={`/airlines/${airline.id}`} className="block p-6">
                <div className="flex items-center mb-4">
                  {airline.logo_url && (
                    <img
                      src={airline.logo_url}
                      alt={`${airline.name} logo`}
                      className="w-12 h-12 object-contain mr-4"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/48?text=Logo';
                      }}
                    />
                  )}
                  <h2 className="text-xl font-semibold text-gray-800">{airline.name}</h2>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-lg mr-2">
                      {renderStars(airline.average_rating)}
                    </div>
                    <span className="text-gray-600">
                      ({airline.average_rating.toFixed(1)})
                    </span>
                  </div>
                  
                  <span className="text-gray-500 text-sm">
                    {airline.review_count} {airline.review_count === 1 ? 'review' : 'reviews'}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Airlines; 