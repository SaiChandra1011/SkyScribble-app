import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Airlines from './pages/Airlines';
import AirlineDetails from './pages/AirlineDetails';
import ReviewDetails from './pages/ReviewDetails';

// AnimatePresence requires the location from useLocation()
// This needs to be in a component that has access to the router context
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/airlines" element={<Airlines />} />
        <Route path="/airlines/:id" element={<AirlineDetails />} />
        <Route path="/reviews/:id" element={<ReviewDetails />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
