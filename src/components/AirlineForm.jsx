import { useState } from 'react';
import { motion } from 'framer-motion';
import { createAirline } from '../services/api';

const AirlineForm = ({ onSuccess, onCancel }) => {
  const [airlineName, setAirlineName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!airlineName.trim()) {
      setError('Airline name cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Creating new airline:", { name: airlineName });
      const newAirline = await createAirline({ name: airlineName });
      
      console.log("New airline created:", newAirline);
      setLoading(false);
      setAirlineName(''); // Clear form after successful submission
      
      if (onSuccess) {
        onSuccess(newAirline);
      }
    } catch (err) {
      console.error("Error creating airline:", err);
      setLoading(false);
      
      // Handle various error scenarios
      if (err.response) {
        // The server responded with an error status code
        if (err.response.status === 409 || (err.response.data && err.response.data.code === '23505')) {
          setError('An airline with this name already exists');
        } else if (err.response.data && err.response.data.error) {
          // Use the error message from the server if available
          setError(`Failed to create airline: ${err.response.data.error}`);
        } else {
          setError('Failed to create airline. Please try again.');
        }
      } else if (err.request) {
        // The request was made but no response was received (network error)
        setError('Network error. Please check your connection and try again.');
        
        // Increment retry count for network errors
        setRetryCount(prev => prev + 1);
        if (retryCount < 2) {
          // Auto-retry for network errors
          setTimeout(() => {
            setError('Retrying connection...');
            handleSubmit(e);
          }, 2000);
        }
      } else {
        // Something else happened while setting up the request
        setError('Failed to create airline. Please try again.');
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-6 mb-6"
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add New Airline</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
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
            value={airlineName}
            onChange={(e) => {
              setAirlineName(e.target.value);
              if (error) setError(null); // Clear error when user types
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter airline name"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            {loading ? 'Creating...' : 'Create Airline'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AirlineForm; 