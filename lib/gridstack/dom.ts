// @ts-nocheck
// 参考 https://youmightnotneedjquery.com/

function parents(el:HTMLElement, selector?: string) {
    const parents = [];
    while ((el = el.parentNode) && el !== document) {
        if (!selector || el.matches(selector)) parents.push(el);
    }
    return parents;
}

export default {
    parents,
}