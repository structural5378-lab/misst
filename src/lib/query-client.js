import { QueryClient } from '@tanstack/react-query';
import { startPollingLogger } from '@/lib/pollingLogger';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchIntervalInBackground: false, // pause all polling when the tab is hidden / app minimized
			retry: 1,
		},
	},
});

// Dev-only polling traffic logger (enable: localStorage.setItem('mist_debug_polling','1'))
startPollingLogger(queryClientInstance);