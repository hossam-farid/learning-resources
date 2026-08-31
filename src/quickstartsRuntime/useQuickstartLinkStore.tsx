import React, { useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

function registerQuickstartLinkClickListener() {
  function listener(event: Event) {
    const { state } = event as unknown as {
      state?: { quickstartLink?: boolean };
    };
    const isQuickstartLink = state?.quickstartLink;
    if (isQuickstartLink) {
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  window.addEventListener('replacestate', listener);
  return () => {
    window.removeEventListener('replacestate', listener);
  };
}

function useQuickstartLinkStore() {
  const store = useMemo(() => new Map<string, HTMLAnchorElement>(), []);

  function addLinkElement(id: string) {
    let iterations = 0;
    setTimeout(() => {
      const findInterval = setInterval(() => {
        const element = document.getElementById(id);
        if (element) {
          store.set(id, element as HTMLAnchorElement);
          element.addEventListener('click', (e) => {
            const { href } = element as HTMLAnchorElement;
            if (!href) {
              return;
            }
            e.preventDefault();
            window.history.replaceState(
              {
                quickstartLink: true,
              },
              '',
              href
            );
          });
          clearInterval(findInterval);
        }
        iterations += 1;
        if (iterations > 5) {
          clearInterval(findInterval);
        }
      }, 1000);
    });
  }

  function emptyElements() {
    store.clear();
  }
  useEffect(() => {
    const unregister = registerQuickstartLinkClickListener();
    return () => {
      unregister();
      emptyElements();
    };
  }, []);

  return {
    addLinkElement,
    emptyElements,
  };
}

export function createQuickstartLinkMarkupExtension(
  quickstartLinkStore: ReturnType<typeof useQuickstartLinkStore>
) {
  return {
    type: 'lang',
    regex: /\[.*\]\(.*\)/g,
    replace: (text: string) => {
      try {
        let [linkText, linkURL] = text.split('](');
        linkText = linkText.replace(/^\[/, '');
        linkURL = linkURL.replace(/\)$/, '');
        let href: string;
        try {
          const fullURL = new URL(linkURL);
          href = fullURL.toString();
          if (fullURL.origin !== window.location.origin) {
            return text;
          }
        } catch {
          href = linkURL;
        }
        const linkId = crypto.randomUUID();
        quickstartLinkStore.addLinkElement(linkId);
        const node = (
          <a id={linkId} href={href}>
            {linkText}
          </a>
        );
        return renderToStaticMarkup(node);
      } catch (e) {
        console.error('Error creating quickstart link markup', e);
        return text;
      }
    },
  };
}

export default useQuickstartLinkStore;
