# element-is-visible

Checks whether a DOM element is visible through various heuristics, such as
checking CSS properties, sizing and overflow. The code is extracted from the
[Selenium](https://github.com/SeleniumHQ/selenium) project.

## Usage

``` typescript
import { isVisible } from 'element-is-visible';

let element = document.querySelector('#some-element');

isVisible(element) // => true
```

## License

Apache2, see separate LICENSE and NOTICE files.
