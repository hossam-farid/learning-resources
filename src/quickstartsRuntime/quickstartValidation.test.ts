import { QuickStart } from '@patternfly/quickstarts';
import validateQuickstart from './quickstartValidation';

describe('validateQuickstart', () => {
  it('accepts a key and metadata.name', () => {
    expect(
      validateQuickstart('insights', {
        metadata: { name: 'getting-started' },
      } as unknown as QuickStart)
    ).toBe(true);
  });

  it('throws when key is not a string', () => {
    expect(() =>
      validateQuickstart(
        1 as unknown as string,
        {
          metadata: { name: 'getting-started' },
        } as unknown as QuickStart
      )
    ).toThrow(/key/);
  });

  it('throws when metadata.name is missing', () => {
    expect(() =>
      validateQuickstart('insights', {
        metadata: {},
      } as unknown as QuickStart)
    ).toThrow(/metadata.name/);
  });
});
