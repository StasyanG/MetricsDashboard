var fs = require('fs');
var multiparty = require('multiparty');
var uuid = require('uuid');

var helpers = require('./helpers');

module.exports = {
  // Source: https://habrahabr.ru/post/229743/
  uploadFile: function(req, res) {

    var form = new multiparty.Form();
    var uploadDir = './uploads';
    var uploadFile = { uploadPath: '', type: '', size: 0 };
    var maxSize = 100 * 1024 * 1024; //100MB
    var supportMimeTypes = [ 
      'application/excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv', 'text/plain'
    ];
    // when mimetypes is not enough
    var supportFileEndings = [];

    var errors = [];
    var path;

    form.on('error', function (err) {
      if (fs.existsSync(uploadFile.path)) {
        fs.unlinkSync(uploadFile.path);
        console.log('error');
      }
    });

    form.on('close', function () {
      if (errors.length == 0) {
        return res.send({
          status: 'OK',
          data: {
            text: 'Success',
            uploadPath: uploadFile.path
          }
        });
      }
      else {
        if (fs.existsSync(uploadFile.path)) {
          fs.unlinkSync(uploadFile.path);
        }
        return res.send({ status: 'ERROR', errors: errors });
      }
    });

    // listen on part event for file
    form.on('part', function (part) {
      uploadFile.size = part.byteCount;
      uploadFile.type = part.headers['content-type'];

      file_extension = '.' + part.filename.split('.').pop();
      path = '/' + uuid.v4() + file_extension;
      uploadFile.path = uploadDir + path;

      if (uploadFile.size > maxSize) {
        errors.push('File size is ' + uploadFile.size / 1024 / 1024 + '. Limit is' + (maxSize / 1024 / 1024) + 'MB.');
      }

      if (supportMimeTypes.indexOf(uploadFile.type) == -1) {
        var f = 0;
        for (i = 0; i < supportFileEndings.length; i++) {
          if(file_extension == supportFileEndings[i]) {
            f = 1;
            break;
          }
        }
        if(!f) {
          errors.push('Unsupported file type ' + uploadFile.type);
        }
      }

      if (errors.length == 0) {
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        var out = fs.createWriteStream(uploadFile.path);
        part.pipe(out);
      }
      else {
        part.resume();
      }
    });

    // parse the form
    form.parse(req);
    
  }
}