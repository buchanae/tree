define(['domReady', 'kd-tree', 'underscore', 'qunit'], function(domReady, KDTree, _) {
  domReady(function() {

    test("KD Tree", function() {

      var points = [
        { x: 2, y: 2, z: 3 },
        { x: 1, y: 2, z: 3 },
        { x: 3, y: 2, z: 3 },
      ];

      var root = KDTree.KDTree(points);

      equal( root, points[0] );
      equal( root.left, points[1] );
      equal( root.right, points[2] );
      equal( root.left.left, undefined );
      equal( root.left.right, undefined );
      equal( root.right.left, undefined );
      equal( root.right.right, undefined );

    });

    test("KD Tree Nearest Search", function() {
    });
  });
});
