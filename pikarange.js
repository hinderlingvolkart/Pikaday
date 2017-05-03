/*!
 * Pikarange
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


    var hasEventListeners = !!window.addEventListener,

    document = window.document,

    sto = window.setTimeout,

    addEvent = function(el, e, callback, capture)
    {
        if (hasEventListeners) {
            el.addEventListener(e, callback, !!capture);
        } else {
            el.attachEvent('on' + e, callback);
        }
    },

    removeEvent = function(el, e, callback, capture)
    {
        if (hasEventListeners) {
            el.removeEventListener(e, callback, !!capture);
        } else {
            el.detachEvent('on' + e, callback);
        }
    },

    trim = function(str)
    {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g,'');
    },

    hasClass = function(el, cn)
    {
        return (' ' + el.className + ' ').indexOf(' ' + cn + ' ') !== -1;
    },

    addClass = function(el, cn)
    {
        if (!hasClass(el, cn)) {
            el.className = (el.className === '') ? cn : el.className + ' ' + cn;
        }
    },

    removeClass = function(el, cn)
    {
        el.className = trim((' ' + el.className + ' ').replace(' ' + cn + ' ', ' '));
    },

    addToDate = function(date, diff) {
        return new Date(date.getTime() + diff);
    },

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

        pickerOptions = extend({}, options, endOptions, {autoInit: false});
        var endPicker = new Pikaday(pickerOptions);

        function setStartRange(d) {
            startPicker.setStartRange(d);
            endPicker.setStartRange(d);

            if (!(d instanceof Date) || !d.getTime()) {
                return;
            }
            var minEndDate = options.minDate;
            var time;
            if (typeof endPicker._o.minRange !== 'undefined') {
                time = d.getTime() + daysToTime(endPicker._o.minRange);
                if (!minEndDate || minEndDate < time) {
                    minEndDate = new Date(time);
                }
            }
            var maxEndDate = options.maxDate;
            if (typeof endPicker._o.maxRange !== 'undefined') {
                time = d.getTime() + daysToTime(endPicker._o.maxRange);
                if (!maxEndDate || maxEndDate > time) {
                    maxEndDate = new Date(time);
                }
            }
            endPicker.setMinDate(minEndDate);
            endPicker.setMaxDate(maxEndDate);
        }

        function setEndRange(d) {
            startPicker.setEndRange(d);
            endPicker.setEndRange(d);
        }



        startPicker.on('select', function() {
            setStartRange(this._d);
            delete this.originalRange;
            (endPicker._o.trigger || endPicker._o.field).focus();
        });
        endPicker.on('select', function() {
            setEndRange(this._d);
            delete this.originalRange;
        });

        startPicker.on('destroy', function() {
            removeEvent(startPicker.el, 'mouseover', handleStartOver);
            removeEvent(endPicker.el, 'mouseover', handleEndOver);

            endPicker.destroy();
        });

        startPicker.on('init', function() {
            endPicker.init();

            addEvent(startPicker.el, 'mouseover', handleStartOver);
            addEvent(endPicker.el, 'mouseover', handleEndOver);
        });

        var handleStartOver = getPickerOver(startPicker);
        var handleEndOver = getPickerOver(endPicker);

        function getPickerOver(picker) {
            return function handlePickerOver(event) {
                if (!hasClass(event.target, 'pika-button')) {
                    if (!picker.outDelay && picker.originalRange) {
                        picker.outDelay = setTimeout(function() {
                            setStartRange(picker.originalRange[0]);
                            setEndRange(picker.originalRange[1]);
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
                    setStartRange(date);
                } else {
                    setEndRange(date);
                }
            }
        }



        if (options.autoInit !== false) {
            startPicker.init();
        }




        return this.startPicker;
    };





    return Pikarange;

}));
