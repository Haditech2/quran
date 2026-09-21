import Constants from 'expo-constants';
import { Platform } from 'react-native';

function normalizeBaseUrl(value: string): string {
	return value.replace(/\/$/, '');
}

function getExpoHost(): string | null {
	const hostUri =
		Constants.expoConfig?.hostUri ??
		Constants.manifest?.hostUri ??
		Constants.manifest2?.extra?.expoGo?.debuggerHost ??
		null;

	if (!hostUri) {
		return null;
	}

	return hostUri.split(':')[0] || null;
}

export function getApiBaseUrls(): string[] {
	// Prioritize configured API URL (e.g. live Vercel Flask https://quran-beige-xi.vercel.app), then local Flask (5000)
	const candidates: (string | undefined)[] = [];
	if (process.env.EXPO_PUBLIC_API_BASE_URL) {
		candidates.push(process.env.EXPO_PUBLIC_API_BASE_URL);
	}
	candidates.push('https://quran-beige-xi.vercel.app');

	const host = getExpoHost();
	if (host) {
		candidates.push(`http://${host}:5000`);
		candidates.push(`http://${host}:8000`);
	}
	if (Platform.OS === 'web') {
		candidates.push('http://127.0.0.1:5000');
	}
	if (Platform.OS === 'android' && !host) {
		candidates.push('http://10.0.2.2:5000');
	}
	if (Platform.OS === 'android') {
		candidates.push('http://127.0.0.1:5000');
	}
	candidates.push('https://quran.hadisub.online');

	return Array.from(
		new Set(
			candidates
				.filter((value): value is string => Boolean(value))
				.map((value) => normalizeBaseUrl(value)),
		),
	);
}

export const API_BASE_URL = getApiBaseUrls()[0];
