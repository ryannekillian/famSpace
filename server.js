const express = require('express');
const fileUpload = require('express-fileupload');
const routes = require('./controllers');
const sequelize = require('./config/connection');
const path = require('path'); // Make style sheet available to the client.
const exphbs = require('express-handlebars');
const session = require('express-session');
const helpers = require('./utils/helpers');
var cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3001;
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const hbs = exphbs.create({ helpers });
const sess = {
  secret: 'yoursecretstring',
  cookie: {
    maxAge: 7200000 // 2 hours
  },
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: sequelize
  })
};
// enable files upload
app.use(
  fileUpload({
    createParentPath: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // The express.static() method is a built-in Express.js middleware function that can take all of the contents of a folder and serve them as static assets. This is useful for front-end specific files like images, style sheets, and JavaScript files.
app.use(express.static('views/uploads'));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(session(sess));


// turn on routes
app.use(routes);

// turn on connection to db and server
// force: true adds a DROP TABLE IF EXISTS before trying to create the table.
// If you force, existing tables will be overwritten.
// This allows the table to be overwritten and re-created.
// TURN BACK TO FALSE FOR PRODUCTION
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log('Now listening'));
});