import {LexicalComposer} from '@lexical/react/LexicalComposer';

import {ReactNode, useMemo} from 'react';
import {HeadingNode} from '@lexical/rich-text'
import {ListItemNode, ListNode} from '@lexical/list'
import CustomHashtagNode from './Lexical/Hashtag';

import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'; 
import { editorState } from './Lexical/Markdown';
import AutoEmbedPlugin, { REGISTER_AUTO_NODES } from './Lexical/AutoEmbed';
import Tag from 'Nostr/Tag';
import { MetadataCache } from 'Db/User';
import { FileExtensionRegex, UrlRegex } from 'Const';
import { hexToBech32 } from 'Util';

  // Catch any errors that occur during Lexical updates and log them
  // or throw them as needed. If you don't throw them, Lexical will
  // try to recover gracefully without losing user data.
  function onError(error: Error) {
    console.error(error);
  }

  interface EditorProps {
    children?: ReactNode;
    editable?: boolean;
    className?: string
    content: string,
    tags: Tag[],
    users: Map<string, MetadataCache>
  }

  export default function Editor({ editable, content, tags, users }:EditorProps) {
    const theme = {
    } 

    const initialConfig = {
      namespace: 'MyEditor',
      theme,
      onError,
      nodes: [
        ...CustomHashtagNode.nodes(),
        ...REGISTER_AUTO_NODES,
        HeadingNode, ListNode, ListItemNode],
      editable: editable,
      editorState: editorState(content),
    };

    const matchers = useMemo(() => LINK_MATCHERS(tags, users), [tags,users])

    return (
        <LexicalComposer initialConfig={initialConfig}>
          <HashtagPlugin />
          <AutoEmbedPlugin 
            matchers={matchers}
          />
          <PlainTextPlugin
            contentEditable={<ContentEditable className="text" />}
            placeholder={<>...</>}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </LexicalComposer>
      );
  }

  export const LINK_MATCHERS = (tags?: Array<Tag>, users?: Map<string, MetadataCache>) => [
    (text:string) => {
        const match = UrlRegex.exec(text);
        if (match === null) {
        return null;
        }
        const fullMatch = match[0];
        try {
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
          return null
        }
    },
    (text:string) => {
      interface response {
        index?: number,
        length: number,
        text: string,
  
        key?: string,
        pubKey?: string,
        eText?: string,
        event?: string,
        hashtag?: string,
     }
  
      const match = text.match(/#\[(\d+)\]/);
      if(match === null) {
          return null;
      }
      const fullMatch = match[0];
  
      let matchMention:response = {
          index: match.index,
          length: fullMatch.length,
          text: fullMatch, 
      }
  
      const idx = parseInt(match[1]);
      const ref = tags?.find(a => a.Index === idx);
      if(ref) {
          matchMention.key = ref.Key
          switch(ref.Key) {
              case "p":
                  console.log(`should mention: ${ref.PubKey}`)
                  matchMention.pubKey = ref.PubKey;
                  return matchMention
              case "e": {
                  matchMention.eText = hexToBech32("note", ref.Event!).substring(0, 12);
                  matchMention.event = ref.Event;
                  return matchMention
              }
               case "t":
                  matchMention.hashtag = ref.Hashtag
                  return matchMention
          }
      }
  
      return matchMention
    }
  ];
  