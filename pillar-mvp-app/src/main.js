import './style.css';
import { base } from './basePath.js';

// Fix the CTA link so it works whether served at root or under a subpath (/beta/).
const ctaBtn = document.querySelector('a.home-cta-btn');
if (ctaBtn) ctaBtn.href = base + 'client.html';
