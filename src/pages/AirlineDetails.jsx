import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAirlineDetails, deleteReview } from '../services/api';
import { getCurrentUser } from '../services/auth';
import ReviewForm from '../components/ReviewForm';
import ReviewEdit from '../components/ReviewEdit';

const AirlineDetails = () => {
  const { id } = useParams();
  const [airlineData, setAirlineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

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

  const fetchAirlineDetails = async () => {
    try {
      const data = await getAirlineDetails(id);
      console.log("Airline details data:", data);
      setAirlineData(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching airline details:", err);
      setError('Failed to load airline details. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirlineDetails();
  }, [id]);

  // Function to calculate average rating
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  };

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

  const handleReviewSuccess = () => {
    // Refresh airline details to show the new review
    fetchAirlineDetails();
    // Hide the review form and edit form
    setShowReviewForm(false);
    setEditingReviewId(null);
  };

  const handleEditClick = (reviewId) => {
    setEditingReviewId(reviewId);
    // Close any expanded view
    setExpandedReviewId(null);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
  };

  const handleDeleteClick = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      
      await deleteReview(reviewId, user.dbId);
      console.log('Review deleted successfully');
      
      // Refresh the airline details
      fetchAirlineDetails();
      
      setDeleteLoading(false);
    } catch (err) {
      console.error('Error deleting review:', err);
      setDeleteError('Failed to delete review. Please try again.');
      setDeleteLoading(false);
    }
  };

  const toggleReviewExpansion = (reviewId) => {
    // Don't allow toggling while editing
    if (editingReviewId !== null) return;
    
    if (expandedReviewId === reviewId) {
      setExpandedReviewId(null); // Collapse if already expanded
    } else {
      setExpandedReviewId(reviewId); // Expand this review
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-xl text-blue-600">Loading airline details...</div>
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

  const { airline, reviews } = airlineData;
  const averageRating = calculateAverageRating(reviews);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
      <div className="max-w-5xl mx-auto">
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
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-800 font-bold text-xl">
                  {airline.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">{airline.name}</h1>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-1 flex justify-center">
                {renderStars(averageRating)}
              </div>
              <div className="text-xl font-bold text-blue-800">
                {averageRating.toFixed(1)}/5
              </div>
              <div className="border-t border-gray-200 w-3/4 mx-auto mt-3 pt-2">
                <div className="text-sm text-gray-600">
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Reviews</h2>
          
          {user ? (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          ) : (
            <div className="text-sm text-gray-600">
              Sign in to write a review
            </div>
          )}
        </div>
        
        {deleteError && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {deleteError}
          </div>
        )}
        
        {showReviewForm && user && (
          <div className="mb-8">
            <ReviewForm 
              airlineId={id} 
              userId={user.dbId} 
              onSuccess={handleReviewSuccess} 
            />
          </div>
        )}
        
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
                {editingReviewId === review.id ? (
                  <ReviewEdit 
                    review={review}
                    userId={user?.dbId}
                    onSuccess={handleReviewSuccess}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <>
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleReviewExpansion(review.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">{review.heading}</h3>
                        <div className="flex items-center">
                          <div className="flex mr-2">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-2">
                        {review.departure_city} to {review.arrival_city}
                      </div>
                      
                      <AnimatePresence>
                        {expandedReviewId === review.id ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <p className="text-gray-700 my-4 whitespace-pre-line">{review.description}</p>
                            
                            {review.image_url && (
                              <div className="mt-4 mb-6 max-w-md mx-auto">
                                <img
                                  src={review.image_url}
                                  alt=""
                                  className="w-full max-h-48 object-contain rounded-md"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <motion.p 
                            className="text-gray-600 line-clamp-1"
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {review.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* User actions for their own reviews */}
                    {user && user.dbId === review.user_id && (
                      <div className="flex justify-end space-x-2 p-3 bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(review.id);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          Update
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(review.id);
                          }}
                          disabled={deleteLoading}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          {deleteLoading ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AirlineDetails; 