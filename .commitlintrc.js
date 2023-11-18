module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'qwik-angular',
        'add-angular-to-qwik',
        'repo', // anything related to managing the repo itself
      ],
    ],
    'scope-empty': [2, 'never'],
  },
};
