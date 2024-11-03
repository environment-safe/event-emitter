"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EventEmitter = exports.Emitter = void 0;
exports.ExtendedEmitter = ExtendedEmitter;
var _sift = _interopRequireDefault(require("sift"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class EventEmitter {
  constructor() {
    this.events = {};
  }

  // Add an event listener to the specified event
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  // Remove an event listener from the specified event
  off(event, listener) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(listener);
      if (index > -1) {
        this.events[event].splice(index, 1);
      }
    }
  }

  // Add an event listener to the specified event that will only be called once
  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  // Remove all event listeners for the specified event
  allOff(event) {
    if (this.events[event]) {
      delete this.events[event];
    }
  }

  // Emit an event and call all registered listeners with the provided arguments
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }
  /*constructor(){
      if(EventEmitterClass) return new EventEmitterClass();
      if(isBrowser || isJsDom){
          class EventEmitterDef extends EventTarget{
              on(type, handler){
                  const wrapped = function(e){
                      handler(e.detail);
                  };
                  const elr = this.addEventListener(type, wrapped);
                  console.log('>>>', wrapped.toString());
                  return wrapped;
              }
              
              off(type, handler){
                  console.log('m>>', handler.toString());
                  const result = this.removeEventListener(type, handler);
                  console.log('R', typeof result)
                  return result;
              }
              
              once(type, handler){
                  const wrapped = this.on(type, (e)=>{
                      this.off(type, wrapped);
                      handler(e);
                  });
                  return wrapped;
              }
              
              emit(type, value){
                  return this.dispatchEvent(new CustomEvent(type, {
                      detail: value 
                  }));
              }
              
              
              
              removeListener(type, handler){
                  return this.off(type, handler);
              }
              
              addListener(type, handler){
                  return this.on(type, handler);
              }
              
              allOff(type){
                  
              }
          }
          EventEmitterClass = EventEmitterDef;
          return new EventEmitterClass();
      }else{
          if(EventEmitterClass) return new EventEmitterClass();
          ensureRequire();
          const { 
              EventEmitter
          } = internalRequire('node:events');
          EventEmitterClass = EventEmitter;
          return new EventEmitterClass();
      }
  } //*/
}
exports.EventEmitter = EventEmitter;
function processArgs(args, hasTarget) {
  var result = {};
  args = Array.prototype.slice.call(args);
  if (typeof args[args.length - 1] === 'function') {
    result.callback = args[args.length - 1];
    args.splice(args.length - 1, 1);
  }
  result.name = args.shift();
  if (hasTarget) result.target = args.pop();
  result.conditions = args[args.length - 1] || args[0] || {};
  return result;
}
function meetsCriteria(name, object, testName, testObject) {
  if (name != testName) return false;
  if (!object) return true;
  var filter = (0, _sift.default)(testObject);
  var result = filter(object);
  return result;
}
function ExtendedEmitter(emitter) {
  this.emitter = emitter || new EventEmitter();
  if (typeof module === 'object' && module.exports && this.emitter.setMaxListeners) this.emitter.setMaxListeners(100);
}
const Emitter = exports.Emitter = EventEmitter;
//export const Emitter = ExtendedEmitter;

ExtendedEmitter.prototype.onto = function (objectDefinition) {
  var ob = this;
  objectDefinition.on = function () {
    return ob.on.apply(ob, arguments);
  };
  objectDefinition.off = function () {
    return ob.off.apply(ob, arguments);
  };
  objectDefinition.once = function () {
    return ob.once.apply(ob, arguments);
  };
  objectDefinition.emit = function () {
    return ob.emit.apply(ob, arguments);
  };
};
ExtendedEmitter.prototype.off = function (event, fn) {
  return this.emitter.off.apply(this.emitter, arguments);
};
ExtendedEmitter.prototype.allOff = function (event, fn) {
  return this.emitter.allOff.apply(this.emitter, arguments);
};
ExtendedEmitter.prototype.on = function (name) {
  var args = processArgs(arguments);
  var proxyFn = function (data) {
    if (meetsCriteria(name, data, args.name, args.conditions)) {
      args.callback.apply(args.callback, arguments);
    }
  };
  this.emitter.on.apply(this.emitter, [args.name, proxyFn]);
  return proxyFn;
};
ExtendedEmitter.prototype.emit = function () {
  return this.emitter.emit.apply(this.emitter, arguments);
};

//for some reason some emitter love the send fn, which *should* be the same
//make this nuance addressible by having the fn execute in a non-breaky way
ExtendedEmitter.prototype.send = function () {
  var fn = this.emitter.send || this.emitter.emit;
  return fn.apply(this.emitter, arguments);
};
ExtendedEmitter.prototype.once = function (name) {
  var args = processArgs(arguments);
  var ob = this;
  //NOTE: in certain situations nonstandard emitter push an event through
  //      first, wrecking everything hence: `data1, data2`
  var proxyFn = function cb(data1, data2) {
    var data = data2 || data1;
    if (meetsCriteria(name, data, args.name, args.conditions)) {
      ob.off.apply(ob, [args.name, cb]);
      args.callback.apply(args.callback, arguments);
    }
  };
  this.emitter.on.apply(this.emitter, [args.name, proxyFn]);
  return proxyFn;
};
ExtendedEmitter.prototype.when = function (events, cb) {
  let callback = cb;
  let result = null;
  if (!callback) {
    result = new Promise((resolve, reject) => {
      callback = (err, result) => {
        if (err) return reject(err);
        resolve(result);
      };
    });
  }
  var count = 0;
  var returns = [];
  var ob = this;
  events.forEach(function (event, index) {
    var respond = function (emission) {
      count++;
      returns[index] = emission;
      if (count == events.length) callback.apply(callback, returns);
    };
    if (event.then) {
      //promise handling
      event.then(function (resolve, error, notify) {
        respond();
        resolve();
      });
      return;
    }
    if (typeof event == 'function') event(respond);else return ob.emitter.once(event, respond);
  });
  return result;
};