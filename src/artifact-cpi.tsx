import React from 'react';
import ReactDOM from 'react-dom/client';
import ClientPreviewInvoice from './components/ClientPreviewInvoice';
import './index.css';

/**
 * artifact-cpi — standalone entry that mounts the current "Invoice"
 * screen (Details / Client preview tabs) on its own, for publishing as a
 * shareable page outside the prototype's nav.
 *
 * See artifact-cpi-old.tsx for the pre-redesign counterpart. Neither carries
 * the TopNav or the Review pill: an artifact is a snapshot of one screen, so
 * the contract and change-order comparison switches are not part of it.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClientPreviewInvoice />
  </React.StrictMode>
);
