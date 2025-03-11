import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAirlines } from '../services/api';
import { getCurrentUser } from '../services/auth';
import AirlineForm from '../components/AirlineForm';

const Airlines = () => {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Load user and airlines data
    const loadData = async () => {
      try {
        // Check for user
        const currentUser = await getCurrentUser().catch(err => {
          console.log('Not logged in:', err.message);
          return null;
        });
        setUser(currentUser);
        
        // Ensure the UI shows loading state for at least a moment
        // This helps prevent flickering
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fetch airlines
        console.log('Fetching airlines data...');
        setError(null);
        
        const airlineData = await getAirlines();
        
        console.log('Airlines data received:', airlineData);
        
        // Set airlines to the fetched data, ensuring we have an array
        if (Array.isArray(airlineData)) {
          setAirlines(airlineData);
        } else {
          console.warn('Expected array of airlines but got:', airlineData);
          // Handle non-array response (might be empty object or error message)
          setAirlines([]);
          if (airlineData && airlineData.error) {
            setError(airlineData.error);
          }
        }
      } catch (err) {
        console.error('Error loading airlines:', err);
        setError(err.message || 'Failed to load airlines. Please try again.');
        // Set empty array to avoid rendering issues
        setAirlines([]);
      } finally {
        // Always set loading to false
        setLoading(false);
      }
    };
    
    loadData();
  }, [refreshTrigger]);

  const handleAddAirlineSuccess = (newAirline) => {
    console.log('New airline created:', newAirline);
    
    // Hide the form
    setShowForm(false);
    
    // Force reload all airlines
    reloadAirlines();
    
    // Show success message
    alert(`Airline "${newAirline.name}" created successfully!`);
  };

  const toggleForm = () => {
    setShowForm(!showForm);
  };

  const renderStars = (rating) => {
    if (rating === undefined || rating === null) {
      rating = 0;
    }
    
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
    
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        // Filled star (golden) for ratings
        stars.push(
          <span 
            key={i} 
            style={{ 
              color: '#FFCC00', // Golden yellow color
              fontSize: '1.2rem',
              margin: '0 1px'
            }}
          >
            ★
          </span>
        );
      } else {
        // Empty star (outlined) for remaining positions
        stars.push(
          <span 
            key={i} 
            style={{ 
              color: '#D1D5DB', // Light gray for outline
              fontSize: '1.2rem',
              margin: '0 1px'
            }}
          >
            ☆
          </span>
        );
      }
    }

    return stars;
  };
  
  // Reload all airlines and force refresh
  const reloadAirlines = () => {
    console.log('Force reloading airlines...');
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Create the main content based on state
  let content;
  
  if (loading) {
    // Show loading spinner
    content = (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  } else if (error) {
    // Show error with retry button
    content = (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={reloadAirlines}
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  } else if (airlines.length === 0) {
    // Show message when no airlines are available
    content = (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">No airlines available. {user ? 'Be the first to add one!' : 'Please sign in to add airlines.'}</p>
      </div>
    );
  } else {
    // Show airlines grid when airlines are available
    content = (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '1.5rem',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {airlines.map((airline) => (
          <Link
            key={airline.id}
            to={`/airlines/${airline.id}`}
            style={{
              display: 'block',
              textDecoration: 'none',
              transition: 'transform 0.3s ease'
            }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              padding: '1.5rem'
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '0.75rem', 
                color: '#3b82f6' 
              }}>
                {airline.name}
              </h2>
              
              {/* Star rating display */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                {renderStars(airline.average_rating)}
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center'
              }}>
                <span style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '500', 
                  color: '#4b5563' 
                }}>
                  {Number(airline.average_rating || 0).toFixed(1)}/5
                </span>
                
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  marginTop: '0.5rem', 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '0.5rem', 
                  width: '100%', 
                  textAlign: 'center' 
                }}>
                  {airline.review_count || 0} {(airline.review_count === 1) ? 'review' : 'reviews'}
                </div>
              </div>
              
              {/* Airline code without label - only show if code exists */}
              {airline.code && (
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  marginTop: '0.75rem',
                  textAlign: 'center'
                }}>
                  {airline.code}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      {/* Centered header elements */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          Airline Reviews
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem', textAlign: 'center' }}>
          Browse or add airlines to review
        </p>
        
        {user && (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {showForm ? (
              <AirlineForm onSuccess={handleAddAirlineSuccess} onCancel={toggleForm} />
            ) : (
              <button
                onClick={toggleForm}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.25rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Add New Airline
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dynamic content based on state */}
      {content}
    </div>
  );
};

export default Airlines; 