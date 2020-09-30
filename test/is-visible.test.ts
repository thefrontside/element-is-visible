import { test } from '@bigtest/suite';
import { createInteractor, App } from '@bigtest/interactor';
import { isVisible } from '../src/index';

const Target = createInteractor<HTMLElement>('target')({
  selector: '*[data-target]',
  defaultLocator: (element) => element.dataset.target,
  filters: {
    visible: isVisible
  }
});

export default test('isVisible')
  .step(App.visit('index.html'))

  .assertion(Target('regular-field').is({ visible: true }))
  .assertion(Target('hidden-field').is({ visible: false }))
  .assertion(Target('noscript').is({ visible: false }))

  .assertion(Target('display-none').is({ visible: false }))
  .assertion(Target('display-none-parent').is({ visible: false }))

  .assertion(Target('visibility-hidden').is({ visible: false }))
  .assertion(Target('visibility-collapse').is({ visible: false }))

  .assertion(Target('semi-opaque').is({ visible: true }))
  .assertion(Target('transparent').is({ visible: false }))
  .assertion(Target('transparent-parent').is({ visible: false }))

  .assertion(Target('empty').is({ visible: false }))
  .assertion(Target('with-text-content').is({ visible: true }))
  .assertion(Target('with-child-text-content').is({ visible: true }))
  .assertion(Target('with-fixed-size').is({ visible: true }))

  .assertion(Target('overflow-visible').is({ visible: true }))
  .assertion(Target('overflow-hidden').is({ visible: false }))
  .assertion(Target('overflow-hidden-child').is({ visible: false }))
