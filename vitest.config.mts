import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'n8n-workflow': 'n8n-workflow/dist/index.js',
		},
	},
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
	},
});
