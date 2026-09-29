import React from 'react';
import ReactDOM from 'react-dom/client';
import ClientPreviewInvoiceOld from './components/ClientPreviewInvoiceOld';
import './index.css';

/**
 * artifact-main — standalone entry that mounts the pre-redesign
 * "Invoice (Client preview)" screen on its own, for publishing as a
 * shareable page outside the prototype's nav.
 *
 * No TopNav and no Review pill: the artifact is a snapshot of one screen,
 * so the contract/change-order comparison switches (which live on the pill)
 * are not part of it and it renders the open-book default.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClientPreviewInvoiceOld />
  </React.StrictMode>
);
