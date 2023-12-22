import { RenderOptions } from "../render";

const svgNS = "http://www.w3.org/2000/svg";
const xlinkNS = "http://www.w3.org/1999/xlink";

function normalizeCls(clsValue: any) {
  let classArray: string[] = [];
  if (Array.isArray(clsValue)) {
    classArray = clsValue.filter(Boolean);
  } else if (typeof clsValue === "object") {
    const keys = Object.keys(clsValue);
    const cls: any = [];
    keys.forEach((el) => {
      if (!!clsValue[el]) {
        cls.push(el);
      }
    });
    classArray = cls.filter(Boolean);
  } else if (typeof clsValue === "string") {
    classArray = [clsValue];
  }
  classArray = [...new Set(classArray)];
  return classArray;
}

const internals: RenderOptions<Node, Element> = {
  remove(el) {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  },
  insert(el, container, anchor) {
    container.insertBefore(el, anchor || null);
  },
  createElement(type, isSvg) {
    const el = isSvg
      ? document.createElementNS(svgNS, type)
      : document.createElement(type);
    return el;
  },
  createText(text) {
    return document.createTextNode(text);
  },
  createComment(comment) {
    return document.createComment(comment);
  },
  setText(node, text) {
    if (node instanceof Text) {
      node.nodeValue = text;
    } else {
      node.textContent = text;
    }
  },
  patchProp(el, key, newValue, isSvg) {
    // on开头的当作事件去处理
    if (/^on/.test(key)) {
      const invokers = (el as any).__invokers || ((el as any).__invokers = {});
      let invoker = invokers[key];
      const eventName = key.slice(2).toLowerCase();
      if (newValue) {
        if (!invoker) {
          invoker = {
            origin: newValue,
            wrapper: function (ev: unknown) {
              invoker.origin(ev);
            },
          };
          el.addEventListener(eventName, invoker.wrapper);
          invokers[key] = invoker;
        } else {
          invoker.origin = newValue;
        }
      } else {
        if (invoker) {
          el.removeEventListener(eventName, invoker.wrapper);
        }
      }
    } else if (key === "class") {
      const cls = normalizeCls(newValue).join(" ");
      if (!cls) {
        el.removeAttribute("class");
      } else if (isSvg) {
        el.setAttribute("class", cls);
      } else {
        el.className = cls;
      }
    } else if (key in el) {
      (el as any)[key] = newValue;
    } else {
      const useNs = key.startsWith("xlink:");
      if (newValue == null) {
        if (isSvg && useNs) {
          el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
        } else {
          el.removeAttribute(key);
        }
      } else {
        if (isSvg && useNs) {
          el.setAttributeNS(xlinkNS, key, newValue);
        } else {
          el.setAttribute(key, newValue);
        }
      }
    }
  },
};

export default internals;
