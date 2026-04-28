import { describe, expect, it } from 'vitest';

import { executeUserOperation } from '../nodes/Redmine/UserExecute';
import { createExecuteContext, getLastRequest } from './helpers';

const baseParams = {
	baseUrl: 'https://redmine.example.com',
	apiKey: 'secret-key',
	i: 2,
};

describe('executeUserOperation', () => {
	it('gets a user with memberships and groups includes', async () => {
		const responseData = { user: { id: 20 } };
		const { context, requestMock } = createExecuteContext(
			{
				userId: '20',
				options: {},
			},
			responseData,
		);

		const result = await executeUserOperation.call(context, {
			...baseParams,
			operation: 'get',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'GET',
			uri: 'https://redmine.example.com/users/20.json',
			qs: { include: 'memberships,groups' },
			json: true,
		});
		expect(request).not.toHaveProperty('body');
		expect(result).toEqual({ json: responseData, pairedItem: { item: 2 } });
	});

	it('gets the current user with memberships and groups includes', async () => {
		const { context, requestMock } = createExecuteContext({
			options: {},
		});

		await executeUserOperation.call(context, {
			...baseParams,
			operation: 'getCurrent',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'GET',
			uri: 'https://redmine.example.com/users/current.json',
			qs: { include: 'memberships,groups' },
		});
		expect(request).not.toHaveProperty('body');
	});

	it('gets many users with filters and limit', async () => {
		const { context, requestMock } = createExecuteContext({
			returnAll: false,
			filters: {
				group_id: '5',
				name: 'Alice',
				status: '1',
			},
			limit: 30,
			options: { impersonateUser: 'admin' },
		});

		await executeUserOperation.call(context, {
			...baseParams,
			operation: 'getAll',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'GET',
			uri: 'https://redmine.example.com/users.json',
			qs: {
				group_id: '5',
				name: 'Alice',
				status: '1',
				limit: 30,
			},
			headers: {
				'X-Redmine-API-Key': 'secret-key',
				'X-Redmine-Switch-User': 'admin',
				'Content-Type': 'application/json',
			},
			json: true,
		});
		expect(request).not.toHaveProperty('body');
	});

	it('creates a user with credentials, preferences, booleans, and custom fields', async () => {
		const { context, requestMock } = createExecuteContext({
			login: 'alice',
			firstname: 'Alice',
			lastname: 'Example',
			mail: 'alice@example.com',
			password: 'change-me',
			additionalFields: {
				admin: false,
				auth_source_id: '2',
				mail_notification: 'only_my_events',
				must_change_passwd: true,
				status: '1',
				customFields: {
					field: [{ id: '12', value: 'support' }],
				},
			},
			options: {},
		});

		await executeUserOperation.call(context, {
			...baseParams,
			operation: 'create',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'POST',
			uri: 'https://redmine.example.com/users.json',
			body: {
				user: {
					login: 'alice',
					firstname: 'Alice',
					lastname: 'Example',
					mail: 'alice@example.com',
					password: 'change-me',
					admin: false,
					auth_source_id: '2',
					mail_notification: 'only_my_events',
					must_change_passwd: true,
					status: '1',
					custom_fields: [{ id: '12', value: 'support' }],
				},
			},
		});
	});

	it('updates a user with partial fields and explicit booleans', async () => {
		const { context, requestMock } = createExecuteContext({
			userId: '20',
			additionalFields: {
				admin: false,
				auth_source_id: '2',
				mail_notification: 'none',
				must_change_passwd: false,
				status: '3',
				customFields: {
					field: [{ id: '12', value: 'locked' }],
				},
			},
			options: {},
		});

		await executeUserOperation.call(context, {
			...baseParams,
			operation: 'update',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'PUT',
			uri: 'https://redmine.example.com/users/20.json',
			body: {
				user: {
					admin: false,
					auth_source_id: '2',
					mail_notification: 'none',
					must_change_passwd: false,
					status: '3',
					custom_fields: [{ id: '12', value: 'locked' }],
				},
			},
		});
	});

	it('deletes a user without sending a body', async () => {
		const { context, requestMock } = createExecuteContext({
			userId: '20',
			options: {},
		});

		await executeUserOperation.call(context, {
			...baseParams,
			operation: 'delete',
		});
		const request = getLastRequest(requestMock);

		expect(request).toMatchObject({
			method: 'DELETE',
			uri: 'https://redmine.example.com/users/20.json',
			json: true,
		});
		expect(request).not.toHaveProperty('body');
	});

	it.todo('paginates all matching user results when returnAll is true');
});
