(function() {
    var d, matched, userAgent, __slice = Array.prototype.slice;
    if ($.browser == null) {
        userAgent = navigator.userAgent || "";
        jQuery.uaMatch = function(a) {
            var b;
            a = a.toLowerCase();
            b = /(chrome)[ \/]([\w.]+)/.exec(a) || /(webkit)[ \/]([\w.]+)/.exec(a) || /(opera)(?:.*version)?[ \/]([\w.]+)/.exec(a) || /(msie) ([\w.]+)/.exec(a) || a.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+))?/.exec(a) || [];
            return {
                browser: b[1] || "",
                version: b[2] || "0"
            }
        };
        matched = jQuery.uaMatch(userAgent);
        jQuery.browser = {};
        if (matched.browser) {
            jQuery.browser[matched.browser] = true;
            jQuery.browser.version = matched.version
        }
        if (jQuery.browser.webkit) jQuery.browser.safari = true
    }
    d = (function() {
        function d(a, b) {
            var c, opts, value;
            this.elem = $(a);
            opts = $.extend({}, d.defaults, b);
            for (c in opts) {
                value = opts[c];
                this[c] = value
            }
            this.elem.data(this.dataName, this);
            this.wrapCheckboxWithDivs();
            this.attachEvents();
            this.disableTextSelection();
            if (this.resizeHandle) this.optionallyResize('handle');
            if (this.resizeContainer) this.optionallyResize('container');
            this.initialPosition()
        }
        d.prototype.isDisabled = function() {
            return this.elem.is(':disabled')
        };
        d.prototype.wrapCheckboxWithDivs = function() {
            this.elem.wrap("<div class='" + this.containerClass + "' />");
            this.container = this.elem.parent();
            this.offLabel = $("<label class='" + this.labelOffClass + "'>\n  <span>" + this.uncheckedLabel + "</span>\n</label>").appendTo(this.container);
            this.offSpan = this.offLabel.children('span');
            this.onLabel = $("<label class='" + this.labelOnClass + "'>\n  <span>" + this.checkedLabel + "</span>\n</label>").appendTo(this.container);
            this.onSpan = this.onLabel.children('span');
            return this.handle = $("<div class='" + this.handleClass + "'>\n  <div class='" + this.handleRightClass + "'>\n    <div class='" + this.handleCenterClass + "' />\n  </div>\n</div>").appendTo(this.container)
        };
        d.prototype.disableTextSelection = function() {
            if ($.browser.msie) {
                return $([this.handle, this.offLabel, this.onLabel, this.container]).attr("unselectable", "on")
            }
        };
        d.prototype._getDimension = function(a, b) {
            if ($.fn.actual != null) {
                return a.actual(b)
            } else {
                return a[b]()
            }
        };
        d.prototype.optionallyResize = function(a) {
            var b, offLabelWidth, onLabelWidth;
            onLabelWidth = this._getDimension(this.onLabel, "width");
            offLabelWidth = this._getDimension(this.offLabel, "width");
            if (a === "container") {
                b = onLabelWidth > offLabelWidth ? onLabelWidth : offLabelWidth;
                b += this._getDimension(this.handle, "width") + this.handleMargin;
                return this.container.css({
                    width: b
                })
            } else {
                b = onLabelWidth > offLabelWidth ? onLabelWidth : offLabelWidth;
                return this.handle.css({
                    width: b
                })
            }
        };
        d.prototype.onMouseDown = function(a) {
            var x;
            a.preventDefault();
            if (this.isDisabled()) return;
            x = a.pageX || a.originalEvent.changedTouches[0].pageX;
            d.currentlyClicking = this.handle;
            d.dragStartPosition = x;
            return d.handleLeftOffset = parseInt(this.handle.css('left'), 10) || 0
        };
        d.prototype.onDragMove = function(a, x) {
            var b, p;
            if (d.currentlyClicking !== this.handle) return;
            p = (x + d.handleLeftOffset - d.dragStartPosition) / this.rightSide;
            if (p < 0) p = 0;
            if (p > 1) p = 1;
            b = p * this.rightSide;
            this.handle.css({
                left: b
            });
            this.onLabel.css({
                width: b + this.handleRadius
            });
            this.offSpan.css({
                marginRight: -b
            });
            return this.onSpan.css({
                marginLeft: -(1 - p) * this.rightSide
            })
        };
        d.prototype.onDragEnd = function(a, x) {
            var p;
            if (d.currentlyClicking !== this.handle) return;
            if (this.isDisabled()) return;
            if (d.dragging) {
                p = (x - d.dragStartPosition) / this.rightSide;
                this.elem.prop('checked', p >= 0.5)
            } else {
                this.elem.prop('checked', !this.elem.prop('checked'))
            }
            d.currentlyClicking = null;
            d.dragging = null;
            return this.didChange()
        };
        d.prototype.refresh = function() {
            return this.didChange()
        };
        d.prototype.didChange = function() {
            var a;
            if (typeof this.onChange === "function") {
                this.onChange(this.elem, this.elem.prop('checked'))
            }
            if (this.isDisabled()) {
                this.container.addClass(this.disabledClass);
                return false
            } else {
                this.container.removeClass(this.disabledClass)
            }
            a = this.elem.prop('checked') ? this.rightSide : 0;
            this.handle.animate({
                left: a
            }, this.duration);
            this.onLabel.animate({
                width: a + this.handleRadius
            }, this.duration);
            this.offSpan.animate({
                marginRight: -a
            }, this.duration);
            return this.onSpan.animate({
                marginLeft: a - this.rightSide
            }, this.duration)
        };
        d.prototype.attachEvents = function() {
            var b, localMouseUp, self;
            self = this;
            b = function(a) {
                return self.onGlobalMove.apply(self, arguments)
            };
            localMouseUp = function(a) {
                self.onGlobalUp.apply(self, arguments);
                $(document).unbind('mousemove touchmove', b);
                return $(document).unbind('mouseup touchend', localMouseUp)
            };
            this.elem.change(function() {
                return self.refresh()
            });
            return this.container.bind('mousedown touchstart', function(a) {
                self.onMouseDown.apply(self, arguments);
                $(document).bind('mousemove touchmove', b);
                return $(document).bind('mouseup touchend', localMouseUp)
            })
        };
        d.prototype.initialPosition = function() {
            var a, offset;
            a = this._getDimension(this.container, "width");
            this.offLabel.css({
                width: a - this.containerRadius
            });
            offset = this.containerRadius + 1;
            if ($.browser.msie && $.browser.version < 7) offset -= 3;
            this.rightSide = a - this._getDimension(this.handle, "width") - offset;
            if (this.elem.is(':checked')) {
                this.handle.css({
                    left: this.rightSide
                });
                this.onLabel.css({
                    width: this.rightSide + this.handleRadius
                });
                this.offSpan.css({
                    marginRight: -this.rightSide
                })
            } else {
                this.onLabel.css({
                    width: 0
                });
                this.onSpan.css({
                    marginLeft: -this.rightSide
                })
            }
            if (this.isDisabled()) return this.container.addClass(this.disabledClass)
        };
        d.prototype.onGlobalMove = function(a) {
            var x;
            if (!(!this.isDisabled() && d.currentlyClicking)) return;
            a.preventDefault();
            x = a.pageX || a.originalEvent.changedTouches[0].pageX;
            if (!d.dragging && (Math.abs(d.dragStartPosition - x) > this.dragThreshold)) {
                d.dragging = true
            }
            return this.onDragMove(a, x)
        };
        d.prototype.onGlobalUp = function(a) {
            var x;
            if (!d.currentlyClicking) return;
            a.preventDefault();
            x = a.pageX || a.originalEvent.changedTouches[0].pageX;
            this.onDragEnd(a, x);
            return false
        };
        d.defaults = {
            duration: 200,
            checkedLabel: 'ON',
            uncheckedLabel: 'OFF',
            resizeHandle: true,
            resizeContainer: true,
            disabledClass: 'iPhoneCheckDisabled',
            containerClass: 'iPhoneCheckContainer',
            labelOnClass: 'iPhoneCheckLabelOn',
            labelOffClass: 'iPhoneCheckLabelOff',
            handleClass: 'iPhoneCheckHandle',
            handleCenterClass: 'iPhoneCheckHandleCenter',
            handleRightClass: 'iPhoneCheckHandleRight',
            dragThreshold: 5,
            handleMargin: 15,
            handleRadius: 4,
            containerRadius: 5,
            dataName: "iphoneStyle",
            onChange: function() {}
        };
        return d
    })();
    $.iphoneStyle = this.iOSCheckbox = d;
    $.fn.iphoneStyle = function() {
        var a, checkbox, dataName, existingControl, method, params, _i, _len, _ref, _ref2, _ref3, _ref4;
        a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        dataName = (_ref = (_ref2 = a[0]) != null ? _ref2.dataName : void 0) != null ? _ref : d.defaults.dataName;
        _ref3 = this.filter(':checkbox');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            checkbox = _ref3[_i];
            existingControl = $(checkbox).data(dataName);
            if (existingControl != null) {
                method = a[0], params = 2 <= a.length ? __slice.call(a, 1) : [];
                if ((_ref4 = existingControl[method]) != null) {
                    _ref4.apply(existingControl, params)
                }
            } else {
                new d(checkbox, a[0])
            }
        }
        return this
    };
    $.fn.iOSCheckbox = function(a) {
        var b;
        if (a == null) a = {};
        b = $.extend({}, a, {
            resizeHandle: false,
            disabledClass: 'iOSCheckDisabled',
            containerClass: 'iOSCheckContainer',
            labelOnClass: 'iOSCheckLabelOn',
            labelOffClass: 'iOSCheckLabelOff',
            handleClass: 'iOSCheckHandle',
            handleCenterClass: 'iOSCheckHandleCenter',
            handleRightClass: 'iOSCheckHandleRight',
            dataName: 'iOSCheckbox'
        });
        return this.iphoneStyle(b)
    }
}).call(this);
