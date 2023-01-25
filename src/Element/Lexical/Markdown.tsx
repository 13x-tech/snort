import {
  $convertFromMarkdownString,
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
  LINK,
  registerMarkdownShortcuts,
  TRANSFORMERS,
} from '@lexical/markdown';
import { LexicalEditor } from 'lexical';

// const TRANSFORMERS = [
//     INLINE_CODE,
//     BOLD_ITALIC_STAR,
//     BOLD_ITALIC_UNDERSCORE,
//     BOLD_STAR,
//     BOLD_UNDERSCORE,
//     STRIKETHROUGH,
//     ITALIC_STAR,
//     ITALIC_UNDERSCORE,
//     ORDERED_LIST,
//     QUOTE,
//     CHECK_LIST,
//     CODE,
//     HEADING,
//     LINK,
// ]

export const editorState = (content: string) => () => {
  $convertFromMarkdownString(content, TRANSFORMERS)
}

export const registerMarkdown = (editor:LexicalEditor) => {
  registerMarkdownShortcuts(editor, TRANSFORMERS)
}
