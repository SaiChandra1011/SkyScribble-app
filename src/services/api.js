import axios from 'axios';

// First, try to connect to the default port, but if it fails, try other ports
const findApiUrl = async () => {
  const defaultPort = 5000;
  const portsToTry = [defaultPort, 5001, 5002, 5003, 5004, 5005];
  
  for (const port of portsToTry) {
    try {
      const url = `http://localhost:${port}/api`;
      // Check if the server is available on this port
      console.log(`Trying API on port ${port}...`);
      const response = await axios.get(`${url}/health`, { timeout: 1500 });
      if (response.status === 200) {
        console.log(`API server found on port ${port}`);
        return url;
      }
    } catch (error) {
      console.log(`API not available on port ${port}: ${error.message}`);
    }
  }
  
  // Default to the standard port if we can't find the server
  console.warn('Could not find API server, defaulting to port 5000');
  return 'http://localhost:5000/api';
};

// Initialize with default URL, then try to find the actual API URL
let API_URL = 'http://localhost:5000/api';

// Update the API URL and refresh the API instance
const updateApiUrl = async () => {
  try {
    const url = await findApiUrl();
    API_URL = url;
    console.log('Using API URL:', API_URL);
    
    // Update the baseURL of the existing API instance
    api.defaults.baseURL = API_URL;
  } catch (error) {
    console.error('Error finding API URL:', error);
  }
};

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

// Start the API discovery process
updateApiUrl();

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
    // Check if reviewData is FormData (for image uploads)
    const isFormData = reviewData instanceof FormData;
    
    // Configure headers based on data type
    const config = isFormData ? {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    } : {};
    
    console.log('API: Creating review with', isFormData ? 'file upload' : 'regular data');
    
    const response = await api.post('/reviews', reviewData, config);
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
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