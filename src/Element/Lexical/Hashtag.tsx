import {HashtagNode} from '@lexical/hashtag'
import * as utils from '@lexical/utils'

export default class CustomHashtagNode extends HashtagNode {

  static nodes() {
    return [CustomHashtagNode,
    {
        replace: HashtagNode,
        with: (node: HashtagNode) => {
            return new CustomHashtagNode(node.__text);
        }
    }]
  }

  static getType() { return "custom-hashtag";
  }

  static clone(node: CustomHashtagNode) {
    return new CustomHashtagNode(node.__text);
  }

  createDOM(config: any) {
    const element = document.createElement('a');
    element.href = this.__text.replace('#', '/t/');
    element.text = this.__text;

    if (this.__target) {
      element.target = this.__target;
    }

    if (this.__rel) {
      element.rel = this.__rel;
    }

    utils.addClassNamesToElement(element, config.theme.link);
    return element;
  }
}