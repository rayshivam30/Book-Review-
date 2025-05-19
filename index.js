import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import path from 'path';
import { fileURLToPath } from 'url';
import booksRouter from './routes/books.js';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//view engine setup
app.set("view engine", 'ejs');
app.set("views", path.join(__dirname, 'views'));

//middleware
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,"public")));

app.use(session({
  secret: session.env.SESSION_SECRET, // Replace with strong secret in production
  resave: false,
  saveUninitialized: true
}));
app.use(flash());

// Flash message middleware (after setting up flash and session)
app.use((req, res, next) => {
  const success = req.flash('success_msg');
  const error = req.flash('error_msg');

  res.locals.success_msg = (success && success.length && success[0].trim()) ? success[0] : null;
  res.locals.error_msg = (error && error.length && error[0].trim()) ? error[0] : null;

  next();
});


//router
app.use("/", booksRouter);


//Server
app.listen(port, ()=>{
    console.log(`sever running at ${port}`);
})