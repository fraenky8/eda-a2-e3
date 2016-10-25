var socket;

$(function ()
{
    console.log("ready!");

    socket = io();

    ExchangesManager(jQuery, socket, window, document).init();

    $('.panel-heading').on('click', function ()
    {
        $(this).next().slideToggle();
    });

});

var ExchangesManager = function ($, io, window, document, undefined)
{
    var $exchanges = $('#exchanges');
    var $stocks = $('#stocks-quotes');

    var $filterDiv = $('#filter');

    var $subsribeBtn = $('#subscribe-btn');
    var $unsubsribeBtn = $('#cancel-subscription-btn');
    var $resetFilterBtn = $('#reset-filter-btn');
    var $clearNotificationsBtn = $('#clear-notifications-btn');

    var $clientSubscriptionsInformation = $('#client-subscriptions');
    var $clientNotificationsInformation = $('#client-notifications');

    var operators = ['*', '=', '>', '<'];

    // exchangesStocksMapping kommt vom Server

    var init = function init()
    {
        fillExchangesSelect();

        $exchanges.on('change', exchangesChangeHandler);

        $stocks.on('change', stocksChangeHandler);

        $subsribeBtn.on('click', subscribe);

        $unsubsribeBtn.on('click', unsubscribe);

        $clearNotificationsBtn.on('click', clearNotifications);

        $resetFilterBtn.on('click', resetFilter);

        io.on('connect', function ()
        {
            console.log("connected");

            io.emit('subscribe', [{
                master: true,
                exchange: "Exchange *",
                stock: "*",
                op: "*",
                quote: "*"
            }]);

            io.on('updatedStocks', function (notification)
            {
                handleNotification(notification);
            });

            io.on('masterUpdatedStocks', function (notification)
            {
                updateStocksSelect(notification);
            });
        });
    };

    var fillExchangesSelect = function fillExchangesSelect()
    {
        console.log('populate Exchanges');

        $('<option/>').val('*').text('*').appendTo($exchanges);
        $.each(exchangesStocksMapping, function (exchange, stocks)
        {
            $('<option/>').val(exchange).text(exchange).appendTo($exchanges);
        });
    };

    var exchangesChangeHandler = function exchangesChangeHandler()
    {
        $stocks.empty();

        var $selectedExchanges = $exchanges.find('option:selected');

        var dontCareId = 'Exchange * *';
        if ($selectedExchanges.length == 1)
        {
            if ($selectedExchanges.val() == '*')
            {
                $selectedExchanges = $exchanges.find('option:not([value="*"])');
                dontCareId = 'Exchange * *';
            }
            else
            {
                dontCareId = $($selectedExchanges[0]).val() + ' *';
            }
        }

        $('<option/>').val('*').text('*').data('id', dontCareId).appendTo($stocks);

        $selectedExchanges.each(function ()
        {
            var $currentExchange = $(this).val();

            var optgroup = $('<optgroup>');
            optgroup.attr('label', $currentExchange);

            $.each(exchangesStocksMapping[$currentExchange], function (k, stock)
            {
                var option = $('<option></option>');
                option.val(stock.quote);
                option.text(stock.name + ' (' + stock.quote + ')');

                option.data('id', $currentExchange + ' ' + stock.name);

                optgroup.append(option);
            });

            $stocks.append(optgroup);
        });
    };

    var stocksChangeHandler = function stocksChangeHandler()
    {
        $filterDiv.empty();

        var $selectedQuotes = $stocks.find('option:selected');

        $selectedQuotes.each(function ()
        {
            var $data = $(this).data();
            var $inputGroup = createFilterInputGroup($data['id'], $(this).val());
            $filterDiv.append($inputGroup);
        });
    };

    var createFilterInputGroup = function createFilterInputGroup(id, value)
    {
        var $filterSelect = $('<select>');
        $filterSelect.addClass('form-control');

        for (var operator in operators)
        {
            if (operators.hasOwnProperty(operator))
            {
                $filterSelect.append($('<option/>').html(operators[operator]));
            }
        }

        var $inputGroup = $('<div>');
        $inputGroup.attr('id', id);
        $inputGroup.addClass('input-group');

        var $span = $('<span>');
        $span.addClass('input-group-addon');
        $span.html(id + ' - Quotes');

        var $textInput = $('<input>');
        $textInput.attr('type', 'text');
        $textInput.addClass('form-control quote');
        $textInput.val(value);

        var $pseudoSpan = $('<span>');
        $pseudoSpan.addClass('input-group-btn');
        $pseudoSpan.css('width', '0');

        $inputGroup.append($span, $filterSelect, $pseudoSpan, $textInput);

        return $inputGroup;
    };

    var subscribe = function subscribe()
    {
        var subscriptions = buildSubcriptionsFromFilter();
        updateInformationClientSelect(subscriptions);
        io.emit('subscribe', subscriptions);

        console.log('subscribed');
        console.log(subscriptions);
    };

    var buildSubcriptionsFromFilter = function buildSubcriptionsFromFilter()
    {
        var $filters = $filterDiv.find('div');
        var subscriptions = [];

        $.each($filters, function (k, filter)
        {
            var $filter = $(filter);
            var splittedId = $filter.attr('id').split(' ');

            var exhange = splittedId[0] + ' ' + splittedId[1];
            var stock = splittedId[2];

            var filterOperation = $($filter.find('option:selected')[0]).val();
            var quote = $filter.find('input.quote').val();

            $filter.removeClass('has-error');
            if (filterOperation != '*' && (quote.length == 0 || isNaN(parseFloat(quote))))
            {
                $filter.addClass('has-error');
                return;
            }

            subscriptions.push(
                {
                    exchange: exhange,
                    stock: stock,
                    op: filterOperation,
                    quote: quote
                }
            );

        });

        return subscriptions;
    };

    var updateInformationClientSelect = function updateInformationClientSelect(subscriptions)
    {
        $.each(subscriptions, function (k, subscription)
        {
            $('<option/>')
                .val(k)
                .text('(Exchange=' + subscription.exchange.split(' ')[1] + ' ∧ Stock=' + subscription.stock + ' ∧ Price' + (subscription.op == '*' ? '=*' : subscription.op + subscription.quote) + ')')
                .data('subscription', subscription)
                .appendTo($clientSubscriptionsInformation);
        });
    };

    var unsubscribe = function unsubscribe()
    {
        var $option = $clientSubscriptionsInformation.find('option:selected');

        if ($option.length == 0) return;

        var $subcription = $option.data('subscription');

        io.emit('unsubscribe', $subcription);
        $option.remove();

        console.log('unsubscribe');
        console.log($subcription);
    };

    var resetFilter = function resetFilter()
    {
        $filterDiv.empty();
        $exchanges.find('option:selected').removeAttr('selected');
        $stocks.find('option:selected').removeAttr('selected');
    };

    var clearNotifications = function clearNotifications()
    {
        $clientNotificationsInformation.empty();
    };

    var handleNotification = function handleNotification(notification)
    {
        console.log('received new notification');

        var $option = $('<option/>').val(notification.quote).text(notification.exchange + ': ' + notification.name + ', ' + notification.quote + '').appendTo($clientNotificationsInformation);
        $clientNotificationsInformation.scrollTop($option.offset().top);
    };

    var updateStocksSelect = function updateStocksSelect(notification)
    {
        var $optgroup = $stocks.find('optgroup[label="' + notification.exchange + '"]');

        if ($optgroup.length == 0)
        {
            return;
        }

        var $options = $optgroup.children();

        $.each($options, function (k, option)
        {
            var $option = $(option);
            if ($option.text().indexOf(notification.name) > -1)
            {
                $option.val(notification.quote).text(notification.name + ' (' + notification.quote + ')');
            }
        });
    };

    return {
        init: init,

    }
};
