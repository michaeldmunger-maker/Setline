import expo from 'eslint-config-expo/flat.js';
export default [...expo, { ignores: ['dist-ios/**', 'dist-web/**', '.expo/**'] }];
