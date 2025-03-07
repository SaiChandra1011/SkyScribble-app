import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getReviewDetails } from '../services/api';

const ReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviewDetails = async () => {
      try {
        const data = await getReviewDetails(id);
        setReview(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load review details. Please try again later.');
        setLoading(false);
      }
    };

    fetchReviewDetails();
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
        <div className="text-xl">Loading review details...</div>
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
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center text-blue-600 mb-6 hover:underline"
        >
          ← Back
        </button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-gray-800">{review.heading}</h1>
              <div className="flex text-2xl">
                {renderStars(review.rating)}
              </div>
            </div>
            
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                {review.departure_city} to {review.arrival_city}
              </div>
              <div className="ml-4 text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>
            
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 whitespace-pre-line">{review.description}</p>
            </div>
            
            {review.image_url && (
              <div className="mb-8">
                <img
                  src={review.image_url}
                  alt="Review"
                  className="w-full h-auto rounded-lg shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="border-t pt-4">
              <div className="text-sm text-gray-500">
                Review by <span className="font-medium">{review.user_name || 'Anonymous'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReviewDetails; 