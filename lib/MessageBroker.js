var Publisher = require('./Publisher');
var ExchangeA = require('./ExchangeA');
var ExchangeB = require('./ExchangeB');
var _ = require('underscore');
var debug = require('debug')('e3:messagebroker');

module.exports = function (io)
{
    var ExchangeDontCare = 'Exchange *';
    var ExchangeAName = ExchangeA.name;
    var ExchangeBName = ExchangeB.name;

    // http://stackoverflow.com/a/5834436
    var operators = {
        '=': function (a, b)
        {
            return a == b
        },
        '<': function (a, b)
        {
            return a < b
        },
        '>': function (a, b)
        {
            return a > b
        }
    };

    var start = function start()
    {
        debug('Message Broker started!');

        // Publisher starten
        var publisherA = new Publisher(ExchangeA);
        publisherA.publish();

        var publisherB = new Publisher(ExchangeB);
        publisherB.publish();

        publisherA.on('updatedStocks', function (data)
        {
            notifyClients(ExchangeAName, data);
        });

        publisherB.on('updatedStocks', function (data)
        {
            notifyClients(ExchangeBName, data);
        });

        // Socket IO starten
        io.on('connection', function (client)
        {
            handleNewClient(client);

            client.on('disconnect', function ()
            {
                removeClient(client);
            });

            client.on('subscribe', function (data)
            {
                subscribe(client, data);
            });

            client.on('unsubscribe', function (data)
            {
                unsubscribe(client, data);
            });
        });

    };

    var handleNewClient = function handleNewClient(client)
    {
        debug('Client "' + client.id + '" connected');

        // Client initialisieren
        // die subscriptions direkt an das IO Objekt dranhängen
        client['subscriptions'] = {};
        client['subscriptions'][ExchangeDontCare] = [];
        client['subscriptions'][ExchangeAName] = [];
        client['subscriptions'][ExchangeBName] = [];
    };

    var removeClient = function removeClient(client)
    {
        debug('Client "' + client.id + '" disconnected');
    };

    var subscribe = function subscribe(client, subscriptions)
    {
        debug('Client "' + client.id + '" subscribed:');
        debugObject(subscriptions);

        /* subscriptions
         [
            { exchange: 'Exchange A', stock: 'APC', op: '>', quote: '118' },
            ...
         ]
         */

        // die neue Subscription direkt in den Client unter das entsprechende Objekt einsortieren
        for (var i = 0; i < subscriptions.length; i++)
        {
            client['subscriptions'][subscriptions[i].exchange].push(subscriptions[i]);
        }

        debug('Client subscriptions:');
        debugObject(client['subscriptions']);
    };

    var unsubscribe = function unsubscribe(client, oldSubscription)
    {
        debug('Client "' + client.id + '" unsubscribed:');
        debugObject(oldSubscription);

        for (var i = 0; i < client['subscriptions'][oldSubscription.exchange].length; i++)
        {
            if (_.isEqual(client['subscriptions'][oldSubscription.exchange][i], oldSubscription))
            {
                client['subscriptions'][oldSubscription.exchange].splice(i, 1);
                break;
            }
        }

        debug('Client subscriptions:');
        debugObject(client['subscriptions']);
    };

    var notifyClients = function notifyClients(exchange, notifications)
    {
        /* notifications
         [
             {
                 name: 'APC',
                 quote: 116.99
             },
             {
                 name: 'MSF',
                 quote: 53.85
             }
         ]
         */

        /* subscriptions

            "Exchange A": [
                {
                    "exchange": "Exchange A",
                    "stock": "APC",
                    "op": ">",
                    "quote": "120"
                },
                ...
            ],

         */

        var clients = io.sockets.sockets;
        var i, n, s, notification, subscription;

        // BRUTEFORCE!

        for (i = 0; i < clients.length; i++)
        {
            var client = clients[i];
            var subscriptions = client['subscriptions'];

            debugObject(subscriptions);
            debugObject(subscriptions[exchange]);

            for (n = 0; n < notifications.length; n++)
            {
                notification = notifications[n];
                notification['exchange'] = exchange;

                var ExchangeDontCareLength = subscriptions[ExchangeDontCare].length;

                if (ExchangeDontCareLength > 0)
                {
                    for (s = 0; s < ExchangeDontCareLength; s++)
                    {
                        subscription = subscriptions[ExchangeDontCare][s];

                        if (subscription.stock == '*' && subscription.op == '*')
                        {
                            if(subscription.hasOwnProperty('master'))
                            {
                                client.emit('masterUpdatedStocks', notification);
                                continue;
                            }

                            client.emit('updatedStocks', notification);
                            continue;
                        }

                        if (subscription.stock == '*' && operators[subscription.op](notification.quote, subscription.quote))
                        {
                            client.emit('updatedStocks', notification);
                        }
                    }
                }

                for (s = 0; s < subscriptions[exchange].length; s++)
                {
                    subscription = subscriptions[exchange][s];

                    if (subscription.stock == '*' && subscription.op == '*')
                    {
                        client.emit('updatedStocks', notification);
                        continue;
                    }

                    if (subscription.stock != notification.name)
                    {
                        continue;
                    }

                    if (subscription.op == '*')
                    {
                        client.emit('updatedStocks', notification);
                        continue;
                    }

                    if (operators[subscription.op](notification.quote, subscription.quote))
                    {
                        client.emit('updatedStocks', notification);
                    }
                }
            }
        }
    };

    var debugObject = function debugObject(obj)
    {
        debug(JSON.stringify(obj, null, 4));
    };

    return {
        start: start
    }
};