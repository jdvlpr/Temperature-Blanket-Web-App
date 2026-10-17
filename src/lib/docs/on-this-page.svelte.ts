// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// A Guides & Help page's sections, for On this page (beside the page, in the
// Contents sheet, and in the current-section bar on smaller screens), and
// the one being read. Collected from the page's own h2 and h3 headings, so
// pages need nothing extra: a heading's id, or else its section's.

import type { Attachment } from 'svelte/attachments';

export type Section = { id: string; text: string; level: 2 | 3 };

class OnThisPage {
  sections = $state<Section[]>([]);
  /** The section being read: the last heading above the top bars */
  current = $state<string | null>(null);
  /** How far down the page the top bars reach, in px */
  offset = 0;

  currentSection = $derived(
    this.sections.find((section) => section.id === this.current),
  );
}

export const onThisPage = new OnThisPage();

const HEADINGS = 'h2, h3';

/** On the element holding a page's content: its sections, and which is read */
export function trackSections(): Attachment<HTMLElement> {
  return (node) => {
    let headings: HTMLElement[] = [];

    function collect() {
      headings = [...node.querySelectorAll<HTMLElement>(HEADINGS)].filter(
        (heading) =>
          !heading.closest('[data-on-this-page-ignore]') &&
          (heading.id || heading.parentElement?.closest('[id]')),
      );
      onThisPage.sections = headings.map((heading) => ({
        id: sectionId(heading),
        text: heading.textContent?.trim() ?? '',
        level: heading.tagName === 'H3' ? 3 : 2,
      }));
      update();
    }

    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2;
        let current: HTMLElement | undefined;
        if (atBottom) current = headings.at(-1);
        else
          for (const heading of headings) {
            if (heading.getBoundingClientRect().top > onThisPage.offset + 8)
              break;
            current = heading;
          }
        onThisPage.current = current ? sectionId(current) : null;
      });
    }

    collect();
    // The content changes as pages are navigated within the same layout
    const observer = new MutationObserver(collect);
    observer.observe(node, { childList: true, subtree: true });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      onThisPage.sections = [];
      onThisPage.current = null;
    };
  };
}

function sectionId(heading: HTMLElement) {
  return heading.id || heading.parentElement?.closest('[id]')?.id || '';
}
