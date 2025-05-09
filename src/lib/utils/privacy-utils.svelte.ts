// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import { browser } from '$app/environment';
import { consentToMSClarityCookies, localState, toast } from '$lib/state';

export const privacy = {
  get_cookie: function (name) {
    return document.cookie.split(';').some((c) => {
      return c.trim().startsWith(name + '=');
    });
  },
  delete_cookie: function (name, path, domain) {
    if (this.get_cookie(name)) {
      document.cookie =
        name +
        '=' +
        (path ? ';path=' + path : '') +
        (domain ? ';domain=' + domain : '') +
        ';expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  },
  init: function () {
    if (!browser) return;

    // Event listener for when consent is given to Microsoft Clarity
    // If consent is given, it sets the `consentToMSClarityCookies` store to true
    window.addEventListener('consentToMSClarity', () => {
      consentToMSClarityCookies.value = true;
    });

    window.addEventListener('removeConsentToMSClarity', () => {
      if (typeof window.clarity === 'function')
        window.clarity('consent', false);
      let domain = window.location.hostname;
      domain = domain.includes('www')
        ? domain.substring(domain.indexOf('.'))
        : domain;
      privacy.delete_cookie('_clck', '/', domain);
      privacy.delete_cookie('_clsk', '/', domain);

      consentToMSClarityCookies.value = false;
    });

    window.addEventListener('analyticsUnableToLoad', () => {
      setTimeout(function () {
        // code to execute after 200 milliseconds
        toast.trigger({
          message:
            'Unable to load analytics. Your browser or a plugin might be blocking it.',
          category: 'error',
        });
      }, 1000);
    });

    // Check if already consented (cookie exists), and if not, show the consent popup
    // Microsoft Clarity Cookie Names include '_clck' and '_clsk'
    // See https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-list
    if (!this.get_cookie('_clck') || !this.get_cookie('_clsk')) {
      if (!localState.value.disableToastAnalytics) {
        toast.trigger({
          message: `
      <div class="flex flex-col gap-2 justify-start items-start">
          <label class="relative inline-flex items-center cursor-pointer gap-2">
            <div class="relative">
              <input type="checkbox" id="clarity-consent-toggle" class="sr-only peer" checked> 
              <div class="shrink-0 w-11 h-6 bg-surface-300-600-token peer-disabled:bg-surface-500 dark:peer-disabled:bg-secondary-900 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-tertiary-200 dark:peer-focus:ring-tertiary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-50-950 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-50 after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-surface-600 peer-checked:bg-primary-900 dark:peer-checked:bg-primary-600"></div> 
            </div>
            
            <span class="font-bold">Allow Analytics</span>
          </label> 
          
          
          <p class="text-sm">
            If you accept, cookies will be stored in your browser to help analyze and improve this site's performance and features, in addition to the required site cookies. Learn more and change your selection on the <a href="/privacy" class="link">Privacy Policy</a> page.
          </p>
          
          <label class="flex justify-center items-center gap-1 text-sm w-fit">
          <input type="checkbox" id="cookies-dont-show-again" class="checkbox shrink-0 size-6 border-2" />
          <p>Don't show this message again</p>
          </label>
      </div>
      `,
          hideDismiss: true,
          classes: 'flex max-sm:flex-col max-sm:gap-2 max-sm:items-end',
          background: 'bg-surface-50 dark:bg-surface-950',
          timeout: 31556952000, // one year
          action: {
            label: 'Save',
            response: () => {},
          },
          callback: (response) => {
            if (response.status !== 'closed') return;
            const dontShowAgainElement = document.getElementById(
              'cookies-dont-show-again',
            );
            if (dontShowAgainElement?.checked)
              localState.value.disableToastAnalytics = true;
            else localState.value.disableToastAnalytics = false;

            const consentToggleElement = document.getElementById(
              'clarity-consent-toggle',
            );

            let consentEvent;
            if (consentToggleElement?.checked)
              consentEvent = new CustomEvent('consentToMSClarity');
            else consentEvent = new CustomEvent('removeConsentToMSClarity');
            window.dispatchEvent(consentEvent);
          },
        });
      }
    } else {
      consentToMSClarityCookies.value = true;
    }
  },
};
