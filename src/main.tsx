import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ReviewFrame from './components/ReviewFrame';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReviewFrame>
      <App />
    </ReviewFrame>
  </React.StrictMode>
);
