define(['underscore'], function(_) {

  return {
    KDTree: function( points, depth ){
      if (points.length === 0) return;

      depth = typeof depth !== 'undefined' ? depth : 0;

      var axis = [ 'x', 'y', 'z' ][depth % 3];
      var sorted = _.sortBy(points, function(p) {
        return p[axis];
      });

      var median = Math.floor(sorted.length / 2);

      sorted[median].left = this.KDTree( sorted.slice( 0, median ), depth + 1 );
      sorted[median].right = this.KDTree( sorted.slice( median + 1 ), depth + 1 );

      return sorted[median];
    },
  };

});
