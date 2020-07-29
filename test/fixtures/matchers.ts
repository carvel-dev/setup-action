import { Matcher } from 'jest-mock-extended';
import { equals } from 'expect/build/jasmineUtils';

export const isEqual = <T>(expectedValue?: T) =>
  new Matcher<T | undefined>((actualValue?: T) => {
    return equals(actualValue, expectedValue);
  });
