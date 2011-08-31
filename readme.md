[This example](http://bl.ocks.org/1182434) is a mashup of the [D3](https://github.com/mbostock/d3) **Spline** and **Zoom-Pan** examples along with [Ricardo Marimon's example of X-axis re-scaling by dragging](http://bl.ocks.org/1179647).

* Drag on the canvas to translate/pan the graph.
* double-click on the canvas to zoom in
* shift-double-click on the canvas to zoom out
* Drag on one of the X or Y axis numeric labels to re-scale that axis
* click on a data point to select it
* drag a selected data point to change it's value
* enter the delete or backspace key to delete a selected data point
* drag a selected data point to change it's value
* hold the CTRL key down and click an empty area of the graph to add a data point

*source: [gist.github.com/1182434](https://gist.github.com/1182434)*

There's still a bug where if you scale an axis once, you can then translate/pan around but if you scale the same axis a second time when you next try and translate/pan the result of the first axis re-scale will re-appear. This bug also appears if you re-scale the axes and then add a new data point.

### D3 References:

* [repository](https://github.com/mbostock/d3)
* [wiki](http://mbostock.github.com/d3/)
* [examples](http://mbostock.github.com/d3/ex/)
* [API](https://github.com/mbostock/d3/wiki/API-Reference)
* [Quantitative Scales](https://github.com/mbostock/d3/wiki/Quantitative-Scales)

### D3 Tutorials:

* [Three Little Circles](http://mbostock.github.com/d3/tutorial/circle.html)
* [A Bar Chart, Part 1](http://mbostock.github.com/d3/tutorial/bar-1.html)
* [A Bar Chart, Part 2](http://mbostock.github.com/d3/tutorial/bar-2.html)

### External D3 Tutorials

* [Try D3 Now](http://christopheviau.com/d3_tutorial/)
* [Array Basics](http://www.janwillemtulp.com/2011/03/31/tutorialthe-basics-working-with-arrays-in-d3/)
* [Line Interpolations](http://www.janwillemtulp.com/2011/03/23/tutorial-line-interpolations-in-d3/)
* [Line Chart](http://www.janwillemtulp.com/2011/04/01/tutorial-line-chart-in-d3/)
* [Conway's Game of Life](http://www.janwillemtulp.com/2011/03/22/tutorial-conways-game-of-life-in-d3/)
* [Introudction](http://www.janwillemtulp.com/2011/03/20/tutorial-introduction-to-d3/)

### SVG Graphics

* [standard](http://www.w3.org/TR/SVG/)
