import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HeroLanding } from './components/HeroLanding';
import { NewDashboard } from './components/NewDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HeroLanding />} />
        <Route path="/dashboard" element={<NewDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
