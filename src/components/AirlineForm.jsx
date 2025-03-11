import React, { useState, useRef, useEffect } from 'react';
import { createAirline } from '../services/api';
import { motion } from 'framer-motion';

const AirlineForm = ({ onSuccess, onCancel }) => {
  // Simple state management
  const [airlineName, setAirlineName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const name = airlineName.trim();
    if (!name) {
      setErrorMessage('Airline name is required');
      return;
    }
    
    // Clear previous error
    setErrorMessage('');
    
    try {
      // Set loading state
      setIsLoading(true);
      
      // Create the airline - simple payload
      console.log('Submitting airline with name:', name);
      console.log('API URL is configured as:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
      
      // Use a simple payload with just the name
      const newAirline = await createAirline({ name });
      
      console.log('Successfully created airline:', newAirline);
      
      // Clear form
      setAirlineName('');
      
      // Call success handler
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(newAirline);
      }
    } catch (error) {
      // Handle error
      console.error('Error creating airline:', error);
      
      // Create a detailed error message for debugging
      let errorDetails = error.message || 'Failed to create airline. Please try again.';
      
      // Show more details in development mode
      if (import.meta.env.MODE === 'development') {
        if (error.response) {
          errorDetails += ` (Status: ${error.response.status})`;
          
          // Log the response data for debugging
          console.error('Error response data:', error.response.data);
        } else if (error.request) {
          errorDetails += ' (No response received from server)';
        }
      }
      
      setErrorMessage(errorDetails);
      
      // Focus the input field for retry
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6 mb-6"
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add New Airline</h2>
      
      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="airlineName" className="block text-sm font-medium text-gray-700 mb-1">
            Airline Name
          </label>
          <input
            type="text"
            id="airlineName"
            ref={inputRef}
            value={airlineName}
            onChange={(e) => {
              setAirlineName(e.target.value);
              if (errorMessage) setErrorMessage(''); // Clear error when user types
            }}
            disabled={isLoading}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter airline name"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isLoading || !airlineName.trim()}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              isLoading || !airlineName.trim() ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            {isLoading ? 'Creating...' : 'Create Airline'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AirlineForm; 