(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('preact')) :
	typeof define === 'function' && define.amd ? define(['preact'], factory) :
	(global.Pikaday = factory(global.preact));
}(this, (function (preact) { 'use strict';

function renderTag(attr) {
    var tag = attr.tag || 'span';
    var content = attr.content || null;
    delete attr.tag;
    delete attr.content;
    return preact.h(tag, attr, content);
}


function areDatesEqual(a, b) {
    return a && b && a.toDateString && b.toDateString && a.toDateString() === b.toDateString();
}

var adjustCalendar = function(calendar) {
    if (calendar.month < 0) {
        calendar.year -= Math.ceil(Math.abs(calendar.month)/12);
        calendar.month += 12;
    }
    if (calendar.month > 11) {
        calendar.year += Math.floor(Math.abs(calendar.month)/12);
        calendar.month -= 12;
    }
    return calendar;
};

var Month = (function (Component) {
    function Month () {
        Component.apply(this, arguments);
    }

    if ( Component ) Month.__proto__ = Component;
    Month.prototype = Object.create( Component && Component.prototype );
    Month.prototype.constructor = Month;

    Month.prototype.render = function render (ref, state) {
        var language = ref.language;
        var startRange = ref.startRange;
        var endRange = ref.endRange;
        var selected = ref.selected;
        var year = ref.year;
        var month = ref.month;
        var firstWeekday = ref.firstWeekday;

        if (!language) {
            language = 'en-us';
        }
        if (!firstWeekday) {
            firstWeekday = 0;
        }
        
        var currentDate = new Date(year, month, 1);
        
        var rows = [];
        var dif = (currentDate.getDay() - firstWeekday + 7) % 7;
        var week = new Date(currentDate);
        week.setDate(week.getDate() - dif);
        
        var now = new Date();
        
        var header = renderDays(week);
        
        do {
            rows.push(renderWeek(week));
            week.setDate(week.getDate() + 7);
        } while (week.getMonth() === currentDate.getMonth());
        
        function getDateState(day) {
            var flags = {
                today: areDatesEqual(day, now),
                selected: areDatesEqual(day, selected),
                outsideMonth: day.getMonth() !== currentDate.getMonth(),
                startRange: areDatesEqual(day, startRange),
                endRange: areDatesEqual(day, endRange)
            };
            if (startRange && endRange && !flags.startRange && !flags.endRange && endRange > day && startRange < day) {
                flags.withinRange = true;
            }
            return flags;
        }
        
        function renderWeek(date) {
            var cells = [], day = new Date(date);
            for (var i = 1; i <= 7; i++) {
                var classes = ['pika-button'];
                var state = getDateState(day);
                for (var key in state) {
                    if (state[key]) {
                        classes.push('is-' + key);
                    }
                }
                var dayView = {
                    "tag": "button",
                    "content": day.getDate(),
                    "type": "button",
                    "tabindex": state.selected ? "0" : "-1",
                    "class": classes.join(' '),
                    "aria-label": day.toLocaleDateString(language, {year: 'numeric', month: 'short', day: 'numeric', weekday: 'long'})
                };
                cells.push(preact.h( 'td', null, renderTag(dayView) ));
                day.setDate(day.getDate() + 1);
            }
            return preact.h( 'tr', null, cells );
        }
        
        function renderDays(date) {
            var cells = [], day = new Date(date);
            for (var i = 1; i <= 7; i++) {
                cells.push(
                    preact.h( 'th', { 'aria-label': day.toLocaleDateString(language, {weekday: 'long'}) }, day.toLocaleDateString(language, {weekday: 'short'}))
                );
                day.setDate(day.getDate() + 1);
            }
            return preact.h( 'tr', { 'aria-hidden': "true" }, cells);
        }
        
        return (
            preact.h( 'table', { class: "calendar" },
                preact.h( 'caption', null, currentDate.toLocaleDateString(language, {year: 'numeric', month: 'long'}) ),
                preact.h( 'thead', null, header ),
                preact.h( 'tbody', null, rows )
            )
        )

    };

    return Month;
}(preact.Component));

var Calendar = (function (Component) {
    function Calendar () {
        Component.apply(this, arguments);
    }

    if ( Component ) Calendar.__proto__ = Component;
    Calendar.prototype = Object.create( Component && Component.prototype );
    Calendar.prototype.constructor = Calendar;

    Calendar.prototype.render = function render (props, state) {
        
        var months = [];
        for (var i = 0; i < (props.count || 1); i++) {
            var table = Object.assign({}, props);
            table.month += i;
            adjustCalendar(table);
            months.push(preact.h( Month, table));
        }
        
        return (
            preact.h( 'div', null, months )
        )

    };

    return Calendar;
}(preact.Component));

function Pikaday(options) {
    var options = options || {};
    var targetEl = options.container || document.createElement('div');
    
    preact.render((
        preact.h( 'div', { class: "pikaday" },
            preact.h( Calendar, { year: 2018, month: 1, selected: new Date(2018,3,6), count: "3", language: "de-ch", firstWeekday: 1 })
        )
    ), targetEl);
}

return Pikaday;

})));
