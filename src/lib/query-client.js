import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchIntervalInBackground: false, // pause all polling when the tab is hidden / app minimized
			retry: 1,
		},
	},
});