import { inTest } from '@n8n/backend-common';
import { createContext, Script } from 'vm';

const context = createContext({ require });
export const loadClassInIsolation = <T>(filePath: string, className: string) => {
	const loadDirectly = () => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		return new (require(filePath)[className])() as T;
	};

	if (process.platform === 'win32') {
		filePath = filePath.replace(/\\/g, '/');
	}

	// Note: Skip the isolation because it breaks nock mocks in tests
	if (inTest) {
		return loadDirectly();
	} else {
		const script = new Script(`new (require('${filePath}').${className})()`);

		try {
			return script.runInContext(context) as T;
		} catch (error) {
			if (error instanceof TypeError) {
				return loadDirectly();
			}

			throw error;
		}
	}
};
