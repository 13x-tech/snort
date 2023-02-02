import "./Image.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { $createTextNode, DecoratorNode, LexicalNode, NodeKey, SerializedElementNode, Spread, TextNode } from "lexical";
import { ReactNode, useMemo, useState } from "react";

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
    return  <img key={this.__key} src={this.__src} alt={this.__alt} className={this.__className} />;
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

export function $createImageNode(src: string, alt?: string, className?: string, key?: string ): ImageNode {
  return new ImageNode(src, alt, className, key);
}

export function $isImageNode(node: LexicalNode): boolean {
  return node instanceof ImageNode;
}

export function $createEditableImageNode(src: string, alt?: string, className?: string, key?: string ): EditableImageNode | TextNode {
  return new EditableImageNode(src, alt, className, key);
}

export class EditableImageNode extends ImageNode {

  static getType(): string {
    return 'edit-img';
  } 

  static clone(node: EditableImageNode): EditableImageNode {
    return new EditableImageNode(node.__src, node.__alt, node.__className, node.__key)
  }

  static importJSON(serialized: SerializedImageNode): EditableImageNode {
    return new EditableImageNode(serialized.src, serialized.alt, serialized.className, serialized.key)
  }

  exportJSON(): SerializedImageNode{
    return {
      src: this.__src,
      alt: this.__alt,
      className: this.__className,
      key: this.__key,
    } as SerializedImageNode;
  }

  decorate(): ReactNode {
    return (
      <div className="editable image">
        <EditHeader url={this.__src} className={this.__className}/>
        {super.decorate()}
      </div>
    )
  }
}

interface EditHeaderProps {
  url: string
  className?:string
  onCancel?: () => void
  onClick?: () => void
}


const EditHeader = ({ url, className, onClick, onCancel }:EditHeaderProps) => {

  const urlString = useMemo(() => {

    const STR_LENGTH = 64

    if(url.length > STR_LENGTH) {
      const parts = [
        url.substring(0, STR_LENGTH/2),
        url.substring(url.length - (STR_LENGTH/2), url.length)
      ]
      return parts[0] + '.....' + parts[1].slice(5)
    }
    return url
  },[url])

  return (
    <div className={className ? 'edit-header ' + className : 'edit-header' }>
      <FontAwesomeIcon icon={faX} onClick={onCancel} />
      <span title={url} onClick={onClick}>{urlString}</span>
    </div>
  )
}
