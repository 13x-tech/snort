/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {useEffect, useMemo, useState} from 'react';
import * as lexical from 'lexical';

import {
  $isLinkNode, $createLinkNode, LinkNode 
} from '@lexical/link';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import { $createEditableImageNode, $createImageNode, EditableImageNode, ImageNode } from './Image';
import { $createVideoNode, VideoNode } from './Video';
import { $createEditMentionNode, $createMentionNode, EditMentionNode, MentionNode } from './Mention';
import Tag from 'Nostr/Tag';
import { MetadataCache } from 'Db/User';
import { hexToBech32 } from 'Util';
import { registerMarkdown } from './Markdown';
import { stringify } from 'querystring';
import { is } from 'immer/dist/internal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from 'Db';


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

function isPreviousNodeValid(node: lexical.LexicalNode) {
  let previousNode = node.getPreviousSibling();

  if (lexical.$isElementNode(previousNode)) {
    previousNode = previousNode.getLastDescendant();
  }

  return previousNode === null || lexical.$isLineBreakNode(previousNode) || lexical.$isTextNode(previousNode) && endsWithSeparator(previousNode.getTextContent());
}

function isNextNodeValid(node: lexical.LexicalNode) {
  let nextNode = node.getNextSibling();

  if (lexical.$isElementNode(nextNode)) {
    nextNode = nextNode.getFirstDescendant();
  }

  return nextNode === null || lexical.$isLineBreakNode(nextNode) || lexical.$isTextNode(nextNode) && startsWithSeparator(nextNode.getTextContent());
}

function isContentAroundIsValid(matchStart: number, matchEnd: number, text: string, node: lexical.LexicalNode) {
  const contentBeforeIsValid = matchStart > 0 ? isSeparator(text[matchStart - 1]) : isPreviousNodeValid(node);

  if (!contentBeforeIsValid) {
    return false;
  }

  const contentAfterIsValid = matchEnd < text.length ? isSeparator(text[matchEnd]) : isNextNodeValid(node);
  return contentAfterIsValid;
}

function handleLinkCreation(
  node: lexical.LexicalNode,
  matchers: Array<(text:string)=> any>,
  tags: Array<Tag>,
  isEditable: boolean,
  query?: (text:string) => void,
  users?: Array<MetadataCache>,
) {
  const nodeText = node.getTextContent();
  let text = nodeText;
  let invalidMatchEnd = 0;
  let remainingTextNode = node;
  let match;
  
  let somethinghere = ''

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
      switch(isValid) {
        case match.mention: {
          if(isEditable && match.text) {
            if(query) query(match.text)
            const textNode = lexical.$createTextNode(match.text);
            const usersText = `[ ${users?.map(u => u.name).join(', ')} ]`
            console.log('remaining text node', remainingTextNode)
            console.log('somethinghere', somethinghere)
            somethinghere = usersText
            const linkNode = $createLinkNode(`/#${match.text.slice(1)}`, match.attributes);
            textNode.setFormat(linkTextNode.getFormat());
            textNode.setDetail(linkTextNode.getDetail());
            linkNode.append(textNode);
            linkTextNode.replace(linkNode);
          } else {
            linkTextNode.replace(lexical.$createTextNode(match.text))
          }
          break
        }
        case match.image: {
          const url = new URL(match.url)
          if(isEditable === true) {
            linkTextNode.replace($createEditableImageNode(url.toString()))
          } else {
            linkTextNode.replace($createImageNode(url.toString()))
          }
          break;
        }
        case match.video: {
          const url = new URL(match.url)
          linkTextNode.replace($createVideoNode(url.toString()))
          break;
        }
        case !isNaN(match.tagRefId): {
          const id:number = match.tagRefId;
          const ref = tags?.find(a => a.Index === id)

          if(ref) {
            switch(ref.Key) {
              case "p": {
                console.log('should mention', ref)
                if(ref.PubKey) {
                  linkTextNode.replace($createMentionNode(ref.PubKey))
                  break;
                }
              }
              case "e": {
                if(ref.Event) {
                  const eText = hexToBech32("note", ref.Event!).substring(0, 12);
                  const textNode = lexical.$createTextNode(eText);
                  const linkNode = $createLinkNode(`/note/${ref.Event}`, match.attributes);
                  textNode.setFormat(linkTextNode.getFormat());
                  textNode.setDetail(linkTextNode.getDetail());
                  linkNode.append(textNode);
                  linkTextNode.replace(linkNode);
                  break;
                }
              }
              case "t": {
                if(ref.Hashtag) {
                  const textNode = lexical.$createTextNode(ref.Hashtag);
                  const linkNode = $createLinkNode(`/t/${ref.Hashtag}`, match.attributes);
                  textNode.setFormat(linkTextNode.getFormat());
                  textNode.setDetail(linkTextNode.getDetail());
                  linkNode.append(textNode);
                  linkTextNode.replace(linkNode);
                  break
                }
              }
              default:
                linkTextNode.replace(lexical.$createTextNode(match.text)) 
            }
            break;
          }
        }
        default:
          const textNode = lexical.$createTextNode(match.text);
          const linkNode = $createLinkNode(match.url, match.attributes);
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
}

// Bad neighbours are edits in neighbor nodes that make Links incompatible.
// Given the creation preconditions, these can only be simple text nodes.
function handleBadNeighbors(textNode: lexical.LexicalNode) {
  const previousSibling = textNode.getPreviousSibling();
  const nextSibling = textNode.getNextSibling();
  const text = textNode.getTextContent();

  if ($isLinkNode(previousSibling) && !startsWithSeparator(text)) {
    replaceWithChildren(previousSibling);
  }

  if ($isLinkNode(nextSibling) && !endsWithSeparator(text)) {
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

interface AutoEmbed{
  onFocus?: (ev:any) => void;
  matchers: Array<(text:string)=>any>,
  tags: Array<Tag>,
}

function AutoEmbed({ matchers, tags, onFocus }: AutoEmbed):null {
  const [query,setQuery] = useState('')
  const [editor] = useLexicalComposerContext();

  // Todo, register other nodes or handle them differently
  if (!editor.hasNodes([LinkNode])) {
    throw Error(`AutoEmbed: LinkNode not registered on editor`);
  }

  const users = useLiveQuery(
    async () => {
      return await db.users
        .where("npub").startsWithIgnoreCase(query)
        .or("name").startsWithIgnoreCase(query)
        .or("display_name").startsWithIgnoreCase(query)
        .or("nip05").startsWithIgnoreCase(query)
        .limit(5)
        .toArray()
    }, [query]);

  const registerNodeTransform = (
    matchers: Array<(text:string)=>any>,
    tags: Array<Tag>,
    users?: MetadataCache[],
  ) => editor.registerNodeTransform(lexical.TextNode, textNode => {
    console.log('called here', users)
      const parent = textNode.getParentOrThrow<LinkNode>();
  
      if ($isLinkNode(parent)) {
        handleLinkEdit(parent, matchers);
      } else if (!$isLinkNode(parent)) {
        if (textNode.isSimpleText()) {
          handleLinkCreation(textNode, matchers, tags, editor.isEditable(), setQuery, users);
        }
  
        handleBadNeighbors(textNode);
      }
    })

  useEffect(() => mergeRegister(registerNodeTransform(matchers, tags, users)),[ matchers, tags, users])

  useEffect(() => editor.registerCommand(
    lexical.BLUR_COMMAND,
    () => false,
    lexical.COMMAND_PRIORITY_LOW
  ),[])


  useEffect(() => editor.registerCommand(
    lexical.FOCUS_COMMAND,
    () => {
      if(onFocus) {
        onFocus(true)
      }
      return false
    },
    lexical.COMMAND_PRIORITY_LOW
  ),[onFocus])

  return null;
}

export default AutoEmbed;

export const REGISTER_AUTO_NODES = [
  MentionNode,
  EditMentionNode,
  LinkNode,
  ImageNode,
  EditableImageNode,
  VideoNode,
]
