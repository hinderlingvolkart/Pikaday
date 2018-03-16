import {h} from "preact"

export function renderTag(attr) {
    var tag = attr.tag || 'span'
    var content = attr.content || null
    delete attr.tag;
    delete attr.content;
    return h(tag, attr, content);
}


export function areDatesEqual(a, b) {
    return a && b && a.toDateString && b.toDateString && a.toDateString() === b.toDateString();
}


export var requestAnimationFrame = function(cb) {
    if (window.requestAnimationFrame) {
        return window.requestAnimationFrame(cb);
    } else {
        return setTimeout(cb, 1);
    }
}

export var cancelAnimationFrame = function(id) {
    if (window.requestAnimationFrame) {
        return window.cancelAnimationFrame(id);
    } else {
        return clearTimeout(id);
    }
}

export var addEvent = function(el, e, callback, capture)
{
    if (hasEventListeners) {
        el.addEventListener(e, callback, !!capture);
    } else {
        el.attachEvent('on' + e, callback);
    }
}

export var removeEvent = function(el, e, callback, capture)
{
    if (hasEventListeners) {
        el.removeEventListener(e, callback, !!capture);
    } else {
        el.detachEvent('on' + e, callback);
    }
}

export var fireEvent = function(el, eventName, data)
{
    var ev;

    if (document.createEvent) {
        ev = document.createEvent('HTMLEvents');
        ev.initEvent(eventName, true, false);
        ev = extend(ev, data);
        el.dispatchEvent(ev);
    } else if (document.createEventObject) {
        ev = document.createEventObject();
        ev = extend(ev, data);
        el.fireEvent('on' + eventName, ev);
    }
}

export var trim = function(str)
{
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g,'');
}

export var hasClass = function(el, cn)
{
    return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
}

export var addClass = function(el, cn)
{
    if (!hasClass(el, cn)) {
        el.className = (el.className === '') ? cn : el.className + ' ' + cn;
    }
}

export var removeClass = function(el, cn)
{
    el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
}

export var isArray = function(obj)
{
    return (/Array/).test(Object.prototype.toString.call(obj));
}

export var isDate = function(obj)
{
    return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
}

export var isWeekend = function(date)
{
    var day = date.getDay();
    return day === 0 || day === 6;
}

export var isLeapYear = function(year)
{
    // solution by Matti Virkkunen: http://stackoverflow.com/a/4881951
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}

export var getDaysInMonth = function(year, month)
{
    return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
}

export var setToStartOfDay = function(date)
{
    if (isDate(date)) date.setHours(0,0,0,0);
}


export var toISODateString = function(date) {
    var y = date.getFullYear(), m = String(date.getMonth() + 1), d = String(date.getDate());
    return y + '-' + (m.length == 1 ? '0' : '') + m + '-' + (d.length == 1 ? '0' : '') + d;
}

export var extend = function(to, from, overwrite)
{
    var prop, hasProp;
    for (prop in from) {
        hasProp = to[prop] !== undefined;
        if (hasProp && typeof from[prop] === 'object' && from[prop] !== null && from[prop].nodeName === undefined) {
            if (isDate(from[prop])) {
                if (overwrite) {
                    to[prop] = new Date(from[prop].getTime());
                }
            }
            else if (isArray(from[prop])) {
                if (overwrite) {
                    to[prop] = from[prop].slice(0);
                }
            } else {
                to[prop] = extend({}, from[prop], overwrite);
            }
        } else if (overwrite || !hasProp) {
            to[prop] = from[prop];
        }
    }
    return to;
}

export var adjustCalendar = function(calendar) {
    if (calendar.month < 0) {
        calendar.year -= Math.ceil(Math.abs(calendar.month)/12);
        calendar.month += 12;
    }
    if (calendar.month > 11) {
        calendar.year += Math.floor(Math.abs(calendar.month)/12);
        calendar.month -= 12;
    }
    return calendar;
}


export var containsElement = function(container, element) {
    while (element) {
        if (container === element) {
            return true;
        }
        element = element.parentNode;
    }
    return false;
}