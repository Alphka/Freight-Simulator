function WaitForElement(selector, options) {
    const element = options?.element ?? window.document;
    const begin = Date.now();
    if (selector instanceof Array) {
        const promises = new Map();
        selector.forEach(e => {
            let _resolve;
            let _interval;
            const promise = new Promise(resolve => {
                const interval = window.setInterval(() => element.querySelector(e) && (clearInterval(interval),
                    resolve({
                        interval,
                        element: element.querySelector(e)
                    })));
                _resolve = resolve;
                _interval = interval;
            });
            promises.set(_interval, {
                promise,
                resolve: _resolve
            });
        });
        return Promise.race(Array.from(promises.values()).map(e => e.promise)).then(value => {
            promises.delete(value.interval);
            Array.from(promises.entries()).forEach(([interval, data]) => {
                clearInterval(interval);
                data.resolve(value.element);
                promises.delete(interval);
            });
            return value.element;
        });
    }
    return new Promise((resolve, reject) => {
        const interval = window.setInterval(() => {
            const elements = element.querySelectorAll(selector);
            if (elements.length) {
                const returnValue = options?.multiple ? elements : elements[0];
                clearInterval(interval);
                resolve(options?.noError ? Object.assign(returnValue, { isError: false }) : returnValue);
                return;
            }
            if (element instanceof Document)
                console.log(`Looking for: ${selector}`);
            else {
                const id = element.id.trim() ? "#" + element.id.trim() : "";
                const classname = element.className.trim() ? "." + element.className.trim().replace(/ +/g, ".") : "";
                console.log(`Looking for: ${selector} in ${element.nodeName.toLowerCase() + id + classname}`);
            }
            if (options?.expires && Date.now() >= options.expires + begin) {
                clearInterval(interval);
                options.noError ? resolve({ isError: true }) : reject("Selector not found: " + selector);
            }
        });
    });
}
export default WaitForElement;
//# sourceMappingURL=WaitForElement.js.map