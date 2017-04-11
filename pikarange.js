/*!
 * Pikarange
 *
 * Copyright © 2016 Hinderling Volkart | BSD & MIT license | https://github.com/hinderlingvolkart/PikadayPlus
 */

(function (root, factory)
{
    'use strict';

    var moment, Pikaday;
    if (typeof exports === 'object') {
        // CommonJS module
        // Load moment.js as an optional dependency
        Pikaday = require('pikaday');
        try { moment = require('moment'); $ = require('jquery'); } catch (e) {}
        module.exports = factory(Pikaday, moment, $);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function (req)
        {
            Pikaday = require('pikaday');
            // Load moment.js as an optional dependency
            try { moment = require('moment'); $ = require('jquery'); } catch (e) {}
            return factory(Pikaday, moment, $);
        });
    } else {
        root.Pikarange = factory(root.Pikaday, root.moment, root.jQuery);
    }
}(this, function (Pikaday, moment, $)
{
    'use strict';

    /**
     * feature detection and helper functions
     */

    var hasMoment = typeof moment === 'function',

    hasEventListeners = !!window.addEventListener,

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
        }

        extendCallbacks(pickerOptions, {
            onSelect: function() {
                if (isStart()) {
                    picker.setStartRange(picker._d);
                } else {
                    picker.setEndRange(picker._d);
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
            var $target = $(event.currentTarget);
            var date = new Date($target.data('pika-year'), $target.data('pika-month'), $target.data('pika-day'));
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
        if ($) {
            $(picker.el).on('mouseenter', '.pika-button', this._handleOver);
            $(picker.el).on('mouseleave', '.pika-button', this._handleOut);
        }


        return picker;
    };





    return Pikarange;

}));
