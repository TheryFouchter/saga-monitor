/**
 * Copyright (c) 2019, Travis Clarke
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.SagaMonitor = {})));
}(this, (function (exports) { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      var ownKeys = Object.keys(source);

      if (typeof Object.getOwnPropertySymbols === 'function') {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }

      ownKeys.forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    }

    return target;
  }

  var createSymbol = function createSymbol(name) {
    return "@@redux-saga/" + name;
  };

  var CANCEL =
  /*#__PURE__*/
  createSymbol('CANCEL_PROMISE');
  var IO =
  /*#__PURE__*/
  createSymbol('IO');
  var TASK =
  /*#__PURE__*/
  createSymbol('TASK');

  var notUndef = function notUndef(v) {
    return v !== null && v !== undefined;
  };
  var func = function func(f) {
    return typeof f === 'function';
  };
  var string = function string(s) {
    return typeof s === 'string';
  };
  var array = Array.isArray;
  var object = function object(obj) {
    return obj && !array(obj) && typeof obj === 'object';
  };
  var task = function task(t) {
    return t && t[TASK];
  };
  var effect = function effect(eff) {
    return eff && eff[IO];
  };

  var PENDING = "PENDING";
  var RESOLVED = "RESOLVED";
  var REJECTED = "REJECTED";
  var CANCELLED = "CANCELLED";
  var IS_BROWSER = typeof window !== "undefined" && window.document;
  var IS_REACT_NATIVE = typeof navigator !== "undefined" && navigator.product === "ReactNative";

  function delayP(ms, val) {
    if (val === void 0) {
      val = true;
    }

    var timeoutId;
    var promise = new Promise(function (resolve) {
      timeoutId = setTimeout(resolve, ms, val);
    });

    promise[CANCEL] = function () {
      clearTimeout(timeoutId);
    };

    return promise;
  }

  var konst = function konst(v) {
    return function () {
      return v;
    };
  };
  var kTrue =
  /*#__PURE__*/
  konst(true);
  var noop = function noop() {};
  function check(value, predicate, error) {
    if (!predicate(value)) {
      throw new Error(error);
    }
  }

  var BUFFER_OVERFLOW = "Channel's Buffer overflow!";
  var ON_OVERFLOW_THROW = 1;
  var ON_OVERFLOW_DROP = 2;
  var ON_OVERFLOW_SLIDE = 3;
  var ON_OVERFLOW_EXPAND = 4;
  var zeroBuffer = {
    isEmpty: kTrue,
    put: noop,
    take: noop
  };

  function ringBuffer(limit, overflowAction) {
    if (limit === void 0) {
      limit = 10;
    }

    var arr = new Array(limit);
    var length = 0;
    var pushIndex = 0;
    var popIndex = 0;

    var push = function push(it) {
      arr[pushIndex] = it;
      pushIndex = (pushIndex + 1) % limit;
      length++;
    };

    var take = function take() {
      if (length != 0) {
        var it = arr[popIndex];
        arr[popIndex] = null;
        length--;
        popIndex = (popIndex + 1) % limit;
        return it;
      }
    };

    var flush = function flush() {
      var items = [];

      while (length) {
        items.push(take());
      }

      return items;
    };

    return {
      isEmpty: function isEmpty() {
        return length == 0;
      },
      put: function put(it) {
        if (length < limit) {
          push(it);
        } else {
          var doubledLimit;

          switch (overflowAction) {
            case ON_OVERFLOW_THROW:
              throw new Error(BUFFER_OVERFLOW);

            case ON_OVERFLOW_SLIDE:
              arr[pushIndex] = it;
              pushIndex = (pushIndex + 1) % limit;
              popIndex = pushIndex;
              break;

            case ON_OVERFLOW_EXPAND:
              doubledLimit = 2 * limit;
              arr = flush();
              length = arr.length;
              pushIndex = arr.length;
              popIndex = 0;
              arr.length = doubledLimit;
              limit = doubledLimit;
              push(it);
              break;

            default: // DROP

          }
        }
      },
      take: take,
      flush: flush
    };
  }

  var none = function none() {
    return zeroBuffer;
  };
  var fixed = function fixed(limit) {
    return ringBuffer(limit, ON_OVERFLOW_THROW);
  };
  var dropping = function dropping(limit) {
    return ringBuffer(limit, ON_OVERFLOW_DROP);
  };
  var sliding = function sliding(limit) {
    return ringBuffer(limit, ON_OVERFLOW_SLIDE);
  };
  var expanding = function expanding(initialSize) {
    return ringBuffer(initialSize, ON_OVERFLOW_EXPAND);
  };

  var buffers = /*#__PURE__*/Object.freeze({
    none: none,
    fixed: fixed,
    dropping: dropping,
    sliding: sliding,
    expanding: expanding
  });

  var TAKE = 'TAKE';
  var PUT = 'PUT';
  var ALL = 'ALL';
  var RACE = 'RACE';
  var CALL = 'CALL';
  var CPS = 'CPS';
  var FORK = 'FORK';
  var JOIN = 'JOIN';
  var CANCEL$1 = 'CANCEL';
  var SELECT = 'SELECT';
  var ACTION_CHANNEL = 'ACTION_CHANNEL';
  var CANCELLED$1 = 'CANCELLED';
  var FLUSH = 'FLUSH';
  var GET_CONTEXT = 'GET_CONTEXT';
  var SET_CONTEXT = 'SET_CONTEXT';

  var effectTypes = /*#__PURE__*/Object.freeze({
    TAKE: TAKE,
    PUT: PUT,
    ALL: ALL,
    RACE: RACE,
    CALL: CALL,
    CPS: CPS,
    FORK: FORK,
    JOIN: JOIN,
    CANCEL: CANCEL$1,
    SELECT: SELECT,
    ACTION_CHANNEL: ACTION_CHANNEL,
    CANCELLED: CANCELLED$1,
    FLUSH: FLUSH,
    GET_CONTEXT: GET_CONTEXT,
    SET_CONTEXT: SET_CONTEXT
  });

  var makeEffect = function makeEffect(type, payload) {
    var _ref;

    return _ref = {}, _ref[IO] = true, _ref.combinator = false, _ref.type = type, _ref.payload = payload, _ref;
  };

  var validateFnDescriptor = function validateFnDescriptor(effectName, fnDescriptor) {
    check(fnDescriptor, notUndef, effectName + ": argument fn is undefined or null");

    if (func(fnDescriptor)) {
      return;
    }

    var context = null;
    var fn;

    if (array(fnDescriptor)) {
      context = fnDescriptor[0];
      fn = fnDescriptor[1];
      check(fn, notUndef, effectName + ": argument of type [context, fn] has undefined or null `fn`");
    } else if (object(fnDescriptor)) {
      context = fnDescriptor.context;
      fn = fnDescriptor.fn;
      check(fn, notUndef, effectName + ": argument of type {context, fn} has undefined or null `fn`");
    } else {
      check(fnDescriptor, func, effectName + ": argument fn is not function");
      return;
    }

    if (context && string(fn)) {
      check(context[fn], func, effectName + ": context arguments has no such method - \"" + fn + "\"");
      return;
    }

    check(fn, func, effectName + ": unpacked fn argument (from [context, fn] or {context, fn}) is not a function");
  };

  function getFnCallDescriptor(fnDescriptor, args) {
    var context = null;
    var fn;

    if (func(fnDescriptor)) {
      fn = fnDescriptor;
    } else {
      if (array(fnDescriptor)) {
        context = fnDescriptor[0];
        fn = fnDescriptor[1];
      } else {
        context = fnDescriptor.context;
        fn = fnDescriptor.fn;
      }

      if (context && string(fn) && func(context[fn])) {
        fn = context[fn];
      }
    }

    return {
      context: context,
      fn: fn,
      args: args
    };
  }

  var isNotDelayEffect = function isNotDelayEffect(fn) {
    return fn !== delay;
  };

  function call(fnDescriptor) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (process.env.NODE_ENV !== 'production') {
      var arg0 = typeof args[0] === 'number' ? args[0] : 'ms';
      check(fnDescriptor, isNotDelayEffect, "instead of writing `yield call(delay, " + arg0 + ")` where delay is an effect from `redux-saga/effects` you should write `yield delay(" + arg0 + ")`");
      validateFnDescriptor('call', fnDescriptor);
    }

    return makeEffect(CALL, getFnCallDescriptor(fnDescriptor, args));
  }
  var delay =
  /*#__PURE__*/
  call.bind(null, delayP);

  var isRaceEffect = function isRaceEffect(eff) {
    return effect(eff) && eff.type === effectTypes.RACE;
  };

  var Manager =
  /*#__PURE__*/
  function () {
    function Manager() {
      _classCallCheck(this, Manager);

      this.rootIds = []; // effect-id-to-effect-descriptor

      this.map = {}; // effect-id-to-array-of-child-id

      this.childIdsMap = {};
    }

    _createClass(Manager, [{
      key: "get",
      value: function get(effectId) {
        return this.map[effectId];
      }
    }, {
      key: "set",
      value: function set(effectId, desc) {
        this.map[effectId] = desc;

        if (this.childIdsMap[desc.parentEffectId] == null) {
          this.childIdsMap[desc.parentEffectId] = [];
        }

        this.childIdsMap[desc.parentEffectId].push(effectId);
      }
    }, {
      key: "setRootEffect",
      value: function setRootEffect(effectId, desc) {
        this.rootIds.push(effectId);
        this.set(effectId, Object.assign({
          root: true
        }, desc));
      }
    }, {
      key: "getRootIds",
      value: function getRootIds() {
        return this.rootIds;
      }
    }, {
      key: "getChildIds",
      value: function getChildIds(parentEffectId) {
        return this.childIdsMap[parentEffectId] || [];
      }
    }]);

    return Manager;
  }();

  function time() {
    if (typeof performance !== "undefined" && performance.now) {
      return performance.now();
    } else {
      return Date.now();
    }
  }

  var manager = new Manager();

  function computeEffectDur(effect$$1) {
    var now = time();
    Object.assign(effect$$1, {
      end: now,
      duration: now - effect$$1.start
    });
  }

  function resolveEffect(effectId, result) {
    var effect$$1 = manager.get(effectId);

    if (task(result)) {
      result.toPromise().then(function (taskResult) {
        if (result.isCancelled()) {
          cancelEffect(effectId);
        } else {
          resolveEffect(effectId, taskResult);
        }
      }, function (taskError) {
        return rejectEffect(effectId, taskError);
      });
    } else {
      computeEffectDur(effect$$1);
      effect$$1.status = RESOLVED;
      effect$$1.result = result;

      if (isRaceEffect(effect$$1.effect)) {
        setRaceWinner(effectId, result);
      }
    }
  }

  function rejectEffect(effectId, error) {
    var effect$$1 = manager.get(effectId);
    computeEffectDur(effect$$1);
    effect$$1.status = REJECTED;
    effect$$1.error = error;

    if (isRaceEffect(effect$$1.effect)) {
      setRaceWinner(effectId, error);
    }
  }

  function cancelEffect(effectId) {
    var effect$$1 = manager.get(effectId);
    computeEffectDur(effect$$1);
    effect$$1.status = CANCELLED;
  }

  function setRaceWinner(raceEffectId, result) {
    var winnerLabel = Object.keys(result)[0];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = manager.getChildIds(raceEffectId)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var childId = _step.value;
        var childEffect = manager.get(childId);

        if (childEffect.label === winnerLabel) {
          childEffect.winner = true;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  var defaultConfig = {
    level: "debug",
    color: "#03A9F4",
    verbose: true,
    rootSagaStart: false,
    effectTrigger: false,
    effectResolve: false,
    effectReject: false,
    effectCancel: false,
    actionDispatch: false
  };

  function createSagaMonitor() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var config = _objectSpread({}, defaultConfig, options);

    var level = config.level,
        verbose = config.verbose,
        color = config.color,
        rootSagaStart = config.rootSagaStart,
        effectTrigger = config.effectTrigger,
        effectResolve = config.effectResolve,
        effectReject = config.effectReject,
        effectCancel = config.effectCancel,
        actionDispatch = config.actionDispatch;
    var styles = ["color: ".concat(color), "font-weight: bold"].join(";");

    function rootSagaStarted(desc) {
      if (rootSagaStart) {
        console[level]("%c Root saga started:", styles, desc.saga.name || "anonymous", desc.args);
      }

      manager.setRootEffect(desc.effectId, Object.assign({}, desc, {
        status: PENDING,
        start: time()
      }));
    }

    function effectTriggered(desc) {
      if (effectTrigger) {
        console[level]("%c effectTriggered:", styles, desc);
      }

      manager.set(desc.effectId, Object.assign({}, desc, {
        status: PENDING,
        start: time()
      }));
    }

    function effectResolved(effectId, result) {
      if (effectResolve) {
        console[level]("%c effectResolved:", styles, effectId, result);
      }

      resolveEffect(effectId, result);
    }

    function effectRejected(effectId, error) {
      if (effectReject) {
        console[level]("%c effectRejected:", styles, effectId, error);
      }

      rejectEffect(effectId, error);
    }

    function effectCancelled(effectId) {
      if (effectCancel) {
        console[level]("%c effectCancelled:", styles, effectId);
      }

      cancelEffect(effectId);
    }

    function actionDispatched(action) {
      if (actionDispatch) {
        console[level]("%c actionDispatched:", styles, action);
      }
    }

    return {
      rootSagaStarted: rootSagaStarted,
      effectTriggered: effectTriggered,
      effectResolved: effectResolved,
      effectRejected: effectRejected,
      effectCancelled: effectCancelled,
      actionDispatched: actionDispatched
    };
  }

  exports.default = createSagaMonitor;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
