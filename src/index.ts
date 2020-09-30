// Code in this file was extraced from the Selenium project and subsequently
// substantially modified by Frontside. The code was originally distributed
// with the following licensing information attached:

// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

type OverflowState = 'hidden' | 'scroll' | 'none';

function isElement(node: Node): node is HTMLElement {
  return node.nodeType === 1;
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === 3;
}

function isDocument(node: Node): node is Document {
  return node.nodeType === 9;
}

function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.tagName === 'INPUT';
}

export function isVisible(elem: HTMLElement): boolean {
  let defaultView = elem.ownerDocument.defaultView;
  if(!defaultView) {
    throw new Error('cannot check visibility of non attached element');
  }
  let window = defaultView; // retype as non-null for use in closures
  let isJSDOM = window.navigator.userAgent.match(/jsdom/i);

  function getOpacity(elem: HTMLElement): number {
    // By default the element is opaque.
    let elemOpacity = 1;

    let opacityStyle = window.getComputedStyle(elem).opacity;
    if (opacityStyle) {
      elemOpacity = Number(opacityStyle);
    }

    // Let's apply the parent opacity to the element.
    let parentElement = elem.parentElement;
    if (parentElement) {
      elemOpacity = elemOpacity * getOpacity(parentElement);
    }
    return elemOpacity;
  }

  function getOverflowState(elem: HTMLElement): OverflowState {
    let region = elem.getBoundingClientRect();
    let ownerDoc = elem.ownerDocument;
    let htmlElem = ownerDoc.documentElement;
    let bodyElem = ownerDoc.body;
    let htmlOverflowStyle = window.getComputedStyle(htmlElem).overflow;
    let treatAsFixedPosition;

    // Return the closest ancestor that the given element may overflow.
    function getOverflowParent(e: HTMLElement) {
      let position = window.getComputedStyle(e).position;
      if (position == 'fixed') {
        treatAsFixedPosition = true;
        // Fixed-position element may only overflow the viewport.
        return e == htmlElem ? null : htmlElem;
      } else {
        let parent = e.parentElement;
        while (parent && !canBeOverflowed(parent)) {
          parent = parent.parentElement
        }
        return parent;
      }

      function canBeOverflowed(container: HTMLElement) {
        // The HTML element can always be overflowed.
        if (container == htmlElem) {
          return true;
        }
        // An element cannot overflow an element with an inline display style.
        let containerDisplay = window.getComputedStyle(container).display;
        if (containerDisplay.match(/^inline/)) {
          return false;
        }
        // An absolute-positioned element cannot overflow a static-positioned one.
        if (position == 'absolute' &&
            window.getComputedStyle(container).position == 'static') {
          return false;
        }
        return true;
      }
    }

    // Return the x and y overflow styles for the given element.
    function getOverflowStyles(e: HTMLElement) {
      // When the <html> element has an overflow style of 'visible', it assumes
      // the overflow style of the body, and the body is really overflow:visible.
      let overflowElem = e;
      if (htmlOverflowStyle == 'visible') {
        // Note: bodyElem will be null/undefined in SVG documents.
        if (e == htmlElem && bodyElem) {
          overflowElem = bodyElem;
        } else if (e == bodyElem) {
          return {x: 'visible', y: 'visible'};
        }
      }
      let overflow = {
        x: window.getComputedStyle(overflowElem).overflowX,
        y: window.getComputedStyle(overflowElem).overflowY,
      };
      // The <html> element cannot have a genuine 'visible' overflow style,
      // because the viewport can't expand; 'visible' is really 'auto'.
      if (e == htmlElem) {
        overflow.x = overflow.x == 'visible' ? 'auto' : overflow.x;
        overflow.y = overflow.y == 'visible' ? 'auto' : overflow.y;
      }
      return overflow;
    }

    // Returns the scroll offset of the given element.
    function getScroll(e: HTMLElement | HTMLDocument) {
      if (isDocument(e)) {
        return { x: e.defaultView?.pageXOffset || 0, y: e.defaultView?.pageYOffset || 0 };
      } else {
        return { x: e.scrollLeft, y: e.scrollTop };
      }
    }

    // Check if the element overflows any ancestor element.
    for (let container = getOverflowParent(elem);
         !!container;
         container = getOverflowParent(container)) {
      let containerOverflow = getOverflowStyles(container);

      // If the container has overflow:visible, the element cannot overflow it.
      if (containerOverflow.x == 'visible' && containerOverflow.y == 'visible') {
        continue;
      }

      let containerRect = container.getBoundingClientRect();

      // Zero-sized containers without overflow:visible hide all descendants.
      if (containerRect.width == 0 || containerRect.height == 0) {
        return 'hidden';
      }

      // Check "underflow": if an element is to the left or above the container
      let underflowsX = region.right < containerRect.left;
      let underflowsY = region.bottom < containerRect.top;
      if ((underflowsX && containerOverflow.x == 'hidden') ||
          (underflowsY && containerOverflow.y == 'hidden')) {
        return 'hidden';
      } else if ((underflowsX && containerOverflow.x != 'visible') ||
                 (underflowsY && containerOverflow.y != 'visible')) {
        // When the element is positioned to the left or above a container, we
        // have to distinguish between the element being completely outside the
        // container and merely scrolled out of view within the container.
        let containerScroll = getScroll(container);
        let unscrollableX = region.right < containerRect.left - containerScroll.x;
        let unscrollableY = region.bottom < containerRect.top - containerScroll.y;
        if ((unscrollableX && containerOverflow.x != 'visible') ||
            (unscrollableY && containerOverflow.x != 'visible')) {
          return 'hidden';
        }
        let containerState = getOverflowState(container);
        return containerState == 'hidden' ?
            'hidden' : 'scroll';
      }

      // Check "overflow": if an element is to the right or below a container
      let overflowsX = region.left >= containerRect.left + containerRect.width;
      let overflowsY = region.top >= containerRect.top + containerRect.height;
      if ((overflowsX && containerOverflow.x == 'hidden') ||
          (overflowsY && containerOverflow.y == 'hidden')) {
        return 'hidden';
      } else if ((overflowsX && containerOverflow.x != 'visible') ||
                 (overflowsY && containerOverflow.y != 'visible')) {
        // If the element has fixed position and falls outside the scrollable area
        // of the document, then it is hidden.
        if (treatAsFixedPosition) {
          let docScroll = getScroll(container);
          if ((region.left >= htmlElem.scrollWidth - docScroll.x) ||
              (region.right >= htmlElem.scrollHeight - docScroll.y)) {
            return 'hidden';
          }
        }
        // If the element can be scrolled into view of the parent, it has a scroll
        // state; unless the parent itself is entirely hidden by overflow, in
        // which it is also hidden by overflow.
        let containerState = getOverflowState(container);
        return containerState == 'hidden' ?
            'hidden' : 'scroll';
      }
    }

    // Does not overflow any ancestor.
    return 'none';
  }

  function isDisplayed(e: HTMLElement): boolean {
    if (window.getComputedStyle(e).display == 'none') {
      return false;
    }
    let parent = e.parentElement;
    return !parent || isDisplayed(parent);
  };

  function isVisibleInner(elem: HTMLElement, ignoreOpacity = false): boolean {
    // By convention, BODY element is always shown: BODY represents the document
    // and even if there's nothing rendered in there, user can always see there's
    // the document.
    if (elem.tagName === 'BODY') {
      return true;
    }

    // Option or optgroup is shown iff enclosing select is shown (ignoring the
    // select's opacity).
    if (elem.tagName === 'OPTION' ||
        elem.tagName === 'OPTGROUP') {
      let select = elem.closest('select');
      return !!select && isVisibleInner(select, true);
    }

    // Any hidden input is not shown.
    if(isInputElement(elem) && elem.type.toLowerCase() == 'hidden') {
      return false;
    }

    // Any NOSCRIPT element is not shown.
    if (elem.tagName === 'NOSCRIPT') {
      return false;
    }

    // Any element with hidden/collapsed visibility is not shown.
    let visibility = window.getComputedStyle(elem).visibility;
    if (visibility == 'collapse' || visibility == 'hidden') {
      return false;
    }

    if (!isDisplayed(elem)) {
      return false;
    }

    // Any transparent element is not shown.
    if (!ignoreOpacity && getOpacity(elem) == 0) {
      return false;
    }

    // Any element without positive size dimensions is not shown.
    function positiveSize(e: HTMLElement): boolean {
      let rect = e.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) {
        return true;
      }
      // Zero-sized elements should still be considered to have positive size
      // if they have a child element or text node with positive size, unless
      // the element has an 'overflow' style of 'hidden'.
      return window.getComputedStyle(e).overflow != 'hidden' &&
          Array.from(e.childNodes).some((n: Node) => {
            return isTextNode(n) || (isElement(n) && positiveSize(n));
          });
    }
    if (!isJSDOM && !positiveSize(elem)) {
      return false;
    }

    // Elements that are hidden by overflow are not shown.
    function hiddenByOverflow(e: HTMLElement): boolean {
      return getOverflowState(e) == 'hidden' &&
          Array.from(e.childNodes).every(function(n: Node) {
            return !isElement(n) || hiddenByOverflow(n) ||
                   !positiveSize(n);
          });
    }
    if (!isJSDOM && hiddenByOverflow(elem)) {
      return false;
    }

    return true;
  }

  return isVisibleInner(elem);
}
