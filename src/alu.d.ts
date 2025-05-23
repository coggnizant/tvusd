export declare global {
  // Hacky way to not have to cast the "event" type that lib.dom has to CustomEvent, which is what we actually use.
  interface Document {
    addEventListener(type: "setting-tabLoad", listener: (this: Document, ev: CustomEvent) => any, options?: boolean | AddEventListenerOptions);
  }

  namespace Pyrus {
    let store: PyrusStore;
    let eventList: Record<string, EventListener>;
    let settings: {
      loadedContentStorage: Record<string, string>;
      currentTab: string;
    };

    type DefaultKeys = {
      [key: string]: Key;
    };

    type Key = Record<string, string | KeyObj>;

    type KeyObj = {
      name: string;
      value?: string;
      icon?: string;
      isCustom?: boolean;
    };
    type ValidStoreKeys = "proxy" | "search" | "openpage" | "wisp" | "bareUrl" | "transport" | "theme" | "lang" | "cloak";
  }
}
