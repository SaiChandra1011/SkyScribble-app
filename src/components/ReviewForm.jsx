import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { createReview } from '../services/api';

const ReviewForm = ({ airlineId, userId, onSuccess }) => {
  const [formData, setFormData] = useState({
    departure_city: '',
    arrival_city: '',
    rating: 5,
    heading: '',
    description: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create a new FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        // Create an image object
        const img = new Image();
        img.onload = () => {
          // Create a canvas element
          const canvas = document.createElement('canvas');
          
          // Set maximum dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw the image on the canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to Blob
          canvas.toBlob((blob) => {
            // Create a new File object
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            // Set the resized image as the selected image
            setSelectedImage(resizedFile);
            setImagePreview(URL.createObjectURL(resizedFile));
          }, 'image/jpeg', 0.8); // 0.8 quality (80%)
        };
        img.src = e.target.result;
      };
      
      // Read the file as Data URL
      reader.readAsDataURL(file);
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError('You must be logged in to submit a review');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // Create a FormData object for the file upload
      const formDataToSend = new FormData();
      formDataToSend.append('user_id', userId);
      formDataToSend.append('airline_id', airlineId);
      formDataToSend.append('departure_city', formData.departure_city);
      formDataToSend.append('arrival_city', formData.arrival_city);
      formDataToSend.append('rating', formData.rating);
      formDataToSend.append('heading', formData.heading);
      formDataToSend.append('description', formData.description);
      
      // Add image file if selected
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }
      
      console.log("Submitting review data with image");
      
      const newReview = await createReview(formDataToSend);
      console.log("Review created successfully:", newReview);
      
      setLoading(false);
      setSuccess(true);
      
      // Reset form
      setFormData({
        departure_city: '',
        arrival_city: '',
        rating: 5,
        heading: '',
        description: '',
        image_url: ''
      });
      setSelectedImage(null);
      setImagePreview(null);
      
      // Notify parent component of success
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(newReview);
        }, 1500); // Show success message briefly before hiding the form
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setLoading(false);
      setError('Failed to submit review. Please try again.');
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none px-1 py-1"
            aria-label={`Rate ${star} out of 5 stars`}
          >
            <span className={`text-3xl transition-colors duration-150 ${
              (hoverRating || formData.rating) >= star 
                ? 'text-yellow-400' 
                : 'text-gray-300'
            }`}>
              ★
            </span>
          </button>
        ))}
        <span className="ml-3 text-base font-medium text-gray-700 flex items-center">
          {hoverRating || formData.rating}/5
        </span>
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

      {success && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">
          Your review was submitted successfully!
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
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                Choose Image
              </button>
              <p className="text-xs text-gray-500 mt-2">Maximum file size: 2MB. Images will be resized automatically.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          ) : (
            <div className="mt-3">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-32 w-auto object-cover rounded-md border border-gray-300" 
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Remove image
              </button>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ReviewForm; 