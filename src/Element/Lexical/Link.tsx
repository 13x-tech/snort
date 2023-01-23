import { UserPreferences } from 'State/Login';
import { FileExtensionRegex, SoundCloudRegex, TidalRegex, TweetUrlRegex, UrlRegex, YoutubeUrlRegex } from 'Const';
import { TwitterTweetEmbed } from 'react-twitter-embed';
import TidalEmbed from './../TidalEmbed';
import SoundCloudEmbed from './../SoundCloudEmded';
import { LinkNode } from '@lexical/link';
import { Fragment } from 'Element/Text';

const URL_MATCHER =
        /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export const validateUrl =  (url: string): boolean => {
  return URL_MATCHER.exec(url) !== null;
}



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

function transformHttpLink(a: string, pref: UserPreferences) {
  try {
      if (!pref.autoLoadMedia) {
          return <a href={a} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="ext">{a}</a>
      }
      const url = new URL(a);
      const youtubeId = YoutubeUrlRegex.test(a) && RegExp.$1;
      const tweetId = TweetUrlRegex.test(a) && RegExp.$2;
      const tidalId = TidalRegex.test(a) && RegExp.$1;
      const soundcloundId = SoundCloudRegex.test(a) && RegExp.$1;
      const extension = FileExtensionRegex.test(url.pathname.toLowerCase()) && RegExp.$1;
      if (extension) {
          switch (extension) {
              case "gif":
              case "jpg":
              case "jpeg":
              case "png":
              case "bmp":
              case "webp": {
                  return <img key={url.toString()} src={url.toString()} />;
              }
              case "mp4":
              case "mov":
              case "mkv":
              case "avi":
              case "m4v": {
                  return <video key={url.toString()} src={url.toString()} controls />
              }
              default:
                  return <a key={url.toString()} href={url.toString()} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="ext">{url.toString()}</a>
          }
      } else if (tweetId) {
          return (
              <div className="tweet" key={tweetId}>
                  <TwitterTweetEmbed tweetId={tweetId} />
              </div>
          )
      } else if (youtubeId) {
          return (
              <>
                  <br />
                  <iframe
                      className="w-max"
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title="YouTube video player"
                      key={youtubeId}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen={true}
                  />
                  <br />
              </>
          )
      } else if (tidalId) {
          return <TidalEmbed link={a} />
      } else if (soundcloundId){
          return <SoundCloudEmbed link={a} />
      } else {
          return <a href={a} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="ext">{a}</a>
      }
  } catch (error) {
  }
  return <a href={a} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="ext">{a}</a>
}

function extractLinks(fragments: Fragment[], pref: UserPreferences) {
  return fragments.map(f => {
      if (typeof f === "string") {
          return f.split(UrlRegex).map(a => {
              if (a.startsWith("http")) {
                  return transformHttpLink(a, pref)
              }
              return a;
          });
      }
      return f;
  }).flat();
}