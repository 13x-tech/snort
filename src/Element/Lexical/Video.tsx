import { DecoratorNode, LexicalNode, NodeKey, SerializedElementNode, Spread } from "lexical";
import { ReactNode } from "react";

export interface VideoNodeProps {
  controls?: boolean;
  // crossorigin?: crossorigin; 
  height?: number;
  width?: number;
  loop?: boolean;
  muted?: boolean;
  playsinline?: boolean;
  poster?: string;
  // preload?: preload;
}

// enum crossorigin {
//   "anonymous",
//   "use-credentials"
// }

// enum preload {
//   "none",
//   "metadata",
//   "auto",
//   ""
// }

export const DefaultVideoProps:VideoNodeProps =  {
  controls: true
}

export class VideoNode extends DecoratorNode<ReactNode> {
  __src: string;
  __videoProps?: VideoNodeProps

  static getType(): string {
    return 'video';
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__src, node.__videoProps, node.__key);
  }

  constructor(src: string, props?: VideoNodeProps, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__videoProps = props ? props: DefaultVideoProps;
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): false {
    return false;
  }

  decorate(): ReactNode {
    return  <video 
      key={this.__key}
      src={this.__src}
      controls={this.__videoProps?.controls}
    />;
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    return new VideoNode(serializedNode.src, serializedNode.videoProps, serializedNode.key)
  }

  exportJSON(): SerializedVideoNode {
    return {
      src: this.__src,
      videoProps: this.__videoProps,
      key: this.__key,
    } as SerializedVideoNode;
  }

}
export declare type SerializedVideoNode = Spread<{
  type: 'video';
}, Spread<{src: string, videoProps?: VideoNodeProps, key?: string}, SerializedElementNode>>;

export function $createVideoNode(src: string, props?: VideoNodeProps, key?: string): VideoNode {
  return new VideoNode(src, props, key);
}

export function $isVideoNode(node: LexicalNode): boolean {
  return node instanceof VideoNode;
}