// var { richTextFromMarkdown } = require('@contentful/rich-text-from-markdown');
var richTextFromMarkdown = require('@contentful/rich-text-from-markdown').richTextFromMarkdown;
var _ = require('lodash');

module.exports = function(migration, requestObject ) {
  migration.transformEntries({
    contentType: 'lesson',
    from: ['modules'],
    to: ['copy'],
    transformEntryForLocale: async function(fromFields) {
      // Get the "Lesson > *" modules that are linked to the "modules" field
      var moduleIDs = fromFields.modules['en-US'].map(e => e.sys.id);
      var moduleEntries = await requestObject.makeRequest({
        method: 'GET',
        url: `/entries?sys.id[in]=${moduleIDs.join(',')}`
      });
      // Filter down to just these Lessons linked by the current entry
      var linkedModuleEntries = moduleIDs.map(id =>
        moduleEntries.items.find(entry => entry.sys.id === id)
      );

      // The content property of the Rich Text document is an array of paragraphs, embedded entries, embedded assets.
      var contentArray = _.flatten(
        linkedModuleEntries.map(transformLinkedModule)
      );

      // The returned Rich Text object to be added to the new "copy" field
      var result = {
        copy: {
          nodeType: 'document',
          content: contentArray,
          data: {}
        }
      };
      return result;

      function transformLinkedModule(linkedModule) {
        switch (linkedModule.sys.contentType.sys.id) {
          case 'lessonCopy':
            return transformLessonCopy(linkedModule);
          case 'lessonImage':
            return embedImageBlock(linkedModule);
          case 'lessonCodeSnippets':
            return embedCodeSnippet(linkedModule);
        }
      }

      // Return Rich Text instead of Markdown
      function transformLessonCopy(lessonCopy) {
        var copy = lessonCopy.fields.copy['en-US'];
        console.log(richTextFromMarkdown(copy));
        return richTextFromMarkdown(copy);
      }

      // Return a Rich Text embedded asset object
      function embedImageBlock(lessonImage) {
        var asset = lessonImage.fields.image['en-US'];
        return [
          {
            nodeType: 'embedded-asset-block',
            data: {
              target: {
                sys: {
                  type: 'Link',
                  linkType: 'Asset',
                  id: asset.sys.id
                }
              }
            }
          }
        ];
      }

      // Return a Rich Text embedded entry object
      function embedCodeSnippet(lessonCodeSnippet) {
        return [
          {
            nodeType: 'embedded-entry-block',
            data: {
              target: {
                sys: {
                  type: 'Link',
                  linkType: 'Entry',
                  id: lessonCodeSnippet.sys.id
                }
              }
            }
          }
        ];
      }
    }
  });
};