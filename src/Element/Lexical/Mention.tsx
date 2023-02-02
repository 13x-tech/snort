import { MetadataCache } from "Db/User";
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

export class EditMentionNode extends MentionNode {
  __search?: string;
  __users: Map<string, MetadataCache>
  static getType(): string {
    return 'edit-mention';
  }

  static clone(node: EditMentionNode): EditMentionNode {
    return new EditMentionNode(node.__search, node.__key);
  }

  constructor(search?:string, pubKey?: string, users?: Map<string, MetadataCache>, key?: NodeKey) {
    super('' ?? pubKey, key);
    this.__users = users ? users : new Map();
    this.__search = search;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedMentionNode): EditMentionNode {
    return new EditMentionNode()
  }

  exportJSON(): SerializedMentionNode {
    return {
      pubKey: this.__pubKey,
    } as SerializedMentionNode;
  }

  decorate(): ReactNode {
    return  (
      <span>
        <span>{this.__search}</span>
        <span>
          <ul>
            {Array.from(this.__users).map(([pub,u]) => <li>{u.name}</li>)}
          </ul>
        </span>
      </span>
    )
  }
}

export declare type SerializedMentionNode = Spread<{
  type: 'link';
}, Spread<{pubKey: string}, SerializedElementNode>>;


export function $createMentionNode(pubKey: string): MentionNode {
  return new MentionNode(pubKey);
}

export function $createEditMentionNode(search: string): EditMentionNode {
  return new EditMentionNode(search);
}