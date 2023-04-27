const ExtendedConfigParser = require('./utils/extendedConfigParser');
const replace = require('replace-in-file');

const PREFERENCE_NAME_SUFFIX = 'ReplaceInFile'

module.exports = function (context) {

    // Get the platform (android or ios)
    const platform = context.opts.cordova.platforms[0];

    // Get preferences that describe usage descriptions
    const parser = ExtendedConfigParser.createInstance(context);
    const preferenceValue = parser
        .getPreference(PREFERENCE_NAME_SUFFIX, platform);
    let prefObjArray;

    // Decode the base64 encoded string to a JSON object
    try {
        const parsedPrefString = Buffer.from(preferenceValue, 'base64').toString();
        console.log(`Parsed String preference ${JSON.stringify(parsedPrefString)}`);
        prefObjArray = JSON.parse(parsedPrefString);
    } catch (e) {
        console.error(`Invalid base64-encoded value for preference ${PREFERENCE_NAME_SUFFIX}`, e);
        console.error(`It should be an array of JSON objects with 3 properties: 'files', 'from' and 'to'`);
        return;
    }

    try {
        prefObjArray.forEach((originalPrefObj) => {
            let prefObj = {...originalPrefObj};
            prefObj.countMatches = true;
            console.log(`Processing substitution rule: ${JSON.stringify(prefObj)}`);
            try {
                console.log(`Processing 'from' rule: ${prefObj.from}`);
                var match = prefObj.from.match(new RegExp('^/(.*?)/([gimy]*)$'));
                prefObj.from = new RegExp(match[1], match[2]);
            } catch (e) {
                console.error(`Failed to convert 'from' regex:`, error);
                return;
            }

            try {
                let changedFiles = replace.sync(prefObj);
                changedFiles.forEach(changedFile => {
                    if (changedFile.hasChanged)
                        console.log(`Modified file ${changedFile.file} for ${changedFile.numReplacements} replacements`);
                });
            } catch (error) {
                console.error('Error occurred:', error);
            }
        })
    } catch (error) {
        console.error('Error occurred:', error);
    }

};
