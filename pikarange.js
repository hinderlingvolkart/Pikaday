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


    /**
     * Pikarange constructor
     */
    Pikarange = function(originalOptions)
    {
        var self = this;
        var startField = originalOptions.start;
        var endField = originalOptions.end;
        var minEndDate, maxEndDate;

        var pickerOptions = {};
        for (var i in originalOptions) {
            pickerOptions[i] = originalOptions[i];
        }


        delete pickerOptions.start;
        delete pickerOptions.end;

        pickerOptions.field = startField;

        var isEditingStart = true;

        function isStart() {
            return isEditingStart;
        }

        function setField(field) {
            var pickerOptions = picker._o;
            if (pickerOptions.field !== field) {
                pickerOptions.field = field;
                pickerOptions.trigger = field;
                if (typeof pickerOptions.onFieldChange === 'function') {
                    pickerOptions.onFieldChange.call(picker);
                }
            }
            isEditingStart = field == startField;
            if (isEditingStart) {
                addClass(picker.el, 'is-start');
                removeClass(picker.el, 'is-end');
                picker.setMinDate(originalOptions.minDate);
                picker.setMaxDate(originalOptions.maxDate);
            } else {
                addClass(picker.el, 'is-end');
                removeClass(picker.el, 'is-start');
                if (minEndDate) {
                    picker.setMinDate(minEndDate);
                }
                if (maxEndDate) {
                    picker.setMaxDate(maxEndDate);
                }
            }
        }


        var hasAutoInit = pickerOptions.autoInit;
        pickerOptions.autoInit = false;

        var picker = new Pikaday(pickerOptions);

        picker.on('startrange', function(value) {
            if (!(value instanceof Date)) {
                return;
            }
            minEndDate = originalOptions.minDate;
            var time;
            if (typeof pickerOptions.minRange !== 'undefined') {
                time = this._o.startRange.getTime() + daysToTime(pickerOptions.minRange);
                if (!minEndDate || minEndDate < time) {
                    minEndDate = new Date(time);
                }
            }
            maxEndDate = originalOptions.maxDate;
            if (typeof pickerOptions.maxRange !== 'undefined') {
                time = this._o.startRange.getTime() + daysToTime(pickerOptions.maxRange);
                if (!maxEndDate || maxEndDate > time) {
                    maxEndDate = new Date(time);
                }
            }
        });

        picker.on('select', function() {
            if (isStart()) {
                picker.setStartRange(picker._d);
            } else {
                picker.setEndRange(picker._d);
            }
        });

        picker.on('close', function(cancelled) {
            if (!cancelled) {
                if (endField && !originalOptions.trigger && isStart()) {
                    endField.focus();
                } else {
                    isEditingStart = !isEditingStart;
                    setField(isEditingStart ? startField : endField);
                    if (!isEditingStart) {
                        this.show();
                    }
                }
            }
        });

        picker.on('open', function() {
        });

        if (picker._o.field === picker._o.trigger) {
            var superOnInputFocus = picker._onInputFocus;
            picker._onInputFocus = function(event)
            {
                setField(event.target);

                superOnInputFocus.call(this, event);
                picker._onInputChange(event);
            };
        }

        var superDestroy = picker.destroy;
        picker.destroy = function()
        {
            if (startField) {
                setField(startField);
            }
            if (endField) {
                removeEvent(endField, 'change', picker._onInputChange);
            }
            if (endField && picker._o.bound) {
                removeEvent(endField, 'click', picker._onInputClick);
                removeEvent(endField, 'focus', picker._onInputFocus);
                removeEvent(endField, 'blur', picker._onInputBlur);
                removeEvent(endField, 'keydown', picker._onKeyChange);
            }
            superDestroy.call(this);
        };




        picker.on('init', function() {
            picker.el.className += ' pika-range';

            if (endField) {
                addEvent(endField, 'change', picker._onInputChange);
            }
            if (endField && picker._o.bound && picker._o.field == picker._o.trigger) {
                addEvent(endField, 'click', picker._onInputClick);
                addEvent(endField, 'focus', picker._onInputFocus);
                addEvent(endField, 'blur', picker._onInputBlur);
                addEvent(endField, 'keydown', picker._onKeyChange);
            }

            if (window.jQuery) {
                jQuery(picker.el).on('mouseenter', '.pika-button', handlePickerOver);
                jQuery(picker.el).on('mouseleave', '.pika-button', handlePickerOut);
            }
        });



        function handlePickerOver(event) {
            var targetEl = event.currentTarget;
            var date = new Date(targetEl.getAttribute('data-pika-year'), targetEl.getAttribute('data-pika-month'), targetEl.getAttribute('data-pika-day'));
            clearTimeout(picker.delay);
            if (isStart()) {
                picker.setStartRange(date);
            } else {
                picker.setEndRange(date);
            }
        }

        function handlePickerOut(event) {
            clearTimeout(picker.delay);
            picker.delay = setTimeout(function() {
                picker.setStartRange(picker._o.startRange);
                picker.setEndRange(picker._o.endRange);
            }, 200);
        }




        if (hasAutoInit !== false) {
            picker.init();
        }




        return picker;
    };





    return Pikarange;

}));
