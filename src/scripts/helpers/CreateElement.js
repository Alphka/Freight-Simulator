function CreateElement() {
    let element;
    let options;
    switch (typeof arguments[0]) {
        case "string":
            element = document.createElement(arguments[0]);
            options = arguments[1] ?? {};
            break;
        case "object":
            if (!arguments[0].tagName)
                throw new Error("tagName is not defined");
            element = document.createElement(arguments[0].tagName);
            options = arguments[0];
            delete options.tagName;
            break;
        default: throw new Error(`args cannot be a type of ${typeof arguments[0]}`);
    }
    const specialAttributes = [
        "textContent",
        "innerText",
        "innerHTML",
        "className",
        "crossOrigin"
    ];
    if (options.children) {
        options.children.forEach(child => element.appendChild(child));
        delete options.children;
    }
    for (const [attribute, value] of Object.entries(options)) {
        // @ts-ignore
        if (typeof value === "boolean" || specialAttributes.includes(attribute))
            element[attribute] = value, delete options[attribute];
        else
            element.setAttribute(attribute, value);
    }
    return element;
}
export default CreateElement;
//# sourceMappingURL=CreateElement.js.map