/*!
 * Pikarange 1.0.10
 *
 * Copyright © 2017 Hinderling Volkart | BSD & MIT license | https://github.com/hinderlingvolkart/PikadayPlus
 */
/* eslint-disable */

(function (root, factory)
{
    'use strict';

    var Pikaday;
    if (typeof exports === 'object') {
        // CommonJS module
        Pikaday = require('pikaday');
        module.exports = factory(Pikaday);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function (req)
        {
            Pikaday = require('pikaday');
            return factory(Pikaday);
        });
    } else {
        root.Pikarange = factory(root.Pikaday);
    }
}(this, function (Pikaday)
{
    'use strict';

    /**
     * feature detection and helper functions
     */

    var util = Pikaday.util,
    document = window.document,
    addEvent = util.addEvent,
    removeEvent = util.removeEvent,
    trim = util.trim,
    hasClass = util.hasClass,
    addClass = util.addClass,
    removeClass = util.removeClass,
    addToDate = util.addToDate,
    isDate = util.isDate,
    containsElement = util.containsElement,

    extendCallback = function(src, dst, name) {
        var origMethod = src[name];
        if (origMethod) {
            src[name] = function() {
                origMethod.apply(this, arguments);
                dst[name].apply(this, arguments);
            }
        } else {
            src[name] = dst[name];
        }
    },
    extendCallbacks = function(orig, overwrite) {
        for (var method in overwrite) {
            extendCallback(orig, overwrite, method);
        }
        return orig;
    },

    daysToTime = function(days) {
        return days * 24 * 3600000
    },

    extend = function(out) {
        out = out || {};
        for (var o, i = 1; i < arguments.length; i++) {
            o = arguments[i];
            if (!o) continue;
            for (var key in o) {
                if (o.hasOwnProperty(key)) {
                    out[key] = o[key];
                }
            }
        }
        return out;
    },




    /**
     * Pikarange constructor
     */
    Pikarange = function(options)
    {
        var self = this;
        var startOptions = options.start.nodeName ? {field: options.start} : options.start;
        var endOptions = options.end.nodeName ? {field: options.end} : options.end;
        var minEndDate, maxEndDate;
        var pickerOptions;

        delete options.start;
        delete options.end;

        pickerOptions = extend({}, options, startOptions, {autoInit: false});
        var startPicker = new Pikaday(pickerOptions);
        var activePicker = startPicker;

        pickerOptions = extend({}, options, endOptions, {autoInit: false});
        var endPicker = new Pikaday(pickerOptions);


        startPicker.isStart = true;
        startPicker.end = endPicker;
        endPicker.isEnd = true;
        endPicker.start = startPicker;

        function setStartRange(d, temporary) {
            startPicker.setStartRange(d);
            endPicker.setStartRange(d);

            if (!(d instanceof Date) || !d.getTime()) {
                return;
            }
            if (temporary) {
                return;
            }
            var minEndDate = options.minDate;
            var time;
            if (typeof endPicker._o.minRange !== 'undefined') {
                time = d.getTime() + daysToTime(endPicker._o.minRange);
                if (!isDate(minEndDate) || minEndDate < time) {
                    minEndDate = new Date(time);
                }
            }
            var maxEndDate = options.maxDate;
            if (typeof endPicker._o.maxRange !== 'undefined') {
                time = d.getTime() + daysToTime(endPicker._o.maxRange);
                if (!isDate(maxEndDate) || maxEndDate > time) {
                    maxEndDate = new Date(time);
                }
            }
            endPicker.setMinDate(minEndDate);
            endPicker.setMaxDate(maxEndDate);
            if (endPicker._d && (endPicker._d < minEndDate || endPicker._d > maxEndDate)) {
                endPicker.setDate(null);
                endPicker.gotoDate(d);
            }
            syncCalendar(startPicker, endPicker, endPicker._d || startPicker._d);
        }

        function setEndRange(d) {
            startPicker.setEndRange(d);
            endPicker.setEndRange(d);
        }



        startPicker.on('change', function() {
            delete this.originalRange;
            setStartRange(this._d);
            if (!options.preventSync || !endPicker.isValid()) {
                endPicker.setDate(null);
                syncCalendar(startPicker, endPicker, startPicker._d);
            }
        });
        startPicker.on('select', function() {
            if (endPicker._o.bound) {
                (endPicker._o.trigger || endPicker._o.field).focus();
            } else {
                endPicker.focusPicker(true);
            }
        });
        endPicker.on('change', function() {
            delete this.originalRange;
            setEndRange(this._d);
        });
        endPicker.on('select', function() {
            if (!startPicker._o.bound) {
                startPicker.focusPicker(true);
            }
        });

        function syncCalendar(source, target, targetDate) {
            target.calendars = [{
                month: source.calendars[0].month,
                year: source.calendars[0].year
            }];
            target.adjustCalendars();
            if (targetDate) {
                target.gotoDate(targetDate);
            }
        }

        function handleFocus(event) {
            var a, b;
            if (containsElement(startPicker.el, event.target)) {
                a = startPicker;
                b = endPicker;
            } else
            if (containsElement(endPicker.el, event.target)) {
                a = endPicker;
                b = startPicker;
            }
            if (a && a !== activePicker) {
                activePicker = a;
                syncCalendar(b, a, a._d);
                addClass(a.el, 'is-focused');
                removeClass(b.el, 'is-focused');
            }
        }
        addEvent(document, 'focusin', handleFocus);

        startPicker.on('close', function() { delete this.originalRange; });
        endPicker.on('close', function() { delete this.originalRange; });

        startPicker.on('destroy', function() {
            removeEvent(startPicker.el, 'mouseover', handleStartOver);
            removeEvent(endPicker.el, 'mouseover', handleEndOver);
            endPicker.destroy();
            removeEvent(document, 'focusin', handleFocus);
        });

        endPicker.on('init', function() {
            startPicker.init();
        });
        startPicker.on('init', function() {
            // both have initialised
            setStartRange(startPicker._d);
            setEndRange(endPicker._d);
            addEvent(startPicker.el, 'mouseover', handleStartOver);
            addEvent(endPicker.el, 'mouseover', handleEndOver);
            addClass(startPicker.el, 'is-focused');
            addClass(startPicker.el, 'is-start pika-range');
            addClass(endPicker.el, 'is-end pika-range');
        });

        var handleStartOver = getPickerOver(startPicker);
        var handleEndOver = getPickerOver(endPicker);

        function getPickerOver(picker) {
            return function handlePickerOver(event) {
                if (options.hideRangeWhenSelected && startPicker._d && endPicker._d) {
                    return; // only show "live range" when no range is set
                }
                if (!hasClass(event.target, 'pika-button')) {
                    if (!picker.outDelay && picker.originalRange) {
                        picker.outDelay = setTimeout(function() {
                            setStartRange(picker.originalRange[0], true);
                            setEndRange(picker.originalRange[1], true);
                            delete picker.originalRange;
                            delete picker.outDelay;
                        }, 200);
                    }
                    return;
                }
                clearTimeout(picker.outDelay);
                delete picker.outDelay;

                if (typeof picker.originalRange === 'undefined') {
                    picker.originalRange = [picker._o.startRange, picker._o.endRange];
                }
                var targetEl = event.target;
                console.log(targetEl.getAttribute('data-pika-day'));
                var date = new Date(targetEl.getAttribute('data-pika-year'), targetEl.getAttribute('data-pika-month'), targetEl.getAttribute('data-pika-day'));
                if (picker === startPicker) {
                    setStartRange(date, true);
                } else {
                    setEndRange(date, true);
                }
            }
        }



        if (options.autoInit !== false) {
            endPicker.init();
        }




        return this.startPicker;
    };





    return Pikarange;

}));
