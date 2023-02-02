import "./Lexical.css";

import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {ReactNode, useEffect, useMemo, useState} from 'react';
import {HeadingNode} from '@lexical/rich-text'
import {ListItemNode, ListNode} from '@lexical/list'
import CustomHashtagNode from './Lexical/Hashtag';
import { db } from "Db";

import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'; 
import { editorState } from './Lexical/Markdown';
import AutoEmbedPlugin, { REGISTER_AUTO_NODES } from './Lexical/AutoEmbed';
import Tag from 'Nostr/Tag';
import { MetadataCache } from 'Db/User';
import { FileExtensionRegex, MentionRegex, UrlRegex } from 'Const';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { BLUR_COMMAND, COMMAND_PRIORITY_LOW, FOCUS_COMMAND } from "lexical";
import { TRANSFORMERS } from "@lexical/markdown";
import { useLiveQuery } from "dexie-react-hooks";

  // Catch any errors that occur during Lexical updates and log them
  // or throw them as needed. If you don't throw them, Lexical will
  // try to recover gracefully without losing user data.
  function onError(error: Error) {
    console.error(error);
  }

  interface EditorProps {
    onChange?: (ev: any) => void;
    onFocus?: (ev: any) => void;
    autoFocus?: boolean;
    children?: ReactNode;
    editable?: boolean;
    className?: string
    content: string,
    tags: Tag[],
    users: Map<string, MetadataCache>
  }

  export default function Editor({ editable, content, tags, className, onFocus, onChange }:EditorProps) {

    const initialConfig = {
      namespace: 'SnortEditor',
      onError,
      nodes: [
        ...CustomHashtagNode.nodes(),
        ...REGISTER_AUTO_NODES,
        HeadingNode,
        ListNode,
        ListItemNode
      ],
      editable: editable,
      editorState: editorState(content),
    };

    const matchers = useMemo(() => {
      if(!editable) return LINK_MATCHERS
      return [
        ...LINK_MATCHERS,
        ...EDITABLE_MATCHERS
      ]
    },[editable])

    return (
      <span className={editable ? 'rta ' + className : className}>
        <LexicalComposer initialConfig={initialConfig}>
          {/* <HistoryPlugin /> */}
          {/* <HashtagPlugin /> */}
          <AutoEmbedPlugin 
            onFocus={onFocus}
            tags={tags}
            matchers={matchers}
          />
          <PlainTextPlugin
            contentEditable={<ContentEditable className="textarea" />}
            placeholder={(editable) => editable ? <span className="placeholder">Say Something!</span> : null}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </LexicalComposer>
      </span>
    );
  }

  const EDITABLE_MATCHERS = [
    (text:string) => {
      const match = /(?<=)@[a-zA-Z0-9_]+/.exec(text);
      if (match === null) return match;

      const fullMatch = match[0];
      return {
        mention: true,
        index: match.index,
        length: fullMatch.length,
        text: fullMatch, 
      }
    }
  ]

  export const LINK_MATCHERS = [
    // Url Match
    (text:string) => {
      const URL_MATCHER =
        /(?:[a-z]+:)?\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,12}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

        const match = URL_MATCHER.exec(text);
        if (match === null) return null;

        try {
          const fullMatch = match[0];
          const url = new URL(fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`)
          const extension = FileExtensionRegex.test(url.pathname.toLowerCase()) && RegExp.$1;
          switch(extension) {
            case "gif":
            case "jpg":
            case "jpeg":
            case "png":
            case "bmp":
            case "webp": {
              return {
                image: true,
                index: match.index,
                length: fullMatch.length,
                text: fullMatch,
                url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
                attributes: { rel: 'noopener', target: '_blank' }, 
              };
            }
            case "mp4":
            case "mov":
            case "mkv":
            case "avi":
            case "m4v": {
                return {
                  video: true,
                  index: match.index,
                  length: fullMatch.length,
                  text: fullMatch,
                  url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
                  attributes: { rel: 'noopener', target: '_blank' }, 
                };
            }
            default: {
              return {
                index: match.index,
                length: fullMatch.length,
                text: fullMatch,
                url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
                attributes: { rel: 'noopener', target: '_blank' }, 
              };
            }
          }
        }catch(error) {
          console.error('matcher error', error)
          return null
        }
    },
    //Ref Match
    (text:string) => {
      const match = text.match(/#\[(\d+)\]/);
      if (match === null) return match
      
      const fullMatch = match[0];
      return {
          index: match.index,
          length: fullMatch.length,
          text: fullMatch,
          tagRefId: parseInt(match[1])
      }
    },
  ];
  