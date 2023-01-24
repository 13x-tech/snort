import { UserPreferences } from 'State/Login';
import { FileExtensionRegex, MentionRegex, SoundCloudRegex, TidalRegex, TweetUrlRegex, UrlRegex, YoutubeUrlRegex } from 'Const';
import { TwitterTweetEmbed } from 'react-twitter-embed';
import TidalEmbed from './../TidalEmbed';
import SoundCloudEmbed from './../SoundCloudEmded';
import { LinkNode } from '@lexical/link';
import { Fragment } from 'Element/Text';
import Tag from 'Nostr/Tag';
import { MetadataCache } from 'Db/User';
import { hexToBech32 } from 'Util';

const URL_MATCHER =
        /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;




export const LINK_MATCHERS = (tags?: Array<Tag>, users?: Map<string, MetadataCache>) => [
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
  (text:string) => {
    interface response {
        [key:string]: any
    }

    const match = text.match(/#\[(\d+)\]/);
    if(match === null) {
        return null;
    }
    console.log('matchhhh', match)
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
                matchMention.pubKey = ref.PubKey
                break;
            case "e": {
                matchMention.eText = hexToBech32("note", ref.Event!).substring(0, 12);
                matchMention.Event = ref.Event;
                break;
            }
             case "t":
                matchMention.Hashtag = ref.Hashtag
        }
    }

    return matchMention
  }
];

export class CustomLinkNode extends LinkNode {
  url:string;
  constructor(url:string) {
    super(url)
    this.url = url;
  }

  static nodes() {
    return [        
      CustomLinkNode,
      {
          replace: LinkNode,
          with: (node: LinkNode) => {
              return new CustomLinkNode(node.url);
          }
      }]
  }

  static getType() { return "custom-link";
  }

  static clone(node: CustomLinkNode) {
    return new CustomLinkNode(node.url);
  }

  createDOM(config: any) {
    console.log('createDOM a element', this)
    return document.createElement('a')
  }
}