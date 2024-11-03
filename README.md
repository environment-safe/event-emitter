@environment-safe/event-emitter
===============================
A cross platform, source compatible emitter interface which uses a custom Emitter implementation (as opposed to integrating with native implementations as [extended-emitter](https://www.npmjs.com/package/extended-emitter) does). This allows implementations to vary and mutate without impacting downstream implementations.

`event-emitter` Usage
---------------------
Usage should be (generally) as expected from the [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter) interface.

**Browser Deps**
If you want to use from source in a browser, you need to add some dependenciess to your [importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) you can do this programmatically with [wing-kong](https://www.npmjs.com/package/wing-kong) or using testing with [moka](https://www.npmjs.com/package/@open-automaton/moka) `.moka` in `package.json` or just manually in your HTML like:
```html
<script type="importmap">{ "imports" :{
    "browser-or-node":"https://unpkg.com/browser-or-node@2.1.1/src/index.js"
}}</script>
```

### import
**CommonJS**
```javascript
const { EventEmitter } = require('@environment-safe/event-emitter');
const emitter = new Emitter();
```
**ES6 imports**
```javascript
import { EventEmitter } from '@environment-safe/event-emitter';
const emitter = new Emitter();
```

`extended-emitter` Usage
------------------------

### import
**CommonJS**
```javascript
const { ExtendedEmitter } = require('@environment-safe/event-emitter');
const emitter = new Emitter();
```
**ES6 imports**
```javascript
import { ExtendedEmitter } from '@environment-safe/event-emitter';
const emitter = new Emitter();
```

### optional criteria
you can now use the [DocumentQuery](https://docs.mongodb.com/manual/reference/operator/query/) interface (supported by [sift](https://www.npmjs.com/package/sift)) to subscribe to specific events (in this context `.once()` means meeting the criteria, not just firing an event of that type).

```javascript
emitter.on('my_object_event', {
    myObjectId : object.id
}, function(){
    //do stuff here
});

// or

emitter.once('my_object_event', {
    myObjectId : object.id,
    myObjectValue : {
        $gt : 20,
        $lt : 40
    }
}, function(){
    //do stuff here
});
```

### .when()

and there's also the addition of a `when` function which can take ready-style functions, real promises or events, making it easy to delay or wait for a state, without resorting to chaining.

#### async
```javascript
await emitter.when([$(document).ready, 'my-init-event', 'my-load-event']);
```

#### callbacks
```javascript
emitter.when([$(document).ready, 'my-init-event', 'my-load-event'], function(){
    //do stuff
});
```

### .onto()
Often you want an object to implement emitters, and while it's easy enough to wrap them, why not just have that done for you and avoid the boilerplate?

```javascript
emitter.onto(MyClass.prototype);
emitter.onto(MyInstance);
emitter.onto(MyObject);
```

or in the constructor:

```javascript
(new Emitter()).onto(this);
```

Testing
-------

Run the es module tests to test the root modules
```bash
npm run import-test
```
to run the same test inside the browser:

```bash
npm run browser-test
```
to run the same test headless in chrome:
```bash
npm run headless-browser-test
```

to run the same test inside docker:
```bash
npm run container-test
```

Run the commonjs tests against the `/dist` commonjs source (generated with the `build-commonjs` target).
```bash
npm run require-test
```

Roadmap
-------
Working toward exhaustive support of the EventEmitter interface.

Development
-----------
All work is done in the .mjs files and will be transpiled on commit to commonjs and tested.

If the above tests pass, then attempt a commit which will generate .d.ts files alongside the `src` files and commonjs classes in `dist`

