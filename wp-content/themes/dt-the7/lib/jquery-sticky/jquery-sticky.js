(function ($) {
        var The7Sticky = function (element, userSettings) {
            var $element, isSticky = false, isAbsolute = false, isFollowingParent = false,
                isReachedEffectsPoint = false, elements = {}, settings;
            var defaultSettings = {
                to: "top",
                offset: 0,
                extraOffset: 0,
                effectsOffset: 0,
                parent: false,
                classes: {
                    sticky: "sticky",
                    stickyActive: "sticky-active",
                    stickyEffects: "sticky-effects",
                    spacer: "sticky-spacer",
                }
            };
            var initElements = function () {
                $element = $(element).addClass(settings.classes.sticky);
                elements.$window = $(window);
                if (settings.parent) {
                    if ("parent" === settings.parent) {
                        elements.$parent = $element.parent()
                    } else {
                        elements.$parent = $element.closest(settings.parent)
                    }
                }
            };
            var initSettings = function () {
                settings = jQuery.extend(true, defaultSettings, userSettings)
            };
            var bindEvents = function () {
                elements.$window.on('resize', onWindowResize);
                elements.$window.on('resize', onWindowResizeDebounced);
                elements.$window.on("scroll", onWindowScroll);
            };
            var unbindEvents = function () {
                elements.$window.off("scroll", onWindowScroll).off("resize", onWindowResize).off("resize", onWindowResizeDebounced);
            };
            var init = function () {
                initSettings();
                initElements();
                onWindowResizeDebounced = debounce( onWindowResizeDebounced, 400);
                bindEvents();
                checkPosition()
            };
            var backupCSS = function ($elementBackupCSS, backupState, properties) {
                var css = {}, elementStyle = $elementBackupCSS[0].style;
                properties.forEach(function (property) {
                    if (typeof property === 'object') {
                        for (var key in property) {
                            css[key] = property[key];
                        }
                    } else {
                        css[property] = undefined !== elementStyle[property] ? elementStyle[property] : ""
                    }
                });
                $elementBackupCSS.data("the7-css-backup-" + backupState, css)
            };
            var getCSSBackup = function ($elementCSSBackup, backupState) {
                return $elementCSSBackup.data("the7-css-backup-" + backupState)
            };
            var addSpacer = function () {
                elements.$spacer = $element.clone().addClass(settings.classes.spacer).css({
                    visibility: "hidden",
                    transition: "none",
                    animation: "none"
                });
                $element.after(elements.$spacer)
            };
            var removeSpacer = function () {
                elements.$spacer.remove()
            };
            var stickElement = function () {
                backupCSS($element, "unsticky", ["position", "width", "margin-top", "margin-bottom", "top", "bottom"]);


                var css = {
                    position: "fixed",
                    width: getElementOuterSize($element, "width"),
                    marginTop: 0,
                    marginBottom: 0
                };
                css[settings.to] = settings.offset;
                css["top" === settings.to ? "bottom" : "top"] = "";


                if (elements.$window.scrollTop() <= 0 && !isAbsolute) {
                    isAbsolute = true;
                    backupCSS($element, "unabsolute", [css]);
                    css.position = "absolute";
                    css.top = settings.offset - settings.extraOffset;
                    css.bottom = "";
                }

                $element.css(css).addClass(settings.classes.stickyActive);
            };
            var unstickElement = function () {
                $element.css(getCSSBackup($element, "unsticky")).removeClass(settings.classes.stickyActive)
            };
            var followParent = function () {
                backupCSS(elements.$parent, "childNotFollowing", ["position"]);
                elements.$parent.css("position", "relative");
                backupCSS($element, "notFollowing", ["position", "top", "bottom"]);
                var css = {
                    position: "absolute"
                };
                css[settings.to] = "";
                css["top" === settings.to ? "bottom" : "top"] = 0;
                $element.css(css);
                isFollowingParent = true
            };
            var unfollowParent = function () {
                elements.$parent.css(getCSSBackup(elements.$parent, "childNotFollowing"));
                $element.css(getCSSBackup($element, "notFollowing"));
                isFollowingParent = false
            };
            var getElementOuterSize = function ($elementOuterSize, dimension, includeMargins) {
                var computedStyle = getComputedStyle($elementOuterSize[0])
                    , elementSize = parseFloat(computedStyle[dimension])
                    , sides = "height" === dimension ? ["top", "bottom"] : ["left", "right"]
                    , propertiesToAdd = [];
                if ("border-box" !== computedStyle.boxSizing) {
                    propertiesToAdd.push("border", "padding")
                }
                if (includeMargins) {
                    propertiesToAdd.push("margin")
                }
                propertiesToAdd.forEach(function (property) {
                    sides.forEach(function (side) {
                        elementSize += parseFloat(computedStyle[property + "-" + side])
                    })
                });
                return elementSize
            };
            var getElementViewportOffset = function ($elementViewportOffset) {
                var windowScrollTop = elements.$window.scrollTop()
                    , elementHeight = getElementOuterSize($elementViewportOffset, "height")
                    , viewportHeight = innerHeight
                    , elementOffsetFromTop = $elementViewportOffset.offset().top
                    , distanceFromTop = elementOffsetFromTop - windowScrollTop
                    , topFromBottom = distanceFromTop - viewportHeight;
                return {
                    top: {
                        fromTop: distanceFromTop,
                        fromBottom: topFromBottom
                    },
                    bottom: {
                        fromTop: distanceFromTop + elementHeight,
                        fromBottom: topFromBottom + elementHeight
                    }
                }
            };
            var stick = function () {
                addSpacer();
                stickElement();
                isSticky = true;
                $element.trigger("the7-sticky:stick")
            };
            var unstick = function () {
                unstickElement();
                removeSpacer();
                isSticky = false;
                $element.trigger("the7-sticky:unstick")
            };
            var setAbsolute = function () {
                isAbsolute = true;
                backupCSS($element, "unabsolute", ["position", "top", "bottom"]);
                var css = {
                    position: "absolute",
                    top: settings.offset-settings.extraOffset,
                    bottom: ""
                };
                $element.css(css)
            };
            var unsetAbsolute = function () {
                isAbsolute = false;
                $element.css(getCSSBackup($element, "unabsolute"))
            };
            var checkParent = function () {
                var elementOffset = getElementViewportOffset($element)
                    , isTop = "top" === settings.to;
                if (isFollowingParent) {
                    var isNeedUnfollowing = isTop ? elementOffset.top.fromTop > settings.offset : elementOffset.bottom.fromBottom < -settings.offset;
                    if (isNeedUnfollowing) {
                        unfollowParent()
                    }
                } else {
                    var parentOffset = getElementViewportOffset(elements.$parent),
                        parentStyle = getComputedStyle(elements.$parent[0]),
                        borderWidthToDecrease = parseFloat(parentStyle[isTop ? "borderBottomWidth" : "borderTopWidth"]),
                        parentViewportDistance = isTop ? parentOffset.bottom.fromTop - borderWidthToDecrease : parentOffset.top.fromBottom + borderWidthToDecrease,
                        isNeedFollowing = isTop ? parentViewportDistance <= elementOffset.bottom.fromTop : parentViewportDistance >= elementOffset.top.fromBottom;
                    if (isNeedFollowing) {
                        followParent()
                    }
                }
            };
            var checkEffectsPoint = function (distanceFromTriggerPoint) {
                if (isReachedEffectsPoint && -distanceFromTriggerPoint < settings.effectsOffset) {
                    $element.removeClass(settings.classes.stickyEffects);
                    elements.$spacer.removeClass(settings.classes.stickyEffects);
                    isReachedEffectsPoint = false;
                    $element.trigger("the7-sticky:effect-not-active");

                } else if (!isReachedEffectsPoint && -distanceFromTriggerPoint >= settings.effectsOffset) {
                    $element.addClass(settings.classes.stickyEffects);
                    elements.$spacer.addClass(settings.classes.stickyEffects);
                    isReachedEffectsPoint = true;
                    $element.trigger("the7-sticky:effect-active");
                }
            };
            var checkPosition = function () {
                var offset = settings.offset, distanceFromTriggerPoint;
                var scrollTop = elements.$window.scrollTop();
                if (scrollTop < 0) {
                    checkEffectsPoint(0)
                }
                if (scrollTop <= 0 && isSticky) {
                    if (!isAbsolute) {
                        var spacerViewportOffset = getElementViewportOffset(elements.$spacer);
                        distanceFromTriggerPoint = "top" === settings.to ? spacerViewportOffset.top.fromTop - offset : -spacerViewportOffset.bottom.fromBottom - offset;
                        if (distanceFromTriggerPoint > 0) {
                            unstick();
                        } else {
                            setAbsolute();
                        }
                        checkEffectsPoint(distanceFromTriggerPoint)
                    }
                } else {
                    if (isSticky) {
                        if (isAbsolute) {
                            unsetAbsolute();
                        }
                        var spacerViewportOffset = getElementViewportOffset(elements.$spacer);
                        distanceFromTriggerPoint = "top" === settings.to ? spacerViewportOffset.top.fromTop - offset : -spacerViewportOffset.bottom.fromBottom - offset;
                        if (settings.parent) {
                            checkParent()
                        }
                        if (distanceFromTriggerPoint > 0) {
                            unstick()
                        }
                    } else {
                        var elementViewportOffset = getElementViewportOffset($element);
                        distanceFromTriggerPoint = "top" === settings.to ? elementViewportOffset.top.fromTop - offset : -elementViewportOffset.bottom.fromBottom - offset;
                        if (distanceFromTriggerPoint <= 0) {
                            stick();
                            if (settings.parent) {
                                checkParent()
                            }
                        }
                    }
                    checkEffectsPoint(distanceFromTriggerPoint)
                }
            };
            var onWindowScroll = function () {
                checkPosition()
            };
            var onWindowResizeDebounced = function () {
                onWindowResize(true);
            };
            var onWindowResize = function (updateSpacer = false) {
                if (!isSticky) {
                    return
                }
                if (isAbsolute) {
                    unsetAbsolute();
                }
                if (updateSpacer === true) {
                    removeSpacer();
                }
                unstickElement();
                if (updateSpacer === true) {
                    addSpacer();
                }
                stickElement();
                if (settings.parent) {
                    isFollowingParent = false;
                    checkParent()
                }
            };
            var debounce  = function (func, wait) {
                let timeout;
                return function () {
                    const context = this,
                        args = arguments;

                    const later = () => {
                        timeout = null;
                        func.apply(context, args);
                    };

                    const callNow = !timeout;
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);

                    if (callNow) {
                        func.apply(context, args);
                    }
                };
            };
            this.destroy = function () {
                if (isAbsolute) {
                    unsetAbsolute();
                }
                if (isSticky) {
                    unstick()
                }
                unbindEvents();
                $element.removeClass(settings.classes.sticky)
            };
            init();
        };
        $.fn.The7Sticky = function (settings) {
            var isCommand = "string" === typeof settings;
            this.each(function () {
                var $this = $(this);
                if (!isCommand) {
                    $this.data("the7-sticky", new The7Sticky(this, settings));
                    return
                }
                var instance = $this.data("the7-sticky");
                if (!instance) {
                    throw Error("Trying to perform the `" + settings + "` method prior to initialization")
                }
                if (!instance[settings]) {
                    throw ReferenceError("Method `" + settings + "` not found in sticky instance")
                }
                instance[settings].apply(instance, Array.prototype.slice.call(arguments, 1));
                if ("destroy" === settings) {
                    $this.removeData("the7-sticky")
                }
            });
            return this
        };
    }
)(jQuery);
