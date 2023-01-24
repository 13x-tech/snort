import { DecoratorNode, LexicalNode, NodeKey, SerializedElementNode, Spread } from "lexical";
import { ReactNode } from "react";

interface ImageNodeProps {
  src: string
  alt?: string
  className?: string
  key?: NodeKey
}

export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __alt?: string;
  __className?: string;

  static getType(): string {
    return 'img';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__className, node.__key)
  }

  constructor(src: string, alt?: string, className?: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__className = className;
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): false {
    return false;
  }

  decorate(): ReactNode {
    return  <img key={this.__id} src={this.__id} alt={this.__alt} className={this.__className} />;
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    return new ImageNode(serialized.src, serialized.alt, serialized.className, serialized.key)
  }

  exportJSON(): SerializedImageNode{
    return {
      src: this.__src,
      alt: this.__alt,
      className: this.__className,
      key: this.__key,
    } as SerializedImageNode;
  }
}

export declare type SerializedImageNode = Spread<{
  type: 'img';
}, Spread<ImageNodeProps, SerializedElementNode>>;

export function $createImageNode(id: string): ImageNode {
  return new ImageNode(id);
}

export function $isImageNode(node: LexicalNode): boolean {
  return node instanceof ImageNode;
}