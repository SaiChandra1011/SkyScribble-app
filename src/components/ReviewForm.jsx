import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createReview } from '../services/api';
import { getCurrentUser } from '../services/auth';

const ReviewForm = ({ airlineId, userId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    departure_city: '',
    arrival_city: '',
    heading: '',
    description: '',
    rating: 0
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const user = await getCurrentUser();
        console.log("Current user in ReviewForm:", user);
        
        if (user) {
          if (!user.id) {
            console.error("User is authenticated but missing ID:", user);
            setError("Your account is authenticated but missing an ID. Please log out and log in again.");
          } else {
            console.log("User authenticated with ID:", user.id);
            setCurrentUser(user);
            // Clear any auth-related error messages
            if (error && error.includes("must be logged in")) {
              setError(null);
            }
          }
        } else {
          console.log("No user is logged in");
          setError("You must be logged in to submit a review. Please sign in first.");
        }
      } catch (error) {
        console.error("Error verifying authentication:", error);
        setError("Authentication error. Please try logging in again.");
      }
    };

    verifyAuth();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear any errors when user makes changes
    if (error) setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    // Clear any errors when user selects an image
    if (error) setError(null);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating
    });
    // Clear any errors when user changes rating
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submissions
    if (submitting) {
      return;
    }
    
    try {
      // Set submitting state to show loading indicator
      setSubmitting(true);
      setError(null);

      // Validate form
      if (!formData.departure_city.trim()) {
        setError("Please enter a departure city");
        setSubmitting(false);
        return;
      }
      if (!formData.arrival_city.trim()) {
        setError("Please enter an arrival city");
        setSubmitting(false);
        return;
      }
      if (!formData.heading.trim()) {
        setError("Please enter a review title");
        setSubmitting(false);
        return;
      }
      if (!formData.description.trim()) {
        setError("Please enter a review description");
        setSubmitting(false);
        return;
      }
      if (formData.rating < 1) {
        setError("Please select a rating");
        setSubmitting(false);
        return;
      }

      // Validate user is logged in and has a numeric ID
      if (!currentUser || !currentUser.id) {
        setError("You must be logged in with a valid user account to submit a review.");
        setSubmitting(false);
        return;
      }

      // Create FormData for multipart submission
      const reviewData = new FormData();
      reviewData.append('airline_id', airlineId);
      
      // Ensure user_id is a valid number
      const numericUserId = Number(currentUser.id);
      if (isNaN(numericUserId)) {
        setError("Invalid user ID. Please log out and log in again.");
        setSubmitting(false);
        return;
      }
      
      reviewData.append('user_id', numericUserId);
      reviewData.append('departure_city', formData.departure_city);
      reviewData.append('arrival_city', formData.arrival_city);
      reviewData.append('heading', formData.heading);
      reviewData.append('description', formData.description);
      reviewData.append('rating', formData.rating);
      
      if (selectedImage) {
        reviewData.append('image', selectedImage);
      }

      console.log("Submitting review with user ID:", numericUserId);
      console.log("Airline ID:", airlineId);
      
      // Submission with proper error handling and no alerts
      try {
        const response = await createReview(reviewData);
        console.log("Review created successfully:", response);
        
        // Clear form
        setFormData({
          departure_city: '',
          arrival_city: '',
          heading: '',
          description: '',
          rating: 0
        });
        setSelectedImage(null);
        setImagePreview(null);
        setSubmitting(false);
        
        // Call the success handler to let the parent component handle the update
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
        
        // Don't use window.location.reload() as it causes the 404 error
        // Let React Router and the parent component handle navigation
      } catch (err) {
        console.error("Error in review submission:", err);
        setError(err.message || "Failed to submit review. Please try again.");
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      setError('An unexpected error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => handleRatingChange(i)}
          style={{
            cursor: 'pointer',
            color: i <= (hoverRating || formData.rating) ? '#FFD700' : '#D1D5DB',
            fontSize: '1.75rem',
            marginRight: '0.25rem'
          }}
        >
          ★
        </span>
      );
    }
    return (
      <div className="flex items-center">
        <div className="flex">{stars}</div>
        <span className="ml-2">{(hoverRating || formData.rating)}/5</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Write a Review</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {currentUser && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <span>Logged in as: {currentUser.email || currentUser.displayName || 'User'}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="departure_city" className="block text-sm font-medium text-gray-700 mb-1">
              Departure City
            </label>
            <input
              type="text"
              id="departure_city"
              name="departure_city"
              value={formData.departure_city}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., New York"
            />
          </div>
          
          <div>
            <label htmlFor="arrival_city" className="block text-sm font-medium text-gray-700 mb-1">
              Arrival City
            </label>
            <input
              type="text"
              id="arrival_city"
              name="arrival_city"
              value={formData.arrival_city}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., London"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="heading" className="block text-sm font-medium text-gray-700 mb-1">
            Review Title
          </label>
          <input
            type="text"
            id="heading"
            name="heading"
            value={formData.heading}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Summarize your experience"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Review Details
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your experience with this airline..."
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          {renderStars()}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add Image
          </label>
          
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 p-4 rounded-md text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <label className="cursor-pointer bg-blue-50 px-4 py-2 rounded border border-blue-300 hover:bg-blue-100">
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">Maximum file size: 2MB. Images will be resized automatically.</p>
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-center">
              <div style={{ 
                width: '150px', 
                height: '100px', 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem'
              }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remove image
              </button>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 mr-2"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`bg-blue-500 text-white py-2 px-4 rounded ${
              submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
            } flex items-center justify-center`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ReviewForm; 