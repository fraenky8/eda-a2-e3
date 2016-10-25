var util = require('util');
var EventEmitter = require("events").EventEmitter;
var rg = require('./RandomGenerator');
var debug = require('debug')('e3:publisher');

var Publisher = function Publisher(exchange)
{
    EventEmitter.call(this);

    var intervallID = null;
    var self = this;

    this.publish = function publish()
    {
        debug('Publischer (' + exchange.name + ') started');

        intervallID = setInterval(function ()
        {
            debug('Publischer (' + exchange.name + '): updatedStocks');

            self.emit('updatedStocks', rg.getStockQuotes(exchange.stocks));

        }, exchange.intervallInSeconds * 1000);
    };

    this.stop = function stop()
    {
        debug('Publischer (' + exchange.name + ') stopped');

        clearInterval(intervallID);
    };
};

util.inherits(Publisher, EventEmitter);

module.exports = Publisher;