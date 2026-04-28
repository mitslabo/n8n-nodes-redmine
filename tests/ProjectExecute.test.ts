import { describe, expect, it } from 'vitest';

import { executeProjectOperation } from '../nodes/Redmine/ProjectExecute';
import { createExecuteContext, getLastRequest } from './helpers';

const baseParams = {
	baseUrl: 'https://redmine.example.com',
	apiKey: 'secret-key',
	i: 1,
};

describe('executeProjectOperation', () => {
	it('gets a project with the expected includes', async () => {
		const responseData = { project: { id: 10 } };
		const { context, requestMock } = createExecuteContext(
			{
				projectId: '10',
				options: {},
			},
			responseData,
		);

		const result = await executeProjectOperation.call(context, {
			...baseParams,
			operation: 'get',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'GET',
			uri: 'https://redmine.example.com/projects/10.json',
			qs: { include: 'trackers,issue_categories,enabled_modules' },
			headers: {
				'X-Redmine-API-Key': 'secret-key',
				'Content-Type': 'application/json',
			},
			json: true,
		});
		expect(request.headers).not.toHaveProperty('X-Redmine-Switch-User');
		expect(result).toEqual({ json: responseData, pairedItem: { item: 1 } });
	});

	it('gets many projects with status filter and limit', async () => {
		const { context, requestMock } = createExecuteContext({
			returnAll: false,
			filters: { status: 'open' },
			limit: 20,
			options: { impersonateUser: 'alice' },
		});

		await executeProjectOperation.call(context, {
			...baseParams,
			operation: 'getAll',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'GET',
			uri: 'https://redmine.example.com/projects.json',
			qs: { status: 'open', limit: 20 },
			headers: {
				'X-Redmine-Switch-User': 'alice',
			},
			json: true,
		});
		expect(request).not.toHaveProperty('body');
	});

	it('creates a project with custom fields and enabled modules', async () => {
		const { context, requestMock } = createExecuteContext({
			name: 'Project A',
			identifier: 'project-a',
			additionalFields: {
				description: 'Project details',
				homepage: 'https://example.com',
				is_public: false,
				parent_id: '1',
				inherit_members: true,
				customFields: {
					field: [{ id: '12', value: 'internal' }],
				},
				enabledModules: {
					module: [{ name: 'issue_tracking' }, { name: 'time_tracking' }],
				},
			},
			options: {},
		});

		await executeProjectOperation.call(context, {
			...baseParams,
			operation: 'create',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'POST',
			uri: 'https://redmine.example.com/projects.json',
			body: {
				project: {
					name: 'Project A',
					identifier: 'project-a',
					description: 'Project details',
					homepage: 'https://example.com',
					is_public: false,
					parent_id: '1',
					inherit_members: true,
					custom_fields: [{ id: '12', value: 'internal' }],
					enabled_modules: [{ name: 'issue_tracking' }, { name: 'time_tracking' }],
				},
			},
		});
	});

	it('updates a project with partial fields and explicit false booleans', async () => {
		const { context, requestMock } = createExecuteContext({
			projectId: '10',
			additionalFields: {
				description: 'Updated details',
				is_public: false,
				inherit_members: false,
				customFields: {
					field: [{ id: '12', value: 'external' }],
				},
				enabledModules: {
					module: [{ name: 'wiki' }],
				},
			},
			options: {},
		});

		await executeProjectOperation.call(context, {
			...baseParams,
			operation: 'update',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'PUT',
			uri: 'https://redmine.example.com/projects/10.json',
			body: {
				project: {
					description: 'Updated details',
					is_public: false,
					inherit_members: false,
					custom_fields: [{ id: '12', value: 'external' }],
					enabled_modules: [{ name: 'wiki' }],
				},
			},
		});
	});

	it('deletes a project without sending a body', async () => {
		const { context, requestMock } = createExecuteContext({
			projectId: '10',
			options: {},
		});

		await executeProjectOperation.call(context, {
			...baseParams,
			operation: 'delete',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'DELETE',
			uri: 'https://redmine.example.com/projects/10.json',
			json: true,
		});
		expect(request).not.toHaveProperty('body');
	});

	it.todo('paginates all matching project results when returnAll is true');
});
