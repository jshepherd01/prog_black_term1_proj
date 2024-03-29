module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'es2021': true,
        'node': true
    },
    'extends': 'eslint:recommended',
    'parserOptions': {
        'ecmaVersion': 12
    },
    'rules': {
        'indent': [
            'error',
			4,
			{'SwitchCase': 1}
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
			'always',
			{'omitLastInOneLineBlock': true}
		],
		'no-unused-vars': [
			'error',
			{
				'caughtErrors': 'none',
				'argsIgnorePattern': '^e(?:rr)?$'
			}
		]
    }
};
