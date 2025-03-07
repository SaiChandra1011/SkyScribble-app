import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import Navbar from './components/Navbar';

// Pages
import Home from './pages/Home';
import Airlines from './pages/Airlines';
import AirlineDetails from './pages/AirlineDetails';
import ReviewDetails from './pages/ReviewDetails';

function App() {
  return (
    <Router>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/airlines" element={<Airlines />} />
          <Route path="/airlines/:id" element={<AirlineDetails />} />
          <Route path="/reviews/:id" element={<ReviewDetails />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
