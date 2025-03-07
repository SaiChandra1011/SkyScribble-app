import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAirlineDetails } from '../services/api';

const AirlineDetails = () => {
  const { id } = useParams();
  const [airlineData, setAirlineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAirlineDetails = async () => {
      try {
        const data = await getAirlineDetails(id);
        setAirlineData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load airline details. Please try again later.');
        setLoading(false);
      }
    };

    fetchAirlineDetails();
  }, [id]);

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
        <div className="text-xl">Loading airline details...</div>
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

  const { airline, reviews } = airlineData;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/airlines" 
          className="inline-flex items-center text-blue-600 mb-6 hover:underline"
        >
          ← Back to Airlines
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="flex items-center mb-4">
            {airline.logo_url && (
              <img
                src={airline.logo_url}
                alt={`${airline.name} logo`}
                className="w-16 h-16 object-contain mr-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/64?text=Logo';
                }}
              />
            )}
            <h1 className="text-3xl font-bold text-gray-800">{airline.name}</h1>
          </div>
        </motion.div>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Reviews</h2>
        
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">No reviews yet for this airline.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="space-y-6"
          >
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <Link to={`/reviews/${review.id}`} className="block">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">{review.heading}</h3>
                      <div className="flex text-lg">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-2">
                      {review.departure_city} to {review.arrival_city}
                    </div>
                    
                    <p className="text-gray-600 line-clamp-3">{review.description}</p>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        By {review.user_name || 'Anonymous'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AirlineDetails; 