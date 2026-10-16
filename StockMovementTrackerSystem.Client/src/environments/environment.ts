export const environment = {
  production: false,
  docker: false,

  auth_url: 'https://localhost:7000/api/auth',
  main_url: 'https://localhost:7000/api',
  web_url: 'https://localhost:7000',

  // auth_url: 'http://127.0.0.1/core/api/auth',
  // main_url: 'http://127.0.0.1/core/api',
  // web_url: 'http://127.0.0.1',

  debug: false,

  default_pagination: [10, 20, 30, 50, 100],

  default_toastKey: "globalMessage"
};
