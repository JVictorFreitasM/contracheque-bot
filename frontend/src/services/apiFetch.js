// src/services/apiFetch.js
/**
 * Centralized API fetch wrapper used across the frontend.
 * Handles HTTP errors, sets JSON headers, and returns parsed JSON.
 * Returns null on failure and logs the error.
 */
export async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[apiFetch] Erro na requisição:', error);
    return null;
  }
}
