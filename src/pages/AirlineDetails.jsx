import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAirlineDetails, deleteReview, checkServerEndpoint } from '../services/api';
import { getCurrentUser } from '../services/auth';
import ReviewForm from '../components/ReviewForm';
import ReviewEdit from '../components/ReviewEdit';

const AirlineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [airline, setAirline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log("Current user in AirlineDetails:", currentUser);
        
        if (currentUser) {
          if (!currentUser.id) {
            console.error('User object is missing the ID property:', currentUser);
          } else {
            console.log('User ID found:', currentUser.id);
          }
          setUser(currentUser);
        } else {
          console.log('No user is currently logged in');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
      }
    };

    checkUser();
    fetchAirlineDetails();
  }, [id]);

  const fetchAirlineDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching airline details for ID:", id);
      const data = await getAirlineDetails(id);
      console.log("Airline details fetched:", data);
      
      // Sort reviews by date (newest first) and remove duplicates
      if (data && data.reviews && data.reviews.length > 0) {
        // First, sort by created_at (newest first)
        data.reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Then remove duplicates based on heading and user_id
        const uniqueReviews = [];
        const seen = new Set();
        
        data.reviews.forEach(review => {
          // Create a unique key for each review based on user_id and heading
          const key = `${review.user_id}-${review.heading}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueReviews.push(review);
          } else {
            console.log('Filtered out duplicate review:', review.heading);
          }
        });
        
        // Replace the reviews array with our filtered one
        data.reviews = uniqueReviews;
      }
      
      setAirline(data);
    } catch (error) {
      console.error('Error fetching airline details:', error);
      setError('Failed to load airline details. Please ensure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + parseFloat(review.rating), 0);
    return sum / reviews.length;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <span 
            key={i} 
            style={{ 
              color: '#FFD700', // Gold color
              fontSize: '1.2rem',
              margin: '0 1px'
            }}
          >
            ★
          </span>
        );
      } else {
        stars.push(
          <span 
            key={i} 
            style={{ 
              color: '#D1D5DB', // Light gray for outline
              fontSize: '1.2rem',
              margin: '0 1px'
            }}
          >
            ☆
          </span>
        );
      }
    }

    return stars;
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleReviewSuccess = () => {
    // Hide review form
    setShowReviewForm(false);
    
    // Show a temporary success message
    setSuccessMessage('Review submitted successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    
    // Fetch updated reviews immediately
    fetchAirlineDetails();
    
    // Scroll to top to show the success message
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleEditClick = (reviewId) => {
    setEditingReviewId(reviewId);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
  };

  const handleDeleteClick = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is logged in
      if (!user || !user.id) {
        alert('You must be logged in to delete a review.');
        return;
      }
      
      console.log('Attempting to delete review:', reviewId, 'by user:', user.id);
      
      await deleteReview(reviewId, user.id);
      
      // Show success message
      alert('Review deleted successfully!');
      
      // Refresh airline details to show updated list
      await fetchAirlineDetails();
    } catch (error) {
      console.error('Error deleting review:', error);
      
      // Provide a more detailed error message
      let errorMessage = 'Failed to delete review. ';
      
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewExpansion = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const toggleReviewForm = () => {
    setShowReviewForm(!showReviewForm);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchAirlineDetails}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!airline) {
    return (
      <div className="container mx-auto px-4 py-20">
        <p className="text-center">Airline not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      {/* Success message notification */}
      {successMessage && (
        <div className="fixed top-20 left-0 right-0 flex justify-center z-50">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
            {successMessage}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4 text-blue-600">{airline.name}</h1>
        <div className="flex items-center mb-4">
          <div className="flex mr-2">
            {renderStars(calculateAverageRating(airline.reviews))}
          </div>
          <span className="text-gray-700">
            ({calculateAverageRating(airline.reviews).toFixed(1)}/5 from {airline.reviews.length} {airline.reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
        
        <p className="text-gray-600 mb-4">{airline.code}</p>

        {user ? (
          <div className="mt-6">
            {showReviewForm ? (
              <ReviewForm
                airlineId={id}
                userId={user.id}
                onSuccess={handleReviewSuccess}
                onCancel={() => setShowReviewForm(false)}
              />
            ) : (
              <button
                onClick={toggleReviewForm}
                className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600 transition-colors duration-300"
              >
                Write a Review
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-gray-700 mb-2">
              You must be logged in to submit a review.
            </p>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-800">Reviews</h2>

      {airline.reviews.length === 0 ? (
        <p className="text-gray-600 italic">No reviews yet. Be the first to review!</p>
      ) : (
        <div>
          {airline.reviews.map((review, index) => (
            <div key={review.id}>
              <div style={{ marginBottom: '3rem' }}>
                {editingReviewId === review.id ? (
                  <ReviewEdit
                    review={review}
                    userId={user?.id}
                    onSuccess={() => {
                      setEditingReviewId(null);
                      fetchAirlineDetails();
                    }}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="cursor-pointer"
                    onClick={() => toggleReviewExpansion(review.id)}
                  >
                    <div 
                      style={{ 
                        backgroundColor: '#4a89dc', 
                        borderRadius: '10px', 
                        padding: '20px',
                        paddingBottom: '25px',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(74, 137, 220, 0.2)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        {review.heading}
                      </h3>
                      
                      <div style={{ display: 'flex', marginBottom: '12px' }}>
                        {renderStars(review.rating)}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ marginRight: '8px', fontSize: '1.25rem' }}>📍</span>
                        <span>{review.departure_city} to {review.arrival_city}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span style={{ marginRight: '8px', fontSize: '1.25rem', marginTop: '2px' }}>💬</span>
                        <span>{truncateText(review.description, 60)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px' }}>
                        <span style={{ marginRight: '8px', fontSize: '1.25rem' }}>👤</span>
                        <span>Reviewed by {review.display_name || 'Anonymous'}</span>
                      </div>
                      
                      {user && user.id === review.user_id && (
                        <div style={{ 
                          display: 'flex',
                          justifyContent: 'flex-end',
                          marginTop: '15px',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255,255,255,0.2)',
                        }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(review.id);
                            }}
                            style={{
                              backgroundColor: 'white',
                              color: '#4a89dc',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontWeight: '500',
                              marginRight: '10px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Update
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(review.id);
                            }}
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.15)',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontWeight: '500',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      
                      <AnimatePresence>
                        {expandedReviews[review.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div style={{ marginTop: '15px' }}>
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                marginBottom: '15px',
                                borderTop: '1px solid rgba(255,255,255,0.2)',
                                paddingTop: '15px'
                              }}>
                                <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Full Description:</h4>
                                <p>{review.description}</p>
                              </div>
                              
                              {review.image_url && (
                                <div style={{ marginTop: '15px', textAlign: 'left' }}>
                                  <img 
                                    src={review.image_url} 
                                    alt="Review" 
                                    style={{ 
                                      maxWidth: '80%', 
                                      maxHeight: '200px',
                                      borderRadius: '8px',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                    }} 
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          marginTop: '10px',
                          color: 'rgba(255,255,255,0.7)'
                        }}
                      >
                        {expandedReviews[review.id] ? 'Click to collapse' : 'Click to expand'}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Add spacer after every review except the last one */}
              {index < airline.reviews.length - 1 && (
                <div style={{ 
                  height: '5rem', 
                  marginBottom: '3rem', 
                  borderBottom: '2px solid #e5e7eb',
                  position: 'relative',
                  overflow: 'visible'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '50px',
                    height: '50px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #e5e7eb'
                  }}>
                    <span style={{ color: '#9ca3af', fontSize: '24px' }}>✈️</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AirlineDetails; 