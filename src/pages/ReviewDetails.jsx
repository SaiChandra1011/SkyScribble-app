import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getReviewDetails, deleteReview } from '../services/api';
import { getCurrentUser } from '../services/auth';
import ReviewEdit from '../components/ReviewEdit';

const ReviewDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        stars.push(<span key={i} className="text-yellow-400 text-2xl">★</span>);
      } else {
        stars.push(<span key={i} className="text-white text-2xl">★</span>);
      }
    }
    
    return stars;
  };

  const handleEditSuccess = async () => {
    setIsEditing(false);
    // Refresh the review data
    try {
      setLoading(true);
      const data = await getReviewDetails(id);
      setReview(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to refresh review details.');
      setLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      
      await deleteReview(id, user.dbId);
      console.log('Review deleted successfully');
      
      // Navigate back to the airline details page
      navigate(`/airlines/${review.airline_id}`);
    } catch (err) {
      console.error('Error deleting review:', err);
      setError('Failed to delete review. Please try again.');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-xl text-blue-600">Loading review details...</div>
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
      <div className="max-w-4xl mx-auto">
        <Link 
          to={`/airlines/${review.airline_id}`} 
          className="inline-flex items-center text-blue-600 mb-6 hover:underline"
        >
          ← Back to {review.airline_name}
        </Link>
        
        {isEditing ? (
          <ReviewEdit 
            review={review}
            userId={user?.dbId}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-bold text-gray-800">{review.heading}</h1>
                <div className="flex flex-col items-end">
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-lg font-medium text-gray-700 mt-1">
                    {review.rating}/5
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="font-medium text-blue-800">
                  {review.departure_city} to {review.arrival_city}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Reviewed on {new Date(review.created_at).toLocaleDateString()} by {review.user_name}
                </div>
              </div>
              
              <div className="text-gray-700 mb-8 whitespace-pre-line">
                {review.description}
              </div>
              
              {review.image_url && (
                <div className="mt-6 mb-8">
                  <img
                    src={review.image_url}
                    alt=""
                    className="w-full max-h-96 object-cover rounded-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Edit and Delete buttons (only for user's own reviews) */}
              {user && user.dbId === review.user_id && (
                <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Review
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    disabled={deleteLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete Review'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReviewDetails; 