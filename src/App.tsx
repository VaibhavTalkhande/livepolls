import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/AuthProvider';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Index />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;