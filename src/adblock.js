/* eslint no-redeclare: 0 */
/* global fetch:writable */
import { configRead } from './config';

/**
 * This is a minimal reimplementation of the following uBlock Origin rule:
 * https://github.com/uBlockOrigin/uAssets/blob/3497eebd440f4871830b9b45af0afc406c6eb593/filters/filters.txt#L116
 *
 * This in turn calls the following snippet:
 * https://github.com/gorhill/uBlock/blob/bfdc81e9e400f7b78b2abc97576c3d7bf3a11a0b/assets/resources/scriptlets.js#L365-L470
 *
 * Seems like for now dropping just the adPlacements is enough for YouTube TV
 */
const origParse = JSON.parse;
JSON.parse = function () {
  const r = origParse.apply(this, arguments);
  try {
    if (r.adPlacements && configRead('enableAdBlock')) {
      r.adPlacements = [];
    }

    // Drop "masthead" ad from home screen
    if (
      r?.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content
        ?.sectionListRenderer?.contents &&
      configRead('enableAdBlock')
    ) {
      // remove masthead
      let sectionContents = r.contents.tvBrowseRenderer.content.tvSurfaceContentRenderer.content.sectionListRenderer.contents;
      sectionContents = sectionContents.filter(
        (elm) => !elm.tvMastheadRenderer
      );

      // drop "autoplay" ad tile from home screen
      let replacementSections = [];
      for (let i = 0; i < sectionContents.length; ++i) {
        let section = sectionContents[i];
        let replacementItems = [];
        let items = section.shelfRenderer.content.horizontalListRenderer.items;
        for (let i = 0; i < items.length; ++i) {
          let item = items[i];
          // remove ad slot
          if ("adSlotRenderer" in item) {
            continue
          }
          replacementItems.push(item);
        }
        section.shelfRenderer.content.horizontalListRenderer.items = replacementItems;
        replacementSections.push(section);
      }
      r.contents.tvBrowseRenderer.content.tvSurfaceContentRenderer.content.sectionListRenderer.contents = replacementSections;
    }
  } catch (err) {
    console.warn(
      'adblock: an error occured during JSON.parse processing:',
      err
    );
  }

  return r;
};