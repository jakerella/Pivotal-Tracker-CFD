// Helper functions for managing MongoDB

module.exports = {
  
  parseConnectionURI: function (uri) {
    uri = (uri)?uri.toString():"";
    var m, pieces = null;

    m = uri.match(/^(?:mongodb\:\/\/)?(?:([^\/\:]+)\:([^\/\:@]+)@)?([^@\/\:]+)(?:\:([0-9]{1,5}))?\/(.+)$/i);
    if (m) {
        pieces = {
            "host": m[3],
            "port": (m[4] || null),
            "user": (m[1] || null),
            "pass": (m[2] || null),
              "db": m[5],
             "uri": uri
        };
    }

    return pieces;
  },

  connect: function () {
    // whatever
  }

};
