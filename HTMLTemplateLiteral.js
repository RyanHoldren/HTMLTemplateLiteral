export function unsafe(html) {
	return new HTMLTemplateLiteral([html], []);
}

export function html({raw}, ... substitutions) {
	return new HTMLTemplateLiteral(raw, substitutions);
}

const links = {};

export function toStylesheetLink(css) {
	if (css in links) {
		return links[css];
	}
	const blob = new Blob([css], {type: "text/css"});
	const url = URL.createObjectURL(blob);
	const link = html `<link rel="stylesheet" type="text/css" href="${url}" />`;
	links[css] = link;
	return link;
}

const promises = {};
const PROMISE_INDEX = "data-promise-placeholder";

class HTMLTemplateLiteral {
	constructor(raw, substitutions) {
		this.raw = raw;
		this.substitutions = substitutions;
	}
	replace(element) {
		element.parentNode.replaceChild(this.toDocumentFragment(), element);
	}
	appendTo(element) {
		element.appendChild(this.toDocumentFragment());
	}
	toDocumentFragment() {
		const template = document.createElement("template");
		template.innerHTML = this;
		const {content} = template;
		Array.prototype.forEach.call(
			content.querySelectorAll("template[" + PROMISE_INDEX + "]"),
			template => {
				const index = template.getAttribute(PROMISE_INDEX);
				promises[index](template);
				delete promises[index];
			}
		);
		return content;
	}
	toString() {
		return "".concat(... this);
	}
	*[Symbol.iterator]() {
		const {raw, substitutions} = this;
		let index = 0;
		while (index < substitutions.length) {
			yield raw[index];
			yield* toSnippets(substitutions[index]);
			index ++;
		}
		yield raw[index];
	}
}

function *toSnippets(thing) {
	if (thing === null || thing === undefined) {
		return;
	}
	if (thing instanceof HTMLTemplateLiteral) {
		yield* thing;
	} else if (typeof thing === "string") {
		yield escapeHtmlEntitiesIn(thing);
	} else if (isPromise(thing)) {
		yield promiseToSnippet(thing);
	} else if (thing instanceof HTMLElement || thing instanceof DocumentFragment) {
		yield elementToSnippet(thing);
	} else if (isIterable(thing)) {
		for (const item of thing) {
			yield* toSnippets(item);
		}
	} else if (typeof thing === "function") {
		yield callbackToSnippet(thing);
	} else {
		yield escapeHtmlEntitiesIn(thing.toString());
	}
}

function isPromise(thing) {
	return Promise.resolve(thing) == thing;
}

function isIterable(thing) {
	return typeof thing[Symbol.iterator] === "function";
}

let counter = 0;
let callbacks = {};

window.handleEvent = (index, target, event) => {
	return callbacks[index].call(target, event);
};

export function clearEvents() {
	callbacks = {};
}

function callbackToSnippet(callback) {
	const index = ++ counter;
	callbacks[index] = callback;
	return `"return handleEvent(${index}, this, event)"`;
}

function promiseToSnippet(promise) {
	const index = ++ counter;
	Promise.all([
		new Promise((resolve, reject) => {
			promises[index] = resolve;
		}),
		promise
	]).then(values => {
		const [template, result] = values;
		(html `${result}`).replace(template);
	});
	return html `<template ${PROMISE_INDEX}="${index}"></template>`;
}

function elementToSnippet(element) {
	const index = ++ counter;
	new Promise((resolve, reject) => {
		promises[index] = resolve;
	}).then(template => {
		template.parentNode.replaceChild(element, template);
	});
	return html `<template ${PROMISE_INDEX}="${index}"></template>`;
}

function escapeHtmlEntitiesIn(string) {
	return string
		.replace(/&/g, '&amp;')
		.replace(/>/g, '&gt;')
		.replace(/</g, '&lt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/`/g, '&#96;');
}