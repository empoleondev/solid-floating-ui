// import {
//   Accessor,
//   JSX,
//   createContext,
//   createEffect,
//   createSignal,
//   onCleanup,
//   useContext,
// } from 'solid-js';

// import { getDelay } from '../hooks/use-hover';
// import type { FloatingContext } from '../hooks/use-floating';

// type Delay = number | Partial<{ open: number; close: number }>;

// interface GroupState {
//   delay: Delay;
//   initialDelay: Delay;
//   currentId: string | null;
//   timeoutMs: number;
//   isInstantPhase: boolean;
// }

// interface GroupContext extends GroupState {
//   setState: (partial: Partial<GroupState>) => void;
//   setCurrentId: (id: string | null) => void;
// }

// const FloatingDelayGroupContext = createContext<GroupContext>({
//   delay: 0,
//   initialDelay: 0,
//   currentId: null,
//   timeoutMs: 0,
//   isInstantPhase: false,
//   setState: () => undefined,
//   setCurrentId: () => undefined,
// });

// export const useDelayGroupContext = () => useContext(FloatingDelayGroupContext);

// export interface FloatingDelayGroupProps {
//   children?: JSX.Element;
//   delay: Delay;
//   timeoutMs?: number;
// }

// export const FloatingDelayGroup = (props: FloatingDelayGroupProps): JSX.Element => {
//   const initial = props.delay;
//   const [delay, setDelay] = createSignal<Delay>(initial);
//   const [initialDelay] = createSignal<Delay>(initial);
//   const [currentId, setCurrentIdSignal] = createSignal<string | null>(null);
//   const [isInstantPhase, setIsInstantPhase] = createSignal(false);

//   let resetTimeoutId: number | null = null;

//   const scheduleReset = () => {
//     if (resetTimeoutId != null) {
//       clearTimeout(resetTimeoutId);
//       resetTimeoutId = null;
//     }

//     const ms = props.timeoutMs ?? 600;
//     if (ms > 0) {
//       resetTimeoutId = window.setTimeout(() => {
//         if (currentId() === null) {
//           setDelay(initialDelay());
//           setIsInstantPhase(false);
//         }
//         resetTimeoutId = null;
//       }, ms);
//     } else {
//       setDelay(initialDelay());
//       setIsInstantPhase(false);
//     }
//   };

//   const setState = (partial: Partial<GroupState>) => {
//     if (partial.delay !== undefined) {
//       setDelay(partial.delay as Delay);
//     }
//     if (partial.currentId !== undefined) {
//       setCurrentId(partial.currentId as string | null);
//     }
//     if (partial.timeoutMs !== undefined) {
//       // no signal for timeoutMs; it's taken from props but we allow callers to mimic changes by scheduling reset
//       // (most callers don't need to change timeoutMs at runtime)
//     }
//     if (partial.isInstantPhase !== undefined) {
//       setIsInstantPhase(Boolean(partial.isInstantPhase));
//     }
//   };

//   const setCurrentId = (id: string | null) => {
//     if (resetTimeoutId != null) {
//       clearTimeout(resetTimeoutId);
//       resetTimeoutId = null;
//     }

//     const prev = currentId();
//     setCurrentIdSignal(id);

//     if (id !== null) {
//       if (!isInstantPhase()) {
//         setIsInstantPhase(true);

//         const instantDelay = {
//           open: 0,
//           close: getDelay(initialDelay(), 'close'),
//         } as Delay;
//         setDelay(instantDelay);
//       }
//     } else {
//       scheduleReset();
//     }
//   };

//   onCleanup(() => {
//     if (resetTimeoutId != null) {
//       clearTimeout(resetTimeoutId);
//       resetTimeoutId = null;
//     }
//   });

//   const context: GroupContext = {
//     get delay() { return delay(); },
//     get initialDelay() { return initialDelay(); },
//     get currentId() { return currentId(); },
//     get timeoutMs() { return props.timeoutMs ?? 600; },
//     get isInstantPhase() { return isInstantPhase(); },
//     setState,
//     setCurrentId,
//   };

//   return (
//     <FloatingDelayGroupContext.Provider value={context}>
//       {props.children}
//     </FloatingDelayGroupContext.Provider>
//   );
// };

// export const useDelayGroup = (
//   floatingContext: Accessor<FloatingContext>,
//   options: { id: string }
// ) => {
//   const group = useDelayGroupContext();
//   let wasOpen = false;

//   createEffect(() => {
//     const ctx = floatingContext();
//     const isOpen = !!ctx.open;

//     if (isOpen && !wasOpen) {
//       if (group.currentId !== options.id) {
//         group.setCurrentId(options.id);
//       }
//     }

//     if (!isOpen && wasOpen) {
//       if (group.currentId === options.id) {
//         group.setCurrentId(null);
//       }
//     }

//     wasOpen = isOpen;
//   });

//   return group;
// };

import {
  Accessor,
  JSX,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js';

import { getDelay } from '../hooks/use-hover';
import type { FloatingContext } from '../hooks/use-floating';

type Delay = number | Partial<{ open: number; close: number }>;

interface GroupState {
  delay: Delay;
  initialDelay: Delay;
  currentId: string | null;
  timeoutMs: number;
  isInstantPhase: boolean;
}

interface GroupContext extends GroupState {
  setState: (partial: Partial<GroupState>) => void;
  setCurrentId: (id: string | null) => void;
}

const FloatingDelayGroupContext = createContext<GroupContext>({
  delay: 0,
  initialDelay: 0,
  currentId: null,
  timeoutMs: 0,
  isInstantPhase: false,
  setState: () => undefined,
  setCurrentId: () => undefined,
});

export const useDelayGroupContext = () => useContext(FloatingDelayGroupContext);

export interface FloatingDelayGroupProps {
  children?: JSX.Element;
  delay: Delay;
  timeoutMs?: number;
}

export const FloatingDelayGroup = (props: FloatingDelayGroupProps): JSX.Element => {
  const initial = props.delay;
  const [delay, setDelay] = createSignal<Delay>(initial);
  const [initialDelay] = createSignal<Delay>(initial);
  const [currentId, setCurrentIdSignal] = createSignal<string | null>(null);
  const [isInstantPhase, setIsInstantPhase] = createSignal(false);

  let resetTimeoutId: number | null = null;

  const scheduleReset = () => {
    if (resetTimeoutId != null) {
      clearTimeout(resetTimeoutId);
      resetTimeoutId = null;
    }

    const ms = props.timeoutMs ?? 600;
    if (ms > 0) {
      resetTimeoutId = window.setTimeout(() => {
        if (currentId() === null) {
          setDelay(initialDelay());
          setIsInstantPhase(false);
        }
        resetTimeoutId = null;
      }, ms);
    } else {
      setDelay(initialDelay());
      setIsInstantPhase(false);
    }
  };

  const setState = (partial: Partial<GroupState>) => {
    if (partial.delay !== undefined) {
      setDelay(partial.delay as Delay);
    }
    if (partial.currentId !== undefined) {
      setCurrentId(partial.currentId as string | null);
    }
    if (partial.timeoutMs !== undefined) {
      // no signal for timeoutMs; it's taken from props but we allow callers to mimic changes by scheduling reset
      // (most callers don't need to change timeoutMs at runtime)
    }
    if (partial.isInstantPhase !== undefined) {
      setIsInstantPhase(Boolean(partial.isInstantPhase));
    }
  };

  const setCurrentId = (id: string | null) => {
    
    if (resetTimeoutId != null) {
      clearTimeout(resetTimeoutId);
      resetTimeoutId = null;
    }

    const prev = currentId();
    setCurrentIdSignal(id);

    if (id !== null) {
      if (!isInstantPhase()) {
        setIsInstantPhase(true);

        const instantDelay = {
          open: 0,
          close: getDelay(initialDelay(), 'close'),
        } as Delay;
        setDelay(instantDelay);
      }
    } else {
      scheduleReset();
    }
  };

  onCleanup(() => {
    if (resetTimeoutId != null) {
      clearTimeout(resetTimeoutId);
      resetTimeoutId = null;
    }
  });

  const context: GroupContext = {
    get delay() { return delay(); },
    get initialDelay() { return initialDelay(); },
    get currentId() { return currentId(); },
    get timeoutMs() { return props.timeoutMs ?? 600; },
    get isInstantPhase() { return isInstantPhase(); },
    setState,
    setCurrentId,
  };

  return (
    <FloatingDelayGroupContext.Provider value={context}>
      {props.children}
    </FloatingDelayGroupContext.Provider>
  );
};

export const useDelayGroup = (
  floatingContext: Accessor<FloatingContext>,
  options: { id: string }
) => {
  const group = useDelayGroupContext();
  let wasOpen = false;

  createEffect(() => {
    const ctx = floatingContext();
    const isOpen = !!ctx.open;

    if (isOpen && !wasOpen) {
      if (group.currentId !== options.id) {
        group.setCurrentId(options.id);
      }
    }

    if (!isOpen && wasOpen) {
      if (group.currentId === options.id) {
        group.setCurrentId(null);
      }
    }

    wasOpen = isOpen;
  });

  // Create a reactive effect that closes this tooltip when another becomes current
  createEffect(() => {
    const ctx = floatingContext();
    const currentId = group.currentId;
    
    // If this tooltip is open but another tooltip is now the current one, close this one
    if (ctx.open && currentId !== options.id && currentId !== null) {
      ctx.onOpenChange(false, undefined, "hover");
    }
  });

  return group;
};