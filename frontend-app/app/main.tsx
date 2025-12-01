import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import './app.css';

// Import pages
import Welcome from './welcome/welcome';
import Login from './login/login';
import Register from './register/register';
import Test from './test/test';
import Chat from './chat/chat';
import ProtectedRoute from './routes/protected';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        toastOptions={{
          style: {
            background: 'red',
            border: '0px',
          },
          classNames: {
            description: '!text-white',
            title: '!text-white',
            icon: '!text-white'
          }
        }}
        duration={2000}
      />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/test" element={<Test />} />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
