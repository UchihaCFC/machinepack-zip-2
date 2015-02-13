module.exports = {
  friendlyName: 'Zip',
  description: 'Zip up the specified source file or directory and write a .zip file to disk.',
  extendedDescription: '',
  inputs: {
    source: {
      example: '/Users/mikermcneil/.tmp/',
      description: 'The path (relative or absolute) to the file or directory to zip.',
      extendedDescription: 'If a relative path is provided, it will be resolved to an absolute path using the current working directory.',
      required: true
    },
    destination: {
      example: '/Users/mikermcneil/tmp-contents.zip',
      // TODO: default to using `inputs.source` + ".zip" and just creating the output archive in the same dir that the source lives in (or i.e. the first source in the list, or something)
      description: 'The path (relative or absolute) where the .zip file should be written.',
      extendedDescription: 'If a relative path is provided, it will be resolved to an absolute path using the current working directory.',
      required: true
    }
  },
  defaultExit: 'success',
  exits: {
    error: {
      description: 'Unexpected error occurred.'
    },
    success: {
      description: 'Done- archive has been finalized and the output file descriptor has closed.',
      example: {
        bytesWritten: 3523523,
      }
    }
  },
  fn: function(inputs, exits) {

    var path = require('path');
    var fs = require('fs');
    var Archiver = require('archiver');

    var srcPath = path.resolve(inputs.source);
    var zipFileDestination = path.resolve(inputs.destination);
    // console.log('from %s to %s', srcPath, zipFileDestination);

    var archive = Archiver('zip');

    var outputStream = fs.createWriteStream(zipFileDestination);
    outputStream.once('close', function() {
      return exits.success({
        bytesWritten: archive.pointer()
      });
    });
    outputStream.once('error', function (err) {
      return exits.error(err);
    });
    archive.once('error', function (err) {
      return exits.error(err);
    });

    archive.pipe(outputStream);

    // Get (1) srcPath's parent and (2) the relative path to our srcPath from its parent
    var srcParent = path.resolve(srcPath, '..');
    var srcRelative = path.relative(srcParent, srcPath);

    // console.log('srcParent',srcParent);
    // console.log('srcRelative',srcRelative);
    // console.log('dest',zipFileDestination);
    // console.log('srces: ',[ srcRelative, path.join(srcRelative, '**') ]);

    archive.bulk([
      { src: [ srcRelative, path.join(srcRelative, '**') ], cwd: srcParent, expand: true }
    ]);

    archive.finalize();


  },

};
