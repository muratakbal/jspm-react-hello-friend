/* */ 
(function(process) {
  var fsUtil,
      pathUtil,
      safefs,
      _ref,
      _ref1,
      _ref2,
      _ref3;
  fsUtil = require('fs');
  pathUtil = require('path');
  if ((_ref = global.numberOfOpenFiles) == null) {
    global.numberOfOpenFiles = 0;
  }
  if ((_ref1 = global.maxNumberOfOpenFiles) == null) {
    global.maxNumberOfOpenFiles = (_ref2 = process.env.NODE_MAX_OPEN_FILES) != null ? _ref2 : 100;
  }
  if ((_ref3 = global.waitingToOpenFileDelay) == null) {
    global.waitingToOpenFileDelay = 100;
  }
  safefs = {
    openFile: function(next) {
      if (global.numberOfOpenFiles < 0) {
        throw new Error("safefs.openFile: the numberOfOpenFiles is [" + global.numberOfOpenFiles + "] which should be impossible...");
      }
      if (global.numberOfOpenFiles >= global.maxNumberOfOpenFiles) {
        setTimeout(function() {
          return safefs.openFile(next);
        }, global.waitingToOpenFileDelay);
      } else {
        ++global.numberOfOpenFiles;
        next();
      }
      return this;
    },
    closeFile: function(next) {
      --global.numberOfOpenFiles;
      if (typeof next === "function") {
        next();
      }
      return this;
    },
    getParentPathSync: function(p) {
      var parentPath;
      parentPath = p.replace(/[\/\\]$/, '').replace(/[\/\\][^\/\\]+$/, '');
      return parentPath;
    },
    ensurePath: function(path, options, next) {
      var _ref4;
      if (next == null) {
        next = options;
        options = null;
      }
      if (options == null) {
        options = {};
      }
      if ((_ref4 = options.mode) == null) {
        options.mode = null;
      }
      safefs.exists(path, function(exists) {
        var parentPath;
        if (exists) {
          return next(null, true);
        }
        parentPath = safefs.getParentPathSync(path);
        return safefs.ensurePath(parentPath, options, function(err) {
          if (err) {
            return next(err, false);
          }
          return safefs.mkdir(path, options.mode, function(err) {
            return safefs.exists(path, function(exists) {
              if (!exists) {
                err = new Error("Failed to create the directory: " + path);
                return next(err, false);
              }
              return next(null, false);
            });
          });
        });
      });
      return this;
    },
    readFile: function(path, options, next) {
      if (next == null) {
        next = options;
        options = null;
      }
      safefs.openFile(function() {
        return fsUtil.readFile(path, options, function(err, data) {
          safefs.closeFile();
          return next(err, data);
        });
      });
      return this;
    },
    writeFile: function(path, data, options, next) {
      if (next == null) {
        next = options;
        options = null;
      }
      safefs.ensurePath(pathUtil.dirname(path), options, function(err) {
        if (err) {
          return next(err);
        }
        return safefs.openFile(function() {
          return fsUtil.writeFile(path, data, options, function(err) {
            safefs.closeFile();
            return next(err);
          });
        });
      });
      return this;
    },
    appendFile: function(path, data, options, next) {
      if (next == null) {
        next = options;
        options = null;
      }
      safefs.ensurePath(pathUtil.dirname(path), options, function(err) {
        if (err) {
          return next(err);
        }
        return safefs.openFile(function() {
          return fsUtil.appendFile(path, data, options, function(err) {
            safefs.closeFile();
            return next(err);
          });
        });
      });
      return this;
    },
    mkdir: function(path, mode, next) {
      if (next == null) {
        next = mode;
        mode = null;
      }
      if (mode == null) {
        mode = 0x1ff & (~process.umask());
      }
      safefs.openFile(function() {
        return fsUtil.mkdir(path, mode, function(err) {
          safefs.closeFile();
          return next(err);
        });
      });
      return this;
    },
    stat: function(path, next) {
      safefs.openFile(function() {
        return fsUtil.stat(path, function(err, stat) {
          safefs.closeFile();
          return next(err, stat);
        });
      });
      return this;
    },
    readdir: function(path, next) {
      safefs.openFile(function() {
        return fsUtil.readdir(path, function(err, files) {
          safefs.closeFile();
          return next(err, files);
        });
      });
      return this;
    },
    unlink: function(path, next) {
      safefs.openFile(function() {
        return fsUtil.unlink(path, function(err) {
          safefs.closeFile();
          return next(err);
        });
      });
      return this;
    },
    rmdir: function(path, next) {
      safefs.openFile(function() {
        return fsUtil.rmdir(path, function(err) {
          safefs.closeFile();
          return next(err);
        });
      });
      return this;
    },
    exists: function(path, next) {
      var exists;
      exists = fsUtil.exists || pathUtil.exists;
      safefs.openFile(function() {
        return exists(path, function(exists) {
          safefs.closeFile();
          return next(exists);
        });
      });
      return this;
    },
    existsSync: function(path) {
      var existsSync,
          result;
      existsSync = fsUtil.existsSync || pathUtil.existsSync;
      result = existsSync(path);
      return result;
    }
  };
  module.exports = safefs;
})(require('process'));
