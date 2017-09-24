var $ = require('jquery');
var _ = require('lodash');

/**
 *
 * @param {HTMLElement} el
 * @returns {Promise<String[]>}
 */
function getFileUrls(el) {
    var numOfFiles = el.files.length;

    if (numOfFiles > 0) {
        var reader = new FileReader();
        var fileIndex = 0;
        var images = [];

        return new Promise(function (resolve, reject) {
            reader.onload = function (e) {
                fileIndex++;
                console.log('file input - reader.onload(%o) - %d/%d', arguments, fileIndex, numOfFiles);
                images.push(e.target.result);
                if (fileIndex === numOfFiles) {
                    console.log('file input - load complete', arguments, fileIndex, numOfFiles);
                    resolve(images);
                } else {
                    reader.readAsDataURL(el.files[fileIndex]);
                }
            };

            reader.readAsDataURL(el.files[fileIndex]);
        });
    }

    return Promise.resolve([]);
}

/**
 *
 * @returns {Promise<String[]>}
 */
$.fn.getUrls = function () {
    return Promise.all(this.toArray().map(getFileUrls))
        .then(function (urlCollection) {
            return Promise.resolve(_.flatten(urlCollection))
        });

};
