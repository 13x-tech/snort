import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {
    $convertFromMarkdownString,
    LINK,
    INLINE_CODE,
    BOLD_ITALIC_STAR,
    BOLD_ITALIC_UNDERSCORE,
    BOLD_STAR,
    BOLD_UNDERSCORE,
    STRIKETHROUGH,
    ITALIC_STAR,
    ITALIC_UNDERSCORE,
    ORDERED_LIST,
    QUOTE,
    CHECK_LIST,
    CODE,
    HEADING,
  } from '@lexical/markdown';
import {PlainTextPlugin} from '@lexical/react/LexicalPlainTextPlugin';
import {AutoLinkPlugin} from '@lexical/react/LexicalAutoLinkPlugin';
import {LinkNode,AutoLinkNode} from '@lexical/link'
import {HashtagNode} from '@lexical/hashtag'
import {ListItemNode, ListNode} from '@lexical/list'
import {HeadingNode} from '@lexical/rich-text'
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'; 
import { ReactNode } from 'react';

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
    content: string
  }
  
  export default function Editor({ editable, content }:EditorProps) {
    const theme = {
    } 

    const initialConfig = {
      namespace: 'MyEditor',
      theme,
      onError,
      nodes: [HeadingNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, HashtagNode],
      editable: editable,
      editorState: () => $convertFromMarkdownString(content, [
        INLINE_CODE,
        BOLD_ITALIC_STAR,
        BOLD_ITALIC_UNDERSCORE,
        BOLD_STAR,
        BOLD_UNDERSCORE,
        STRIKETHROUGH,
        ITALIC_STAR,
        ITALIC_UNDERSCORE,
        LINK,
        ORDERED_LIST,
        QUOTE,
        CHECK_LIST,
        CODE,
        HEADING,
      ])
    };

    // const CUSTOM_TRANSFORM = [
    //     (text:string) => {
    //     }
    // ]

    const URL_MATCHER =
        /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

        const MATCHERS = [
        (text:string) => {
            const match = URL_MATCHER.exec(text);
            if (match === null) {
            return null;
            }
            const fullMatch = match[0];
            return {
            index: match.index,
            length: fullMatch.length,
            text: fullMatch,
            url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
            attributes: { rel: 'noopener', target: '_blank' }, 
            };
        },
    ];

    return (
        <LexicalComposer initialConfig={initialConfig}>
          <PlainTextPlugin
            contentEditable={<ContentEditable className="text" />}
            placeholder={<>...</>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HashtagPlugin />
          <AutoLinkPlugin matchers={MATCHERS} />
        </LexicalComposer>
      );
  }