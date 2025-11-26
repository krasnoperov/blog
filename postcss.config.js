export default {
  plugins: {
    'postcss-preset-env': {
      stage: 2,
      features: {
        'oklab-function': true,
        'color-function': true,
      },
    },
    '@csstools/postcss-light-dark-function': {},
  },
};
