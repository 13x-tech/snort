/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  $isAutoLinkNode, $createAutoLinkNode, $isLinkNode, LinkNode, AutoLinkNode
} from '@lexical/link';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import * as lexical from 'lexical';
import {LexicalNode} from 'lexical'
import * as react from 'react';
import { ImageNode } from './Image';
import { VideoNode } from './Video';
import { $createMentionNode, MentionNode } from './Mention';


/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function findFirstMatch(text: string, matchers: Array<(text:string) => any>) {
  for (let i = 0; i < matchers.length; i++) {
    const match = matchers[i](text);

    if (match) {
      return match;
    }
  }

  return null;
}

const PUNCTUATION_OR_SPACE = /[.,;\s]/;

function isSeparator(char: string) {
  return PUNCTUATION_OR_SPACE.test(char);
}

function endsWithSeparator(textContent: string) {
  return isSeparator(textContent[textContent.length - 1]);
}

function startsWithSeparator(textContent: string) {
  return isSeparator(textContent[0]);
}

function isPreviousNodeValid(node: LexicalNode) {
  let previousNode = node.getPreviousSibling();

  if (lexical.$isElementNode(previousNode)) {
    previousNode = previousNode.getLastDescendant();
  }

  return previousNode === null || lexical.$isLineBreakNode(previousNode) || lexical.$isTextNode(previousNode) && endsWithSeparator(previousNode.getTextContent());
}

function isNextNodeValid(node: LexicalNode) {
  let nextNode = node.getNextSibling();

  if (lexical.$isElementNode(nextNode)) {
    nextNode = nextNode.getFirstDescendant();
  }

  return nextNode === null || lexical.$isLineBreakNode(nextNode) || lexical.$isTextNode(nextNode) && startsWithSeparator(nextNode.getTextContent());
}

function isContentAroundIsValid(matchStart: number, matchEnd: number, text: string, node: LexicalNode) {
  const contentBeforeIsValid = matchStart > 0 ? isSeparator(text[matchStart - 1]) : isPreviousNodeValid(node);

  if (!contentBeforeIsValid) {
    return false;
  }

  const contentAfterIsValid = matchEnd < text.length ? isSeparator(text[matchEnd]) : isNextNodeValid(node);
  return contentAfterIsValid;
}

function handleLinkCreation(
  node: LexicalNode,
  matchers: Array<(text:string)=> any>
) {
  const nodeText = node.getTextContent();
  let text = nodeText;
  let invalidMatchEnd = 0;
  let remainingTextNode = node;
  let match;

  while ((match = findFirstMatch(text, matchers)) && match !== null) {
    const matchStart = match.index;
    const matchLength = match.length;
    const matchEnd = matchStart + matchLength;
    const isValid = isContentAroundIsValid(invalidMatchEnd + matchStart, invalidMatchEnd + matchEnd, nodeText, node);

    if (isValid) {
      let linkTextNode;

      if (invalidMatchEnd + matchStart === 0) {
        [linkTextNode, remainingTextNode] = remainingTextNode.splitText(invalidMatchEnd + matchLength);
      } else {
        [,linkTextNode, remainingTextNode] = remainingTextNode.splitText(invalidMatchEnd + matchStart, invalidMatchEnd + matchStart + matchLength);
      }

      switch(true) {
        case match.image: {
          const url = new URL(match.url)
          linkTextNode.replace($createImageNode(url.toString()))
          break;
        }
        case match.video: {
          const url = new URL(match.url)
          linkTextNode.replace($createVideoNode(url.toString()))
          break;
        }
        case match.key: {
          switch(match.key) {
            case "p": {
              console.log(`mention: ${match.pubKey}`)
              linkTextNode.replace($createMentionNode(match.pubKey))
              break;
            }
            case "e": {
              const textNode = lexical.$createTextNode(match.eText);
              const linkNode = $createAutoLinkNode(`/note/${match.Event}`, match.attributes);
              textNode.setFormat(linkTextNode.getFormat());
              textNode.setDetail(linkTextNode.getDetail());
              linkNode.append(textNode);
              linkTextNode.replace(linkNode);
              break;
            }
            case "t": {
              const textNode = lexical.$createTextNode(match.Hashtag);
              const linkNode = $createAutoLinkNode(`/t/${match.Event}`, match.attributes);
              textNode.setFormat(linkTextNode.getFormat());
              textNode.setDetail(linkTextNode.getDetail());
              linkNode.append(textNode);
              linkTextNode.replace(linkNode);
              break
            }
            default:
              linkTextNode.replace(lexical.$createTextNode(match.text)) 
          }
          break;
        }
        default:
          const textNode = lexical.$createTextNode(match.text);
          const linkNode = $createAutoLinkNode(match.url, match.attributes);
          textNode.setFormat(linkTextNode.getFormat());
          textNode.setDetail(linkTextNode.getDetail());
          linkNode.append(textNode);
          linkTextNode.replace(linkNode);
          break
      }
      invalidMatchEnd = 0;
    } else {
      invalidMatchEnd += matchEnd;
    }

    text = text.substring(matchEnd);
  }
}

function handleLinkEdit(linkNode: LinkNode,  matchers: Array<(text:string)=> any>) {
  // Check children are simple text
  const children = linkNode.getChildren();
  const childrenLength = children.length;

  for (let i = 0; i < childrenLength; i++) {
    const child = children[i];

    if (!lexical.$isTextNode(child) || !child.isSimpleText()) {
      replaceWithChildren(linkNode);
      return;
    }
  } // Check text content fully matches


  const text = linkNode.getTextContent();
  const match = findFirstMatch(text, matchers);

  if (match === null || match.text !== text) {
    replaceWithChildren(linkNode);
    return;
  } // Check neighbors


  if (!isPreviousNodeValid(linkNode) || !isNextNodeValid(linkNode)) {
    replaceWithChildren(linkNode);
    return;
  }

  const url = linkNode.getURL();

  if (url !== match.url) {
    linkNode.setURL(match.url);
  }

  if (match.attributes) {
    const rel = linkNode.getRel();

    if (rel !== match.attributes.rel) {
      linkNode.setRel(match.attributes.rel || null);
    }

    const target = linkNode.getTarget();

    if (target !== match.attributes.target) {
      linkNode.setTarget(match.attributes.target || null);
    }
  }
} // Bad neighbours are edits in neighbor nodes that make AutoLinks incompatible.
// Given the creation preconditions, these can only be simple text nodes.


function handleBadNeighbors(textNode: LexicalNode) {
  const previousSibling = textNode.getPreviousSibling();
  const nextSibling = textNode.getNextSibling();
  const text = textNode.getTextContent();

  if ($isAutoLinkNode(previousSibling) && !startsWithSeparator(text)) {
    replaceWithChildren(previousSibling);
  }

  if ($isAutoLinkNode(nextSibling) && !endsWithSeparator(text)) {
    replaceWithChildren(nextSibling);
  }
}

function replaceWithChildren(node: lexical.ElementNode) {
  const children = node.getChildren();
  const childrenLength = children.length;

  for (let j = childrenLength - 1; j >= 0; j--) {
    node.insertAfter(children[j]);
  }

  node.remove();
  return children.map(child => child.getLatest());
}

function useAutoLink(editor: lexical.LexicalEditor,  matchers: Array<(text:string)=> any>) {
  react.useEffect(() => {
    if (!editor.hasNodes([AutoLinkNode])) {
      {
        throw Error(`LexicalAutoLinkPlugin: AutoLinkNode not registered on editor`);
      }
    }

    return mergeRegister(editor.registerNodeTransform(lexical.TextNode, textNode => {
      const parent = textNode.getParentOrThrow<LinkNode>();

      if ($isAutoLinkNode(parent)) {
        handleLinkEdit(parent, matchers);
      } else if (!$isLinkNode(parent)) {
        if (textNode.isSimpleText()) {
          handleLinkCreation(textNode, matchers);
        }

        handleBadNeighbors(textNode);
      }
    }));
  }, [editor, matchers]);
}

interface AutoLinkProps{
  matchers: Array<(text:string)=>any>,
}

function AutoLinkPlugin({ matchers }:AutoLinkProps):null {
  const [editor] = useLexicalComposerContext();
  useAutoLink(editor, matchers);
  return null;
}

export default AutoLinkPlugin;

export const REGISTER_AUTO_NODES = [
  AutoLinkNode,
  MentionNode,
  LinkNode,
  ImageNode,
  VideoNode,
]
