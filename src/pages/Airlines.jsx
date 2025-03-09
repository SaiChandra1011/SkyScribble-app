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

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
      }
    };

    checkUser();
    fetchAirlines();
  }, []);

  const fetchAirlines = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAirlines();
      setAirlines(data);
    } catch (error) {
      console.error('Error fetching airlines:', error);
      
      // Only show the error if we've retried a few times
      if (retryCount >= 2) {
        setError('Unable to load airlines. Please try again later.');
      } else {
        // Retry with exponential backoff
        const retryDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, etc.
        setTimeout(() => {
          fetchAirlines(retryCount + 1);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  };

  const retryFetchAirlines = () => {
    fetchAirlines(0);
  };

  const toggleForm = () => {
    console.log('toggleForm called, current state:', { showForm });
    // Use this approach to avoid any race conditions
    setShowForm(prevState => {
      const newState = !prevState;
      console.log('Setting showForm to:', newState);
      return newState;
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={retryFetchAirlines}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleAirlineSuccess = (newAirline) => {
    setAirlines([...airlines, newAirline]);
    setShowForm(false);
  };

  const renderStars = (rating) => {
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
            {!showForm ? (
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
            ) : (
              <div style={{ width: '100%', maxWidth: '500px' }}>
                <AirlineForm 
                  onSuccess={(newAirline) => {
                    // Ensure we have review count and average rating
                    const airlineWithDefaults = {
                      ...newAirline,
                      average_rating: newAirline.average_rating || 0,
                      review_count: newAirline.review_count || 0
                    };
                    handleAirlineSuccess(airlineWithDefaults);
                  }} 
                  onCancel={() => setShowForm(false)} 
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modified airline grid to show exactly 2 boxes per row */}
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
                  {Number(airline.average_rating).toFixed(1)}/5
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
                  {airline.review_count} {airline.review_count === 1 ? 'review' : 'reviews'}
                </div>
              </div>
              
              {/* Airline code without label */}
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280', 
                marginTop: '0.75rem',
                textAlign: 'center'
              }}>
                {airline.code}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Airlines; 