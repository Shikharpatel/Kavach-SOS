module.exports = {
  kavach: {
    input: './openapi.yaml',
    output: {
      mode: 'single',
      target: '../api-client-react/src/generated.ts',
      schemas: '../api-zod/src/generated',
      client: 'react-query',
      mock: true,
      override: {
        mutator: {
          path: './mutator.ts',
          name: 'customInstance'
        }
      }
    }
  }
};
