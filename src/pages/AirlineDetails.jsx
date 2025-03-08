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
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 text-red-700 p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center"
          >
            <p>{deleteError}</p>
            <button 
              onClick={() => setDeleteError(null)}
              className="text-red-700 hover:text-red-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        )}
        
        {showReviewForm && user && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <ReviewForm 
              airlineId={id} 
              userId={user.dbId} 
              onSuccess={handleReviewSuccess} 
            />
          </motion.div>
        )}
        
        {reviews.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-8 text-center"
          >
            <p className="text-gray-600 text-lg">No reviews yet for this airline.</p>
            {user && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Be the first to review
              </button>
            )}
          </motion.div>
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
                className="bg-white rounded-xl shadow-md overflow-hidden"
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
                      className="p-6 cursor-pointer hover:bg-blue-50 transition-all duration-200"
                      onClick={() => toggleReviewExpansion(review.id)}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">{review.heading}</h3>
                        <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                          <div className="flex mr-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{review.departure_city} to {review.arrival_city}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-blue-600">
                          {expandedReviewId === review.id ? (
                            <div className="flex items-center">
                              <span className="text-sm mr-1">Hide details</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="text-sm mr-1">Show details</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedReviewId === review.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-gray-100"
                          >
                            <p className="text-gray-700 mb-4 whitespace-pre-line">{review.description}</p>
                            
                            {review.image_url && (
                              <div className="mt-4 mb-4">
                                <img 
                                  src={review.image_url} 
                                  alt="Review" 
                                  className="rounded-lg max-h-96 max-w-full object-contain shadow-sm"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            {user && user.dbId === review.user_id && (
                              <div className="mt-4 flex flex-wrap justify-end space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(review.id);
                                  }}
                                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full hover:bg-blue-200 transition-all flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if(window.confirm('Are you sure you want to delete this review?')) {
                                      handleDeleteClick(review.id);
                                    }
                                  }}
                                  disabled={deleteLoading}
                                  className="bg-red-100 text-red-700 px-4 py-2 rounded-full hover:bg-red-200 transition-all flex items-center"
                                >
                                  {deleteLoading ? (
                                    <span>Deleting...</span>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      Delete
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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