import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingDelayGroup as SolidFloatingDelayGroup,
  useDelayGroup,
} from 'solid-floating-ui';
import { createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';

import "./styles/useDelayGroup.css"

export default { title: 'All/UseDelayGroup' };

export function UseDelayGroup() {
    return (
    <div class="container">
      <h1 class="title">
        FloatingDelayGroup Test
      </h1>

      <div class="content">
        <p class="text">
          Hover over the buttons below. Notice how after hovering on one button,
          the subsequent tooltips appear immediately without delay when you move
          between them quickly.
        </p>

        <SolidFloatingDelayGroup delay={{ open: 1000, close: 200 }}>
          <div class="button-group">
            <Tooltip content="This is the first tooltip with some helpful information">
              <button class="btn btn-blue">
                Hover me first
              </button>
            </Tooltip>

            <Tooltip content="Second tooltip appears faster after the first one">
              <button class="btn btn-green">
                Then hover me
              </button>
            </Tooltip>

            <Tooltip content="Third tooltip also benefits from the delay group">
              <button class="btn btn-purple">
                And me too
              </button>
            </Tooltip>

            <Tooltip content="All tooltips in this group share the same delay behavior">
              <button class="btn btn-red">
                Finally me
              </button>
            </Tooltip>
          </div>
          <div class="comparison-section">
            <h2 class="subtitle">
              Comparison: Tooltips Outside Delay Group
            </h2>
            <p class="text">
              These tooltips below are not in a delay group, so each one has the full delay:
            </p>

            <div class="button-group">
              <Tooltip content="This tooltip always has the full delay" useDelayGroup={false}>
                <button class="btn btn-gray">
                  Independent tooltip 1
                </button>
              </Tooltip>

              <Tooltip content="This one also has the full delay every time" useDelayGroup={false}>
                <button class="btn btn-gray">
                  Independent tooltip 2
                </button>
              </Tooltip>
            </div>
          </div>
        </SolidFloatingDelayGroup>
      </div>

      <div class="info-box">
        <h3 class="info-title">How it works:</h3>
        <ul class="info-list">
          <li>• The FloatingDelayGroup coordinates timing across multiple floating elements</li>
          <li>• First hover has a 1000ms delay to open</li>
          <li>• Subsequent hovers within the group open immediately</li>
          <li>• After 200ms of not hovering any element, the group resets</li>
          <li>• Each tooltip uses useDelayGroup() to participate in the group</li>
        </ul>
      </div>
    </div>
  );
}

function Tooltip({ children, content, useDelayGroup: shouldUseDelayGroup = true }: any) {
  const [isOpen, setIsOpen] = createSignal(false);

  const [reference, setReference] = createSignal(null);
  const [floating, setFloating] = createSignal(null);

  const floatingState = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(5), flip(), shift()],
    whileElementsMounted: autoUpdate,
    elements: {
      get reference() { return reference(); },
      get floating() { return floating(); }
    }
  });

  const groupContext = shouldUseDelayGroup ? useDelayGroup(() => floatingState.context, { id: content }) : null;

  const hover = useHover(() => floatingState.context, () => ({
    move: false,
    delay: groupContext?.delay || { open: 1000, close: 200 },
  }));
  const focus = useFocus(floatingState.context);
  const dismiss = useDismiss(() => floatingState.context);
  const role = useRole(floatingState.context, { role: 'tooltip' });

  const interactions = useInteractions([
    hover(),
    focus(),
    dismiss,
    role(),
  ]);

  return (
    <>
      <div
        ref={setReference}
        {...interactions.getReferenceProps()}
        class="tooltip-wrapper"
      >
        {children}
      </div>
      {isOpen() && (
        <Portal>
          <div
            ref={setFloating}
            style={floatingState.floatingStyles}
            {...interactions.getFloatingProps()}
            class="tooltip"
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}