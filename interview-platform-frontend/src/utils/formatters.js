/**
 * Unified Formatting Utilities for InterviewHub
 * Handles international currency display (USD $, INR ₹, EUR €, etc.)
 * with authentic local numbering formats (Indian Lakhs/Crores vs US Thousands).
 */

export function getCurrencySymbol(currency = 'USD') {
  if (!currency) return '$';
  const c = String(currency).trim().toUpperCase();
  if (c === 'INR' || c === '₹' || c === 'RS' || c === 'RUPEE' || c === 'RUPEES') return '₹';
  if (c === 'USD' || c === '$') return '$';
  if (c === 'EUR' || c === '€') return '€';
  if (c === 'GBP' || c === '£') return '£';
  return currency;
}

export function formatCompensation(amount, currency = 'USD') {
  if (amount === undefined || amount === null || amount === '' || isNaN(Number(amount))) {
    return '';
  }
  const num = Number(amount);
  
  const c = String(currency || 'USD').trim().toUpperCase();
  const isINR = c === 'INR' || c === '₹' || c === 'RS' || c === 'RUPEE' || c === 'RUPEES';
  const symbol = getCurrencySymbol(currency);

  if (isINR) {
    // Format using Indian numbering system (e.g. ₹48,00,000)
    return `${symbol}${num.toLocaleString('en-IN')}`;
  }
  // Standard US / International format (e.g. $240,000)
  return `${symbol}${num.toLocaleString('en-US')}`;
}

export default {
  getCurrencySymbol,
  formatCompensation,
};
