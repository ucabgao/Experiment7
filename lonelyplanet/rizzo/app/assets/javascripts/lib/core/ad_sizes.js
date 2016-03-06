/* jshint camelcase:false */
define(function() {

  "use strict";

  return {
    billboard: [
      { browser: [ 980, 0 ], ad_sizes: [ [ 1001, 300 ], [ 970, 250 ], [ 970, 90 ], [ 970, 66 ], [ 728, 90 ] ] },
      { browser: [ 728, 0 ], ad_sizes: [ 728, 90 ] },
      { browser: [ 0, 0 ], ad_sizes: [ 320, 50 ] }
    ],
    leaderboard: [
      { browser: [ 980, 0 ], ad_sizes: [ [ 1001, 300 ], [ 970, 250 ], [ 970, 90 ], [ 970, 66 ], [ 728, 90 ], [ 1, 1 ] ] },
      { browser: [ 728, 0 ], ad_sizes: [ 728, 90 ] },
      { browser: [ 0, 0 ], ad_sizes: [ 320, 50 ] }
    ],
    "leaderboard-content": [
      { browser: [ 728, 0 ], ad_sizes: [ 728, 90 ] },
      { browser: [ 0, 0 ], ad_sizes: [ 320, 50 ] }
    ],
    mpu: [
      { browser: [ 0, 0 ], ad_sizes: [ [ 1, 1 ], [ 300, 250 ] ] }
    ],
    "mpu-bottomboard": [
      { browser: [ 728, 0 ], ad_sizes: [ [ 1, 1 ], [ 728, 90 ] ] },
      { browser: [ 0, 0 ], ad_sizes: [ 300, 250 ] }
    ],
    "mpu-double": [
      { browser: [ 728, 0 ], ad_sizes: [ [ 1, 1 ], [ 300, 600 ], [ 300, 250 ] ] },
      { browser: [ 0, 0 ], ad_sizes: [ 300, 250 ] }
    ],
    "sponsor-logo": [
      { browser: [ 0, 0 ], ad_sizes: [ [ 150, 120 ], [ 120, 50 ] ] }
    ],
    "traffic-driver-html": [
      { browser: [ 0, 0 ], ad_sizes: [ 1, 1 ] }
    ],
    "sponsor-logo-html": [
      { browser: [ 0, 0 ], ad_sizes: [ 2, 2 ] }
    ],
    "tourist-board-html": [
      { browser: [ 0, 0 ], ad_sizes: [ 3, 3 ] }
    ]
  };

});
