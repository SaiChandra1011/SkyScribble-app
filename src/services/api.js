import axios from 'axios';

// Use environment variable for API URL or default to localhost
console.log('Environment variables available:', Object.keys(import.meta.env));
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log(`Using API URL: ${API_URL} (from env: ${!!import.meta.env.VITE_API_URL})`);

// Create an axios instance with the API_URL as the base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable cookies for cross-origin requests
});

// In development, show detailed request information
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`.replace(/\/+/g, '/').replace(':/', '://');
    console.log(`🔄 API Request: ${config.method.toUpperCase()} ${fullUrl}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => {
    // Simply return the successful response
    return response;
  },
  error => {
    // Simple error logging
    if (error.response) {
      console.error(`API Error (${error.response.status}):`, error.response.data);
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('API Error:', error.message);
    }
    
    // Pass the error through
    return Promise.reject(error);
  }
);

export const getAirlines = async () => {
  try {
    const response = await api.get('/airlines');
    return response.data;
  } catch (error) {
    console.error('Error fetching airlines:', error);
    throw error;
  }
};

export const getAirlineDetails = async (airlineId) => {
  try {
    const response = await api.get(`/airlines/${airlineId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching airline details:', error);
    throw error;
  }
};

export const getReviewDetails = async (reviewId) => {
  try {
    const response = await api.get(`/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching review details:', error);
    throw error;
  }
};

export const createAirline = async (airlineData) => {
  // Basic validation
  if (!airlineData || !airlineData.name) {
    throw new Error('Airline name is required');
  }
  
  // Simple, direct API call
  try {
    const response = await api.post('/airlines', {
      name: airlineData.name.trim()
    });
    
    // Ensure we have all required properties
    const airline = {
      ...response.data,
      average_rating: response.data.average_rating || 0,
      review_count: response.data.review_count || 0
    };
    
    return airline;
  } catch (error) {
    // Simple error handling
    console.error('Error creating airline:', error.message);
    throw error;
  }
};

export const createOrGetUser = async (userData) => {
  console.log('API: Creating/getting user with data:', userData);
  try {
    const response = await api.post('/users', userData);
    console.log('API: User successfully created/retrieved from database:', response.data);
    return response.data;
  } catch (error) {
    console.error('API: Error creating/getting user:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const createReview = async (reviewData) => {
  try {
    console.log("Submitting review data");
    
    // Use the already configured api instance with axios instead of fetch
    // We need a special config for FormData
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    // Create a simplified object to log (FormData isn't easily loggable)
    const formDataEntries = {};
    for (let [key, value] of reviewData.entries()) {
      // Don't log the actual file contents, just note that it exists
      formDataEntries[key] = key === 'image' ? 'File data present' : value;
    }
    console.log("Form data entries:", formDataEntries);
    
    // Make the API request using axios instead of fetch
    const response = await api.post('/reviews', reviewData, config);
    
    console.log("Review submission successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("API Error in createReview:", error);
    
    // Rethrow with a more user-friendly message
    throw new Error("Failed to submit review. Please try again.");
  }
};

export const updateReview = async (reviewId, reviewData) => {
  try {
    console.log('API: Updating review:', reviewId, reviewData);
    
    // Check if reviewData is FormData (for image uploads)
    const isFormData = reviewData instanceof FormData;
    
    // Configure headers based on data type
    const config = isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    } : {};
    
    console.log('API: Updating review with', isFormData ? 'file upload' : 'regular data');
    
    const response = await api.put(`/reviews/${reviewId}`, reviewData, config);
    return response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    
    // Create a more user-friendly error message
    let message = 'Failed to update review. Please try again.';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 403) {
        message = 'You can only update your own reviews.';
      } else if (error.response.data && error.response.data.error) {
        message = error.response.data.error;
      }
    }
    
    // Throw a new error with the friendly message but include the original error for debugging
    const newError = new Error(message);
    newError.originalError = error;
    throw newError;
  }
};

export const deleteReview = async (reviewId, userId) => {
  try {
    console.log('API: Deleting review:', reviewId, 'by user:', userId);
    const response = await api.delete(`/reviews/${reviewId}?user_id=${userId}`);
    console.log('API: Review deleted successfully');
    return response.data;
  } catch (error) {
    console.error('API: Error deleting review:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const checkServerEndpoint = async () => {
  try {
    console.log("Checking API availability at:", API_URL);
    
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      credentials: 'include',
      // Add a short timeout to avoid hanging
      signal: AbortSignal.timeout(2000)
    });
    
    if (!response.ok) {
      console.error('API health check failed:', response.status);
      return {
        available: false,
        status: response.status,
        message: response.statusText
      };
    }
    
    return {
      available: true,
      status: response.status
    };
  } catch (error) {
    console.error('API health check error:', error);
    return {
      available: false,
      error: error.message
    };
  }
}; 