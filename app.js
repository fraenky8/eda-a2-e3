var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// error handlers
var error404Handler = require('./middlewares/errorhandler/error404');
var devErrorHandler = require('./middlewares/errorhandler/developmentErrorHandler');
var prodErrorHandler = require('./middlewares/errorhandler/productionErrorHandler');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// app config
app.locals.pretty = true;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(error404Handler);

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development')
{
    app.use(devErrorHandler);
}

// production error handler
// no stacktraces leaked to user
app.use(prodErrorHandler);


module.exports = app;
