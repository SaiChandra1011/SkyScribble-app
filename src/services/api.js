import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getAirlines = async () => {
  try {
    const response = await axios.get(`${API_URL}/airlines`);
    return response.data;
  } catch (error) {
    console.error('Error fetching airlines:', error);
    throw error;
  }
};

export const getAirlineDetails = async (airlineId) => {
  try {
    const response = await axios.get(`${API_URL}/airlines/${airlineId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching airline details:', error);
    throw error;
  }
};

export const getReviewDetails = async (reviewId) => {
  try {
    const response = await axios.get(`${API_URL}/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching review details:', error);
    throw error;
  }
};

export const createOrGetUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users`, userData);
    return response.data;
  } catch (error) {
    console.error('Error creating/getting user:', error);
    throw error;
  }
};

export const createReview = async (reviewData) => {
  try {
    const response = await axios.post(`${API_URL}/reviews`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}; 