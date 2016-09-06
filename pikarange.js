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

    isArray = function(obj)
    {
        return (/Array/).test(Object.prototype.toString.call(obj));
    },

    isDate = function(obj)
    {
        return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
    },

    extend = function(to, from, overwrite)
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
    },

    del = function(hash, key) {
        var val = hash[key];
        delete hash[key];
        return val;
    },

    extendMethod = function(src, dst, name) {
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
    extendPlus = function(orig, overwrite) {
        for (var method in overwrite) {
            extendMethod(orig, overwrite, method);
        }
        return orig;
    },

    compareDates = function(a,b)
    {
        if (!a || !b) {
            return false;
        }
        // weak date comparison (use setToStartOfDay(date) to ensure correct result)
        return a.getTime() === b.getTime();
    },

    adjustDate = function(day, days) {
        var newDay;

        if (!hasMoment) {
            var difference = parseInt(days)*24*60*60*1000;
            newDay = new Date(day.valueOf() + difference);
        } else {
            newDay = moment(day).add(days, "days").toDate();
        }

        return newDay;
    },


    updateRange = function(picker, start, end) {
        var dirty = false;
        if (start) {
            if (picker.getEndRange() && !compareDates(picker.getStartRange(), start)) {
                dirty = true;
            }
            picker.setStartRange(start);
        }
        if (end) {
            if (picker.getStartRange() && !compareDates(picker.getEndRange(), end)) {
                dirty = true;
            }
            picker.setEndRange(end);
        }
        if (dirty) {
            picker.draw();
        }
    },


    /**
     * defaults and localisation
     */
    defaults = {

        // bind the picker to a form field
        start: {},
        end: {},

        minRange: 0,
        defaultRange: 1,
        maxRange: -1


    },




    /**
     * Pikarange constructor
     */
    Pikarange = function(options)
    {
        var self = this,
            opts = this.config(options),
            updateStartDate = function() {
                var minDate = opts.minRange >= 0 ? adjustDate(self.startDate, opts.minRange) : null;
                var maxDate = opts.maxRange >= 0 ? adjustDate(self.startDate, opts.maxRange) : null;

                updateRange(self.startPicker, self.startDate);
                updateRange(self.endPicker, self.startDate);
                if (minDate) {
                    self.endPicker.setMinDate(minDate);
                    if (self.endPicker._d && minDate > self.endPicker._d) {
                        self.endPicker.setDate(minDate);
                    }
                }
                if (maxDate) {
                    // we could consider the max date set explicitely on the end picker
                    self.endPicker.setMaxDate(maxDate);
                    if (self.endPicker._d && maxDate < self.endPicker._d) {
                        self.endPicker.setDate(maxDate);
                    }
                }
                if (!self.endPicker._d && opts.defaultRange >= 0 && opts.defaultRange >= opts.minRange) {
                    self.endPicker.setDate(adjustDate(self.startDate, opts.defaultRange));
                }
            },
            updateEndDate = function() {
                updateRange(self.startPicker, false, self.endDate);
                updateRange(self.endPicker, false, self.endDate);
            };

        this.startPicker = new Pikaday(extendPlus(opts.start, {
            onSelect: function() {
                self.startDate = self.startPicker.getDate();
                updateStartDate();
            },
            onOpen: function(cancelled) {
                updateRange(self.startPicker, self.startPicker.getDate());
            },
            onClose: function(cancelled) {
                if (!cancelled) {
                    self.endPicker._o.field.focus();
                }
            }
        }));

        this.endPicker = new Pikaday(extendPlus(opts.end, {
            onOpen: function(cancelled) {
                updateRange(self.endPicker, null, self.endPicker.getDate());
            },
            onSelect: function() {
                self.endDate = self.endPicker.getDate();
                updateEndDate();
            }
        }));


        function handleOver(start) {
            return function(event) {
                var $target = $(event.currentTarget);
                var date = new Date($target.data('pika-year'), $target.data('pika-month'), $target.data('pika-day'));

                var picker = start ? self.startPicker : self.endPicker;
                clearTimeout(picker.delay);
                if (start) {
                    updateRange(picker, date);
                } else {
                    updateRange(picker, null, date);
                }
            }
        }

        function handleOut(start) {
            return function(event) {
                console.log('Handle out');
                var $target = $(event.currentTarget);

                var picker = start ? self.startPicker : self.endPicker;
                clearTimeout(picker.delay);
                picker.delay = setTimeout(function() {
                    if (start) {
                        updateRange(picker, picker.getDate());
                    } else {
                        updateRange(picker, null, picker.getDate());
                    }
                }, 200);
            }
        }

        // show range on mouse over
        // (we use jquery here to avoid complex event handling)
        if ($) {
            $(this.startPicker.el).on('mouseenter', '.pika-button', handleOver(true));
            $(this.endPicker.el).on('mouseenter', '.pika-button', handleOver(false));
            $(this.startPicker.el).on('mouseleave', '.pika-button', handleOut(true));
            $(this.endPicker.el).on('mouseleave', '.pika-button', handleOut(false));
        }



        var _startDate = this.startPicker._d,
            _endDate = this.endPicker._d;

        if (_startDate) {
            this.startDate = _startDate;
            updateStartDate();
        }

        if (_endDate) {
            this.endDate = _endDate;
            updateEndDate();
        }

    };


    /**
     * public Pikarange API
     */
    Pikarange.prototype = {


        /**
         * configure functionality
         */
        config: function(conf)
        {
            var options = extend({}, defaults, true);
            options = extend(options, conf, true);

            var startOptions = del(options, 'start') || {},
                endOptions = del(options, 'end') || {};

            this._o = {
                defaultRange: del(options, 'defaultRange'),
                minRange: del(options, 'minRange'),
                maxRange: del(options, 'maxRange'),
                start: extend({}, options, true),
                end: extend({}, options, true)
            };

            extend(this._o.start, startOptions);
            extend(this._o.end, endOptions);

            return this._o;
        },

        /**
         * return a formatted string of the current selection (using Moment.js if available)
         */
        toString: function(format)
        {
            return this.startPicker.toString(format) + ' - ' + this.endPicker.toString(format);
        },

        /**
         * return the start Date object
         */
        getStartDate: function()
        {
            return this.startPicker.getDate();
        },


        /**
         * return the end Date object
         */
        getStartDate: function()
        {
            return this.endPicker.getDate();
        },



        /**
         * GAME OVER
         */
        destroy: function()
        {
            this.startPicker.destroy();
            this.endPicker.destroy();
        }

    };

    return Pikarange;

}));
