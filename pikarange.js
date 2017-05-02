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




    /**
     * Pikarange constructor
     */
    Pikarange = function(options)
    {
        var self = this;
        var startField = options.start;
        var endField = options.end;

        var pickerOptions = {};
        for (var i in options) {
            pickerOptions[i] = options[i];
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
            } else {
                addClass(picker.el, 'is-end');
                removeClass(picker.el, 'is-start');
            }
        }

        extendCallbacks(pickerOptions, {
            onSelect: function() {
                if (isStart()) {
                    picker.setStartRange(picker._d);
                    if (this._o.startRange && this._o.endRange && (this._o.endRange - this._o.startRange) < 0) {
                        picker.setEndRange(addToDate(this._o.startRange, this._o.minRange || 0));
                    }
                } else {
                    picker.setEndRange(picker._d);
                     if (this._o.startRange && this._o.endRange && (this._o.endRange - this._o.startRange) < 0) {
                        picker.setStartRange(addToDate(this._o.endRange, this._o.minRange || 0));
                    }
                }
            },
            onClose: function(cancelled) {
                if (!cancelled) {
                    if (endField && !options.trigger && isStart()) {
                        endField.focus();
                    } else {
                        isEditingStart = !isEditingStart;
                        setField(isEditingStart ? startField : endField);
                        if (!isEditingStart) {
                            this.show();
                        }
                    }
                }
            },
            onOpen: function() {
            },
            onInit: function() {
                var picker = this;
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
            }
        });

        var picker = new Pikaday(pickerOptions);

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


        this._handleOver = function(event) {
            var targetEl = event.currentTarget;
            var date = new Date(targetEl.getAttribute('data-pika-year'), targetEl.getAttribute('data-pika-month'), targetEl.getAttribute('data-pika-day'));
            clearTimeout(picker.delay);
            if (isStart()) {
                picker.setStartRange(date);
            } else {
                picker.setEndRange(date);
            }
        }

        this._handleOut = function(event) {
            clearTimeout(picker.delay);
            picker.delay = setTimeout(function() {
                picker.setStartRange(picker._o.startRange);
                picker.setEndRange(picker._o.endRange);
            }, 200);
        }
        if (window.jQuery) {
            jQuery(picker.el).on('mouseenter', '.pika-button', this._handleOver);
            jQuery(picker.el).on('mouseleave', '.pika-button', this._handleOut);
        }

        return picker;
    };





    return Pikarange;

}));
