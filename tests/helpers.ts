import { vi, type Mock } from 'vitest';
import type { IExecuteFunctions, IRequestOptions } from 'n8n-workflow';

type ParameterMap = Record<string, unknown>;

export interface TestContext {
	context: IExecuteFunctions;
	requestMock: Mock<[IRequestOptions], Promise<unknown>>;
}

export function createExecuteContext(
	parameters: ParameterMap,
	responseData: unknown = { ok: true },
): TestContext {
	const requestMock = vi.fn<[IRequestOptions], Promise<unknown>>().mockResolvedValue(responseData);

	const context = {
		getNodeParameter: vi.fn((name: string, _itemIndex: number, defaultValue?: unknown): unknown =>
			Object.prototype.hasOwnProperty.call(parameters, name) ? parameters[name] : defaultValue,
		),
		helpers: {
			request: requestMock,
		},
		getNode: vi.fn(() => ({
			id: 'redmine-node',
			name: 'Redmine',
			type: 'n8n-nodes-redmine.redmine',
			typeVersion: 1,
			position: [0, 0],
			parameters: {},
		})),
	} as unknown as IExecuteFunctions;

	return { context, requestMock };
}

export function getLastRequest(
	requestMock: Mock<[IRequestOptions], Promise<unknown>>,
): IRequestOptions {
	const lastCall = requestMock.mock.calls.at(-1);

	if (!lastCall) {
		throw new Error('Expected Redmine request to have been called');
	}

	return lastCall[0];
}
