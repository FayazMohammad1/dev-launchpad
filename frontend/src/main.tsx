import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('=== Application Starting ===');
console.log('crossOriginIsolated:', window.crossOriginIsolated);
console.log('isSecureContext:', window.isSecureContext);
console.log('location:', window.location.href);

if (!window.crossOriginIsolated) {
    console.error('❌ CRITICAL: Cross-Origin Isolation is NOT enabled!');
    console.error('WebContainer will NOT work without proper headers.');
    console.error('Expected headers:');
    console.error('  Cross-Origin-Embedder-Policy: require-corp');
    console.error('  Cross-Origin-Opener-Policy: same-origin');
} else {
    console.log('✅ Cross-Origin Isolation is enabled');
}

createRoot(document.getElementById('root')!).render(
    <App />
);
