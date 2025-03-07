import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAirlines } from '../services/api';
import { getCurrentUser } from '../services/auth';
import AirlineForm from '../components/AirlineForm';

const Airlines = () => {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showAirlineForm, setShowAirlineForm] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkUser();
  }, []);

  const fetchAirlines = async () => {
    try {
      const data = await getAirlines();
      console.log("Airlines data:", data);
      setAirlines(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching airlines:", err);
      setError('Failed to load airlines. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Function to handle successful airline creation
  const handleAirlineSuccess = (newAirline) => {
    fetchAirlines(); // Refresh the airlines list
    setShowAirlineForm(false); // Hide the form
  };

  // Function to render stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating);
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<span key={i} className="text-yellow-400 text-2xl">★</span>);
      } else {
        stars.push(<span key={i} className="text-gray-300 text-2xl">★</span>);
      }
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-xl text-blue-600">Loading airlines...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left"
          >
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              Airline Reviews
            </h1>
            <p className="text-gray-600">
              Browse or add airlines to review
            </p>
          </motion.div>
          
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => setShowAirlineForm(!showAirlineForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {showAirlineForm ? 'Cancel' : 'Add New Airline'}
              </button>
            </motion.div>
          )}
        </div>
        
        {showAirlineForm && user && (
          <AirlineForm 
            onSuccess={handleAirlineSuccess} 
            onCancel={() => setShowAirlineForm(false)} 
          />
        )}
        
        {airlines.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">No airlines found. Add one to get started!</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {airlines.map((airline) => (
              <motion.div
                key={airline.id}
                variants={item}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link to={`/airlines/${airline.id}`} className="block p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-blue-800 font-bold text-lg">
                          {airline.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800">{airline.name}</h2>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex mb-2">
                      {renderStars(airline.average_rating)}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-medium text-gray-700">
                        {Number(airline.average_rating).toFixed(1)}/5
                      </span>
                      <span className="text-sm text-gray-500 mt-1">
                        {airline.review_count} {airline.review_count === 1 ? 'review' : 'reviews'}
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

export default Airlines; 