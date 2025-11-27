module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  extends: ['react-app', 'plugin:compat/recommended'],
  plugins: ['compat'],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'no-throw-literal': 'off'
  },
  settings: {
    react: {
      version: '18.0'
    }
  }
};
