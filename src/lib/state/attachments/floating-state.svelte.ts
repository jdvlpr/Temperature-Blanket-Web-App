//TODO: This is unnecessary at the moment--consider removing it.

import {
  computePosition,
  autoUpdate,
  flip,
  offset,
  shift,
  arrow,
  type Placement,
} from '@floating-ui/dom';
import { createAttachmentKey } from 'svelte/attachments';

interface PopoverOptions {
  interaction?: ('click' | 'hover')[] | 'click' | 'hover';
  placement?: Placement;
}

// InteractivePopover: a variant that keeps the floating/popover interactive
// while providing delayed-close logic so users can move from trigger -> popover
export class InteractivePopover {
  private options: PopoverOptions = {
    interaction: 'hover',
    placement: 'bottom',
  };
  private open = $state(false);
  private referenceElement: HTMLElement | undefined = $state();
  private floatingElement: HTMLElement | undefined = $state();
  private arrowElement: HTMLElement | undefined = $state();
  private closeTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(options?: PopoverOptions) {
    if (options) this.options = { ...this.options, ...options };
    $effect(() => {
      if (!this.referenceElement || !this.floatingElement) return;
      return autoUpdate(
        this.referenceElement,
        this.floatingElement,
        this.#updatePosition,
      );
    });
  }

  reference() {
    const attrs: Record<string, any> = {
      [createAttachmentKey()]: (node: HTMLElement) => {
        this.referenceElement = node;
      },
      onclick: () => {},
      onmouseover: () => {},
      onmouseout: () => {},
    };

    const interactions = Array.isArray(this.options.interaction)
      ? this.options.interaction
      : [this.options.interaction];

    if (interactions.includes('click')) {
      attrs['onclick'] = () => {
        // Toggle open and cancel any pending close
        this.open = !this.open;
        if (this.closeTimeout) clearTimeout(this.closeTimeout);
      };
    }

    if (interactions.includes('hover')) {
      attrs['onmouseover'] = () => {
        // Entering reference should open and cancel any pending close
        this.open = true;
        if (this.closeTimeout) clearTimeout(this.closeTimeout);
      };

      attrs['onmouseout'] = () => {
        // Delay closing to allow quick movements into the floating element
        this.closeTimeout = setTimeout(() => {
          this.open = false;
        }, 150);
      };
    }

    return attrs;
  }

  floating() {
    return {
      [createAttachmentKey()]: (node: HTMLElement) => {
        this.floatingElement = node;

        // In interactive mode we keep the popover open while hovering it.
        const interactions = Array.isArray(this.options.interaction)
          ? this.options.interaction
          : [this.options.interaction];

        if (interactions.includes('hover')) {
          node.addEventListener('mouseenter', () => {
            if (this.closeTimeout) clearTimeout(this.closeTimeout);
            this.open = true;
          });
          node.addEventListener('mouseleave', () => {
            // Mirror the delayed close used on the reference
            this.closeTimeout = setTimeout(() => {
              this.open = false;
            }, 150);
          });
        }
      },
    };
  }

  // Arrow attachment same as PopoverInstance
  arrow() {
    return {
      [createAttachmentKey()]: (node: HTMLElement) => {
        this.arrowElement = node;
        this.arrowElement.classList.add('popover-arrow');
      },
    };
  }

  isOpen() {
    return this.open;
  }

  #updatePosition = async () => {
    if (!this.referenceElement || !this.floatingElement) return;

    const position = await computePosition(
      this.referenceElement,
      this.floatingElement,
      {
        placement: this.options.placement,
        middleware: [
          offset(8),
          flip(),
          shift({ padding: 4 }),
          this.arrowElement
            ? arrow({ element: this.arrowElement, padding: 4 })
            : undefined,
        ].filter(Boolean),
      },
    );

    const { x, y, middlewareData, placement } = position as any;

    Object.assign(this.floatingElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    const staticSideMap = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    } as const;
    const basePlacement = (placement as string).split(
      '-',
    )[0] as keyof typeof staticSideMap;
    const staticSide = staticSideMap[basePlacement];

    if (this.arrowElement && middlewareData && middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow as {
        x?: number;
        y?: number;
      };

      Object.assign(this.arrowElement.style, {
        left: arrowX != null ? `${arrowX}px` : '',
        top: arrowY != null ? `${arrowY}px` : '',
        right: '',
        bottom: '',
        [staticSide]: '-4px',
      });
    }
  };
}

export class PopoverInstance {
  private options: PopoverOptions = {
    interaction: 'hover',
    placement: 'bottom',
  };
  private open = $state(false);
  private referenceElement: HTMLElement | undefined = $state();
  private floatingElement: HTMLElement | undefined = $state();
  private arrowElement: HTMLElement | undefined = $state();

  constructor(options?: PopoverOptions) {
    if (options) this.options = { ...this.options, ...options };
    $effect(() => {
      if (!this.referenceElement || !this.floatingElement) return;
      return autoUpdate(
        this.referenceElement,
        this.floatingElement,
        this.#updatePosition,
      );
    });
  }

  reference() {
    const attrs = {
      [createAttachmentKey()]: (node: HTMLElement) => {
        this.referenceElement = node;
      },
      onclick: () => {},
      onmouseover: () => {},
      onmouseout: () => {},
    };
    // Normalize interaction to an array so `.includes` is safe
    const interactions = Array.isArray(this.options.interaction)
      ? this.options.interaction
      : [this.options.interaction];

    // If click interaction
    if (interactions.includes('click')) {
      attrs['onclick'] = () => {
        this.open = !this.open;
      };
    }
    // If hover interaction
    if (interactions.includes('hover')) {
      attrs['onmouseover'] = () => {
        this.open = true;
      };
      attrs['onmouseout'] = () => {
        this.open = false;
      };
    }
    return attrs;
  }

  floating() {
    return {
      [createAttachmentKey()]: (node: HTMLElement) => {
        this.floatingElement = node;
      },
    };
  }

  // Attach an arrow element (a small square rotated 45deg is common) inside
  // the floating element. Usage in Svelte: `<div {...popover.arrow()}/>`.
  arrow() {
    return {
      [createAttachmentKey()]: (node: HTMLElement) => {
        this.arrowElement = node;
        this.arrowElement.classList.add('popover-arrow');
      },
    };
  }

  isOpen() {
    return this.open;
  }

  #updatePosition = async () => {
    if (!this.referenceElement || !this.floatingElement) {
      return;
    }

    const position = await computePosition(
      this.referenceElement,
      this.floatingElement,
      {
        placement: this.options.placement,
        middleware: [
          offset(8),
          flip(),
          shift({
            padding: 4,
          }),
          // Include arrow middleware only when we have an arrow element
          this.arrowElement
            ? arrow({ element: this.arrowElement, padding: 4 })
            : undefined,
        ].filter(Boolean),
      },
    );

    const { x, y, middlewareData, placement } = position as any;

    Object.assign(this.floatingElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    const staticSide = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    }[placement.split('-')[0]];

    // Position the arrow element (if present). Floating UI returns `middlewareData.arrow`
    // with `x` and/or `y` depending on placement. We set left/top on the arrow.
    if (this.arrowElement && middlewareData && middlewareData.arrow) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow as {
        x?: number;
        y?: number;
      };

      Object.assign(this.arrowElement.style, {
        left: arrowX != null ? `${arrowX}px` : '',
        top: arrowY != null ? `${arrowY}px` : '',
        right: '',
        bottom: '',
        [staticSide]: '-4px',
      });
    }
  };
}
