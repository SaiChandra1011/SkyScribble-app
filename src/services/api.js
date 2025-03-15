import axios from 'axios';

 new-main
// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('Using fixed API URL:', API_URL);

// Create an axios instance with the API_URL as the base URL
const api = axios.create({

// Define API URL with a fallback
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for consistent usage
export const api = axios.create({
 new-main-branch
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Log the API URL for debugging
console.log('API URL configured as:', API_URL);

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
  console.log('API: getAirlines called');
  console.log('API URL being used:', API_URL);
  
  try {
    // Add a small delay to ensure database connection is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Making GET request to:', `${API_URL}/airlines`);
    const response = await api.get('/airlines', {
      // Add timeout
      timeout: 5000,
      // Retry request once if it fails
      retry: 1,
      retryDelay: 1000
    });
    
    console.log('API: getAirlines response status:', response.status);
    
    // Ensure we have data
    if (!response.data) {
      console.warn('API: Empty response data');
      return [];
    }
    
    // Log the first few airlines
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('API: Sample airlines:', response.data.slice(0, 2));
      console.log(`API: Total airlines: ${response.data.length}`);
    } else {
      console.log('API: No airlines in response data');
    }
    
    // Always return an array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('API: Error fetching airlines:', error.message);
    
    if (error.response) {
      console.error('API: Response status:', error.response.status);
      console.error('API: Response data:', error.response.data);
    } else if (error.request) {
      console.error('API: No response received');
    }
    
    // Return empty array instead of throwing to avoid showing error screen
    return [];
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

export const getReviews = async (airlineId) => {
  try {
    const response = await api.get(`/airlines/${airlineId}/reviews`);
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
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

// Completely simplify the createAirline function for maximum reliability
export const createAirline = async (airlineData) => {
  try {
    console.log('Creating airline with data:', airlineData);
    console.log('Using API URL:', API_URL);
    
    // Ensure we have a name
    if (!airlineData.name || typeof airlineData.name !== 'string') {
      throw new Error('Airline name is required');
    }
    
    // Use the api instance instead of axios directly to ensure baseURL is used
    const response = await api.post('/airlines', airlineData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Create airline response:', response.data);
    
    // Ensure we have the required fields
    const newAirline = {
      id: response.data.id,
      name: response.data.name,
      average_rating: response.data.average_rating || 0,
      review_count: response.data.review_count || 0
    };
    
    return newAirline;
  } catch (error) {
    console.error('Error creating airline:', error);
    
    // Provide helpful error message based on error type
    if (error.response) {
      // Server responded with an error status
      const { status, data } = error.response;
      console.error('Server error response:', { status, data });
      
      if (status === 409) {
        throw new Error('An airline with this name already exists');
      } else if (status === 404) {
        throw new Error('The API endpoint was not found. Please check server configuration.');
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        throw new Error(`Server error: ${status}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - no response received');
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      // Something else happened
      console.error('Other error:', error.message);
      throw new Error(error.message || 'An unexpected error occurred');
    }
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
    const response = await api.post('/reviews', reviewData);
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

export const deleteReview = async (reviewId, userId) => {
  try {
    console.log('Deleting review with ID:', reviewId, 'User ID:', userId);
    
    if (!reviewId) {
      throw new Error('Review ID is required');
    }
    
    if (!userId) {
      throw new Error('User ID is required to delete a review');
    }
    
    // Pass user_id as a query parameter
    const response = await api.delete(`/reviews/${reviewId}`, {
      params: { user_id: userId }
    });
    
    console.log('Delete review response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting review:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
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