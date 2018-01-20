# HTMLTemplateLiteral

A tag function for producing HTML via template literals

## Install

```
npm install html-template-literal
```

## Import

```
import {html} from "html-template-literal";
```

## Examples of Features

### Automatically escapes HTML entities in substitutions

If you do this:

```javascript
const userSuppliedString = '<script>alert("Do something evil!");</script>';

html `<p>${userSuppliedString}</p>`.appendTo(document.body);
```

You will get this:

```html
<body>
	<p>&lt;script&gt;alert(&quot;Do something evil!&quot;);&lt;/script&gt;</p>
</body>
```

### Automatically handles iterable substitutions

If you do this:

```javascript
function *generate() {
	yield "Here ";
	yield html `<strong>be</strong>`;
	yield "dragons!";
}

html `<p>${generate()}</p>`.appendTo(document.body);
```

You will get this:

```html
<body>
	<p>Here <strong>be</strong> dragons!</p>
</body>
```

### Automatically handles functions as substitutions

If you do this:

```javascript
html `<button onclick=${() => alert("You clicked me")}>Click Me</button>`.appendTo(document.body);
```

You will get this:

```html
<body>
	<button onclick="return handleEvent(2, this, event)">Click Me</button>
</body>
```

### Automatically handles promises as substitutions

If you do this:

```javascript
const ip = fetch("http://ip.jsontest.com/");
html `<p>Your IP is ${ip}</p>`.appendTo(document.body);
```

You will see this until the response is received:

```html
<body>
	<p>Your IP is <template data-promise-placeholder="1"></template></p>
</body>
```

Then you will see this:

```html
<body>
	<p>Your IP is 8.8.8.8</p>
</body>
```

### Automatically handles elements as substitutions

If you do this:

```javascript
const element = document.createElement("strong");
element.innerText = "be";
html `<p>Here ${element} dragons!</p>`.appendTo(document.body);
```

You will get this:

```html
<body>
	<p>Here <strong>be</strong> dragons!</p>
</body>
```

### If you really know what you are doing, you can bypass the escaping of HTML entities

If you do this:

```javascript
import {html, unsafe} from "html-template-literal";
const dangerious = unsafe("Here <string>be</strong> dragons!");
html `<p>${dangerious}</p>`.appendTo(document.body);
```

You will get this:

```html
<body>
	<p>Here <strong>be</strong> dragons!</p>
</body>
```
