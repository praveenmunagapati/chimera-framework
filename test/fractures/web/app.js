const chimera = require('chimera-framework')
const path = require('path')
const port = 3010
const webConfig = {
  'routes': [
    {
      'route': '/hello-string',
      'method': 'all',
      'chain': path.join(__dirname, 'chains/hello-string.chiml')
    },
    {
      'route': '/hello-pug',
      'method': 'all',
      'chain': path.join(__dirname, 'chains/hello-pug.chiml')
    },
    {
      'route': '/hello-ejs',
      'method': 'all',
      'chain': path.join(__dirname, 'chains/hello-ejs.chiml')
    },
    {
      'route': '/hello-json',
      'method': 'all',
      'chain': path.join(__dirname, 'chains/hello-json.chiml')
    },
  ],
  'staticPath': path.join(__dirname,  'public'),
  'faviconPath': path.join(__dirname, 'public/favicon.ico'),
  'viewPath': path.join(__dirname, 'views'),
  'errorTemplate': path.join(__dirname, 'views/error.pug')
}

let app = chimera.web.createApp(webConfig)

app.listen(port, function () {
  console.error('Start at port ' + port)
})
