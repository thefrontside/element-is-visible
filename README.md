# element-is-visible

Checks whether a DOM element is visible through various heuristics, such as
checking CSS properties, sizing and overflow. The code is extracted from the
[Selenium](https://github.com/SeleniumHQ/selenium) project.

In comparison to other stand-alone libraries which perform this function, the
alogrithm implemented by Selenium is much more comprehensive and checks more
edge cases. It is still a best guess as to whether an element really is
visible, for example an element with a very low opacity is counted as visible,
even though it probably cannot be seen by an actual human.

Supports JSDOM by skipping the layout and sizing based checks.

## Usage

``` typescript
import { isVisible } from 'element-is-visible';

let element = document.querySelector('#some-element');

isVisible(element) // => true
```

## License

Apache2, see separate LICENSE and NOTICE files.
