import { useState } from 'react';
import { createAirline } from '../services/api';

// Simplified form with no animations to prevent blinking
const AirlineForm = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate name
    if (!name.trim()) {
      setErrorMsg('Airline name is required');
      return;
    }
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    
    try {
      setErrorMsg('');
      setIsSubmitting(true);
      
      // Call API
      const newAirline = await createAirline({ name: name.trim() });
      
      // Handle success
      setName(''); // Reset form
      
      // Notify parent of success
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(newAirline);
      }
    } catch (error) {
      console.error('Failed to create airline:', error);
      
      // Handle specific error cases
      if (error.response && error.response.status === 409) {
        setErrorMsg('An airline with this name already exists');
      } else {
        setErrorMsg('Could not create airline. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Simple form with no fancy animations
  return (
    <div className="bg-white p-4 rounded shadow-md mb-4 border border-gray-200">
      <h3 className="text-xl font-bold mb-3">Add New Airline</h3>
      
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3">
          {errorMsg}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-gray-700 font-medium mb-2">
            Airline Name:
          </label>
          <input
            type="text" 
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="Enter airline name"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-600 text-white rounded ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Airline'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AirlineForm; 