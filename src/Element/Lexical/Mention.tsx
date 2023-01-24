import Mention from "Element/Mention";
import { DecoratorNode, NodeKey, SerializedElementNode, Spread } from "lexical";
import { ReactNode } from "react";

export class MentionNode extends DecoratorNode<ReactNode> {
  __pubKey: string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__pubKey, node.__key);
  }

  constructor(pubKey: string, key?: NodeKey) {
    super(key);
    this.__pubKey = pubKey;
  }

  createDOM(): HTMLElement {
    return document.createElement('span');
  }

  updateDOM(): false {
    return false;
  }

  decorate(): ReactNode {
    return  <Mention pubkey={this.__pubKey} />
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return new MentionNode(serializedNode.pubKey)
  }

  exportJSON(): SerializedMentionNode {
    return {
      pubKey: this.__pubKey,
    } as SerializedMentionNode;
  }
}

export declare type SerializedMentionNode = Spread<{
  type: 'link';
}, Spread<{pubKey: string}, SerializedElementNode>>;


export function $createMentionNode(pubKey: string): MentionNode {
  return new MentionNode(pubKey);
}