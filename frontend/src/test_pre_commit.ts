/**
 * A simple test file to test our pre-commit hooks.
 */

export function testFunction(): string {
  return 'This is a test function to verify pre-commit hooks work.'
}

// This line has a trailing space
// This line has no trailing space

// Using _variable prefix to indicate intentionally unused variable
const _testVariable = {
  key1: 'value1',
  key2: 'value2',
}

if (require.main === module) {
  const result = testFunction()
  console.log(result)
}
