import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL;

async function request(path: string, options: RequestInit = {}) {
	const token = useAuthStore.getState().token;

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...options.headers,
	};

	const res = await fetch(`${API_URL}${path}`, { ...options, headers });

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error || `Request failed: ${res.status}`);
	}

	if (res.status === 204) return null;
	return res.json();
}

export const api = {
	register: (email: string, password: string) =>
		request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),

	login: (email: string, password: string) =>
		request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

	getWatchlists: () => request('/api/watchlists'),

	createWatchlist: (name?: string) =>
		request('/api/watchlists', { method: 'POST', body: JSON.stringify({ name }) }),

	addWatchlistItem: (watchlistId: number, symbol: string) =>
		request(`/api/watchlists/${watchlistId}/items`, { method: 'POST', body: JSON.stringify({ symbol }) }),

	removeWatchlistItem: (watchlistId: number, symbol: string) =>
		request(`/api/watchlists/${watchlistId}/items/${symbol}`, { method: 'DELETE' }),

	getLatestPrice: (symbol: string) => request(`/api/prices/${symbol}/latest`),

	getPriceHistory: (symbol: string, limit = 100) =>
		request(`/api/prices/${symbol}/history?limit=${limit}`),

	getWatchlistItems: (watchlistId: number) =>
		request(`/api/watchlists/${watchlistId}/items`),
};
