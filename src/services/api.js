import axios from 'axios';

// Fixed API URL on port 5000 (the default port in server.js)
const API_URL = 'http://localhost:5000/api';
console.log('Using fixed API URL:', API_URL);

// Create axios instance with timeout and default headers
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
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
  console.log('API: Creating airline with data:', airlineData);
  try {
    // Add retry logic for creating airlines
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        const response = await api.post('/airlines', airlineData);
        console.log('API: Airline successfully created:', response.data);
        return response.data;
      } catch (error) {
        lastError = error;
        
        // Only retry on network errors or 500 server errors
        if (!error.response || error.response.status === 500) {
          console.log(`API: Retrying... (${retries} attempts left)`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        } else {
          // For other errors like 400 or 409, don't retry
          throw error;
        }
      }
    }
    
    // If we've exhausted retries, throw the last error
    throw lastError;
  } catch (error) {
    console.error('API: Error creating airline:', 
      error.response ? error.response.data : error.message
    );
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