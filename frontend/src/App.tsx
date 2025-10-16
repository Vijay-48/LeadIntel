import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { HeroGeometric } from './components/ui/shape-landing-hero';
import { Dashboard } from './components/Dashboard';

function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <HeroGeometric
      badge="LeadIntel"
      title1="Unlock Intelligent"
      title2="Lead Data Instantly"
      subtitle="Discover and enrich company data with real-time insights. Access comprehensive contact information, funding details, and industry intelligence—all in one powerful platform."
      onGetStarted={handleGetStarted}
    />
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
