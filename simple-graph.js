// For references, consult README.docx file
var Vis = {}; // Declaring empty global object
Vis.tags_noShow = []; // Tags selected
Vis.cmts_noShow = []; // Comment names
Vis.without = 1; // Canvas without selected tags
Vis.without2 = 1; // Canvas with selected tags
Vis.tag_map = {}; // Mapping tag name -> id
Vis.cmt_map = {}; // Mapping commenter name -> id
Vis.lower = 0; // Used in getClouds function
Vis.upper = 0;
Vis.limit = 100;

SimpleGraph = function(elemid, options) {
  var self = this;
  this.chart = document.getElementById(elemid);
  this.cx = this.chart.clientWidth;
  this.cy = this.chart.clientHeight;
  this.options = options || {};
  this.options.xmax = options.xmax || 300;
  this.options.xmin = options.xmin || 0;
  this.options.ymax = options.ymax || 10;
  this.options.ymin = options.ymin || 0;
  this.posts = options.data;
  this.padding = {
     "top":    this.options.title  ? 40 : 0,
     "right":                 0,
     "bottom": this.options.xlabel ? 20 : 13,
     "left":   this.options.ylabel ? 30 : 20 
  };
 
  this.size = {
    "width":  this.cx - this.padding.left - this.padding.right,
    "height": this.cy - this.padding.top  - this.padding.bottom
  };

  // x-scale
 var date1 = new Date(this.posts[0]["timestamp"]*1000);
 var date2 = new Date(this.posts[this.posts.length-1]["timestamp"]*1000);

  this.x = d3.time.scale()
     .domain([date2, date1])
     .range([0, this.size.width]);

  // drag x-axis logic
  this.downx = Math.NaN;
 
  // y-scale (inverted domain)
  this.y = d3.scale.linear()
      .domain([this.options.ymax, this.options.ymin])
      .nice()
      .range([0, this.size.height])
      .nice();
 
  // drag y-axis logic
  this.downy = Math.NaN;
 
  this.dragged = this.selected = null;
 
  this.line = d3.svg.line()
      .x(function(d, i) { return this.x(this.points[i].x); })
      .y(function(d, i) { return this.y(this.points[i].y); });
      datacount = this.posts.length; 

  // Define points
  this.points = d3
    .range(datacount)
    .map(function(i) {
    var len=1, comm_len=1, comm_num=0;
    var commenters = [];
    switch (this.posts[i]['type']) {
	case "text":  len += this.posts[i]['body'].length;  break;
	case "photo":
	 for (var j=0; j<this.posts[i]['photos'].length; j++) {
	  len += this.posts[i]['photos'][j]['caption'].length;
	  for (var k=0; k<this.posts[i]['photos'][j]['alt_sizes'].length; k++) {
	  len += this.posts[i]['photos'][j]['alt_sizes'][k]['height'];
	  }
	 }  break;
	case "quote": len += this.posts[i]['text'].length + 
		this.posts[i]['source'].length;  break;
	case "link": len += this.posts[i]['description'].length;  break;
	case "chat": len += this.posts[i]['body'].length;  break;
	case "audio": len += this.posts[i]['caption'].length;  break;
	case "video": len += this.posts[i]['caption'].length;  break;
	case "answer": len += this.posts[i]['question'].length + 
		this.posts[i]['answer'].length;  break;
	default : alert("ERROR: Tumblr has invented a new type of post...Get Jessica to update this");
    }
    comm_num = this.posts[i]['note_count'];
    if (typeof this.posts[i]['notes'] != 'undefined') {
	var j=0;
	for (j=0; j<this.posts[i]['notes'].length; j++) {
	 comm_len += 20;
	 if (typeof this.posts[i]['notes'][j]['added_text'] != 'undefined') {
	  comm_len += this.posts[i]['notes'][j]['added_text'].length;
	 }
	 commenters.push(this.posts[i]['notes'][j]['blog_name']);
	}
	comm_len = comm_len/j * comm_num;
    } else if (comm_num != 0) {
	comm_len = comm_num * 20;
    }
    return {
	url: this.posts[i]['post_url'],
	type: this.posts[i]['type'],
	tags: this.posts[i]['tags'],
	c_num: comm_num,
	c_len: comm_len,
	c_ers: commenters,  
	x: new Date(this.posts[i]['timestamp']*1000),
	y: len,
	read: 0}; 
  }, self);

  delete this.posts; //we don't need them anymore

  this.live_points = getCorrectBlogPoints(this.points);
 
  this.vis = d3.select(this.chart).append("svg")
      .attr("width",  this.cx)
      .attr("height", this.cy)
      .append("g")
        .attr("transform", "translate(" + this.padding.left + "," + this.padding.top + ")");
 
  this.plot = this.vis.append("rect")
      .attr("width", this.size.width)
      .attr("height", this.size.height)
      .style("fill", "#000")
      .attr("pointer-events", "all")
      this.plot.call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.redraw()));
	
  this.vis.append("svg")
      .attr("top", 0)
      .attr("left", 0)
      .attr("width", this.size.width)
      .attr("height", this.size.height)
      .attr("viewBox", "0 0 "+this.size.width+" "+this.size.height)
      .attr("class", "line")
      .append("path")
          .attr("class", "line")
	  .style("display","none")
          .attr("d", this.line(this.points));

  // Place Quick Options
  var switcher = d3.select("#switcher");
  var sizeopt = switcher.append("div");
  sizeopt.append("p")
        .style("margin","3px 0px 0px 0px")
        .text("Option lists max size:");
  sizeopt.append("input")
        .style("width","68px")
        .attr("id","niceSize")
        .attr("title","Size of tags and comments to display in their respective option lists")
        .attr("value",Vis.limit);
  sizeopt.append("input")
        .attr("class","toggle_options")
        .style("display","inline")
        .style("width","20px")
        .attr("title","Size of tags and comments to display in their respective option lists")
        .attr("value","Go")
        .on("click", function () {
          val = document.getElementById('niceSize').value;
          var intRegex = /^\d+$/;
          if(intRegex.test(val)) {
	   Vis.limit = val;
           self.panel_tags = getClouds(self.x.domain()[0],1,self,1,"tags",-1);
           placeCloud(self,self.panel_tags,"tag");
           self.panel_cmts = getClouds(self.x.domain()[0],1,self,1,"comments",-1);
           placeCloud(self,self.panel_cmts,"cmt");
          } else alert("Input value should be non-negative number");
        });
  switcher.append("p")
        .attr("class","toggle_options")
	.attr("title","Reset width so selected posts are shown")
        .text("Fit to dates")
	.on("click", function () {
	 var min_date = d3.min(
		self.live_points.length>0 ? self.live_points : self.points, 
		function(d) { return d.x; } );
	 var max_date = d3.max(
		self.live_points.length>0 ? self.live_points : self.points, 
		function(d) { return d.x; } );
	 max_date = min_date==max_date ? new Date(max_date.getTime()+1000) : max_date;
         var new_domain = [min_date, max_date];
         self.x.domain(new_domain);
         self.redraw()();
	});
  switcher.append("p")
        .attr("class","toggle_options")
        .attr("title","Center y-axis so that all selected post lengths are included")
        .text("Center to posts")
        .on("click", function () {
         var max_y = d3.max(
                self.live_points.length>0 ? self.live_points : self.points,
                function(d) { return d.y; } );
	 max_y = max_y==0 ? 1 : max_y;
         var new_domain = [max_y, max_y*-1];
         self.y.domain(new_domain);
         self.redraw()();
        });
  switcher.append("p")
        .attr("class","toggle_options")
	.attr("title","Reset height so selected posts and comments are shown")
        .text("Fit to points")
        .on("click", function () {
         var min_y = d3.min(
		self.live_points.length>0 ? self.live_points : self.points,
		function(d) { return d.c_len * -1; } );
         var max_y = d3.max(
		self.live_points.length>0 ? self.live_points : self.points,
		function(d) { return d.y; } );
	 max_y = max_y==min_y ? max_y + 1 : max_y;
         var new_domain = [max_y, min_y];
         self.y.domain(new_domain);
         self.redraw()();
        });

  //Place Tag Options Panel
  d3.select("#tag_without")
	.on("click", function () {
	 if (Vis.without==1) {
	  d3.select("#tag_without")
		.text("With");
	  Vis.without = 0;
	  self.live_points = getCorrectBlogPoints(self.points);
	  updateBlogPoints(self);
	  updateClouds(self);
	 } else {
	  d3.select("#tag_without")
		.text("Without");
	  Vis.without = 1;
	  self.live_points = getCorrectBlogPoints(self.points);
	  updateBlogPoints(self);
	  updateClouds(self);
	 }
	});
  self.panel_tags = getClouds(self.x.domain()[0],1,self,1,"tags",-1);
  placeCloud(self,self.panel_tags,"tag");
  d3.select("#tag_name")
	.on ("click", function () {
	 self.panel_tags.sort(comparecloud0);
	 placeCloud(self,self.panel_tags,"tag");
	});	
  d3.select("#tag_counts")
        .on ("click", function () {
	 self.panel_tags.sort(comparecloud1);
         placeCloud(self,self.panel_tags,"tag");
        });
  d3.select("#tag_select")
	.on("click", function () {
	 sortSelected(self.panel_tags,"tag");
	 placeCloud(self,self.panel_tags,"tag");
	});

  //Place Comment Options Panel
  d3.select("#cmt_without")
        .on("click", function () {
         if (Vis.without2==1) {
          d3.select("#cmt_without")
                .text("With");
          Vis.without2 = 0;
          self.live_points = getCorrectBlogPoints(self.points);
          updateBlogPoints(self);
	  updateClouds(self);
         } else {
          d3.select("#cmt_without")
                .text("Without");
          Vis.without2 = 1;
          self.live_points = getCorrectBlogPoints(self.points);
          updateBlogPoints(self);
	  updateClouds(self);
         }
        });
  self.panel_cmts = getClouds(self.x.domain()[0],1,self,1,"comments",-1);
  placeCloud(self,self.panel_cmts,"cmt");
  d3.select("#cmt_name")
        .on ("click", function () {
         self.panel_cmts.sort(comparecloud0);
         placeCloud(self,self.panel_cmts,"cmt");
        });
  d3.select("#cmt_counts")
        .on ("click", function () {
         self.panel_cmts.sort(comparecloud1);
         placeCloud(self,self.panel_cmts,"cmt");
        });
  d3.select("#cmt_select")
        .on("click", function () {
         sortSelected(self.panel_cmts,"cmt");
         placeCloud(self,self.panel_cmts,"cmt");
        });
 
  d3.select(this.chart)
      .on("mousemove.drag", self.mousemove())
      .on("touchmove.drag", self.mousemove())
      .on("mouseup.drag",   self.mouseup())
      .on("touchend.drag",  self.mouseup());

  var temp = d3.max(this.points,function(d) { return d.y; } ); 
  this.y.domain([temp,temp*-1]);
  this.redraw()();

};

// Look for the correct points that fit the condition of Vis.without
// 	and the condition of Vis.tags_noShow and Vis.cmts_noShow
function getCorrectBlogPoints(points) {
 var pts = [];
 for (var m=0; m<points.length; m++) {
  var taker = points[m].tags;
  var found = 0, found2 = 0;
  for (var n=0; n<taker.length; n++) {
   if (Vis.tags_noShow.indexOf(taker[n]) > -1 ) {
    found = 1;
    break;
   }
  }
  taker = points[m].c_ers;
  for (var n=0; n<taker.length; n++) {
   if (Vis.cmts_noShow.indexOf(taker[n]) > -1) {
    found2 = 1;
    break;
   }
  }
  if ((((found==0 && Vis.without==1) || (found==1 && Vis.without==0) )
	&& ((found2==0 && Vis.without2==1) || (found2==1 && Vis.without2==0))) || 
   (((found2==0 && Vis.without2==1) || (found2==1 && Vis.without2==0))
	&& ((found==0 && Vis.without==1) || (found==1 && Vis.without==0)))) {
   pts.push(points[m]);
  }
 }
 return pts;
}

function placeCloud(self,panel_tags,type) {
 var ref = type=="tag" ? Vis.tags_noShow : Vis.cmts_noShow;
 var pan = type=="tag" ? "#panel1" : "#panel2";
  self.panel = d3.select(pan)
	.selectAll("tr").remove();

  if (panel_tags.length==0) {
   d3.select(pan).append("tr")
	.append("td")
	.text(function () {
	 var panel_type = type=="tag" ? "tags" : "commenters";
	 if (Vis.limit!=0) return "No " + panel_type + " detected! :(";
	 else return "Looks like you set the number of listings to 0!";
	});
  }

  self.panel = d3.select(pan)
        .selectAll("tr")
        .data(panel_tags);
  self.panel.enter().append("tr")
        .append("td")
        .append("div").text(function (d) { return d[0]; })
        .style("background-color", function (d) {
                return ref.indexOf(d[0])<0 ? "#E9E9E9" : "lightBlue";
        })
        .style("cursor","pointer")
        .attr("class","panel_name")
        .attr("id", function (d,i) {
                if (type=="tag") Vis.tag_map[d[0]] = i;
		else Vis.cmt_map[d[0]] = i;
                return "panel_" + type + "s_" + i;
        })
        .on("mouseover", function (d,i) {
                var prevC = d3.select("#panel_" + type + "s_" + i).style("background-color");
                d3.select("#panel_"+ type +"s_" + i)
                .attr("prev",prevC)
                .style("background-color","black")
                .style("color","white");
        } )
        .on("mouseout",function (d,i) {
                 var prevC = d3.select("#panel_"+ type +"s_" + i).attr("prev");
                d3.select("#panel_"+type+"s_" + i)
                .style("background-color",prevC)
                .style("color","black");
        })
        .on("click", function (d,i) {
                modifyClouds(d,i,self,type);
        });
  self.panel
        .append("td")
        .append("div")
        .attr("class","panel_num")
        .text(function (d) { return d[1]; });
}

function comparecloud0(a,b) {
 return a[0].localeCompare(b[0]);
}
function comparecloud1(a,b) {
 return a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0;
}
function sortSelected(panel_tags,type) {
 for (var f=0; f<panel_tags.length; f++) {
  var m = type=="tag" ? 
	Vis.tags_noShow.indexOf(panel_tags[f][0]) :
	Vis.cmts_noShow.indexOf(panel_tags[f][0]);
  if (m > -1) {
   var temp = panel_tags.splice(f,1);
   panel_tags.unshift(temp[0]);
  }
 }
}

// Function modifyCloud modifies the listings in the Tag/Commenter
// Options panels and updates the canvas
function modifyClouds(d,i,self,type) {
 i = type=="tag" ? Vis.tag_map[d[0]] : Vis.cmt_map[d[0]];
 var ref = type=="tag" ? Vis.tags_noShow : Vis.cmts_noShow;

 if(ref.indexOf(d[0]) < 0) {
  d3.select("#panel_"+type+"s_" + i)
   .style("background-color","lightBlue")
   .attr("prev","lightBlue");
  ref.push(d[0]);
  self.live_points = getCorrectBlogPoints(self.points);
  updateBlogPoints(self);
  updateClouds(self);
 } else {
  d3.select("#panel_"+type+"s_" + i)
  .style("background-color","#E9E9E9")
   .attr("prev","#E9E9E9");
  var data_tag = d3.select("#panel_"+type+"s_" + i).text();
  ref.splice(ref.indexOf(data_tag),1);
  self.live_points = getCorrectBlogPoints(self.points);
  updateBlogPoints(self);
  updateClouds(self);
 }

 d3.select("#"+type+"_select")
        .style("color", function() { return ref.length==0 ? "black" : "darkCyan"; })
        .style("cursor", function() { return ref.length==0 ? "text" : "pointer"; });
}

// Function updateBlogPoint draws blog points on the canvas
function updateBlogPoints(self) {
 var pts = self.live_points;
 var dia_size = 50, stroke_width = 2;
 var cScale = d3.scale.linear()
        .domain([0,1000])
        .range([0,10000])
        .clamp(true);

 // Remove previous records
 self.vis.select("svg").selectAll("path.post").remove();
 self.vis.select("svg").selectAll("line.post_lines").remove();
 self.vis.select("svg").selectAll("path.comment").remove();

 // Manage Blog Post lines
 var blog_post_lines = self.vis.select("svg").selectAll("line.post_lines")
        .data(pts);
  blog_post_lines.enter().append("line")
        .attr("class", "post_lines")
        .attr("stroke", function (d) { return d.read==1 ? "steelBlue" : "orange"; })
        .attr("stroke-width",stroke_width)
        .style("cursor", "pointer")
        .on("mouseout", function(d,i) { returnColour(
                d3.select("path#post_" + i).attr("prev"),
                i); })
        .on("mouseover", function(d,i) { hoverColourBoth(
                d3.select("path#post_" + i).style("stroke"),
                i); })
        .on("click", function(d,i) { openBlog(
                d.url,
                i); });
  blog_post_lines
        .attr("id", function(d,i) { return "post_line_" + i; })
        .attr("x1", function(d) { return self.x(d.x); })
        .attr("y1", function(d) { return self.y(d.y) +dia_size/10; })
        .attr("x2", function(d) { return self.x(d.x); })
        .attr("y2", function(d,i) { 
	   return self.y(0 - d.c_len) - Math.sqrt(cScale(d.c_num)/Math.PI); });
 blog_post_lines.exit().remove();

 // Manage Blog Post Diamonds
 var new_pts = self.vis.select("svg").selectAll("path.post")
 		.data(pts);
 new_pts.enter().append("path")
        .attr("class", function(d) { return "post p_" + d.type; })
        .attr("d", d3.svg.symbol().type("diamond").size(dia_size))
        .style("cursor", "pointer")
        .attr("fill","none")
        .attr("stroke", function (d) { return d.read ? "steelBlue" : "orange"; })
        .attr("stroke-width",stroke_width)
        .on("mouseout", function(d,i) { returnColour(
                d3.select("path#post_" + i).attr("prev"),
                i); })
        .on("mouseover", function(d,i) { hoverColourBoth(
                d3.select("path#post_" + i).style("stroke"),
                i); })
        .on("click", function(d,i) { openBlog(
                d.url,
                i); });
 new_pts.attr("id", function (d,i) { return "post_" + i; })
        .attr("transform", function(d) { 
		return "translate(" + self.x(d.x) + "," + self.y(d.y) + ")"; });
  new_pts.exit().remove();

  // Manage Blog Post Comments
  var comment_post = self.vis.select("svg").selectAll("path.comment")
        .data(pts);
  comment_post.enter().append("path")
        .attr("class", function(d) { return "comment p_" + d.type; })
        .attr("d", d3.svg.symbol().type("circle").size(function (d) { 
		return cScale(d.c_num); }))
        .style("cursor", "pointer")
        .attr("fill","none")
        .attr("stroke", function (d) { return d.read ? "steelBlue" : "orange"; })
        .attr("stroke-width",stroke_width)
        .on("mouseout", function(d,i) { returnColour(
                d3.select("path#post_" + i).attr("prev"),
                i); })
        .on("mouseover", function(d,i) { hoverColourBoth(
                d3.select("path#post_" + i).style("stroke"),
                i); })
        .on("click", function(d,i) { openBlog(
                d.url,
                i); });
  comment_post
        .attr("id", function (d,i) { return "comment_" + i; })
        .attr("transform", function(d) { 
	 return "translate(" + self.x(d.x) + "," + self.y(0 - d.c_len) + ")"; });
  comment_post.exit().remove();
}

// updateClouds update clouds so thay fit the tags/commenter names selected
function updateClouds(self) {
 var g = d3.selectAll("g.x");
 var len = g.selectAll("text.axis").length;
 for (var p=0; p<len; p++) {
  var date1 = self.x.ticks(len)[p];
  var tags1 = getClouds(date1,p,self,len,"tags",20);
  var group = d3.select("g#ax" + date1.getTime());
  var ge = group.selectAll("text.tags");
  ge.remove();
  var tc = group.selectAll("text.tags")
        .data(tags1,String);
  tc.enter().insert("text")
        .attr("class","tags")
        .attr("fill","white");
  tc.attr("y", function (d,i) { return i*10+10; })
        .attr("x",10)
        .attr("font-size", function(d) {
                return ((d[1]+1)-1)/(d[1]+1)*2 + "em";} )
        .attr("fill","DarkCyan")
        .text(function(d) { return d[0]; })
        .style("cursor","pointer")
        .on("click", function (d,i) {
                modifyClouds(d,i,self,"tag");
        });
  var cmts1 = getClouds(date1,p,self,len,"comments",20);
  var ge = group.selectAll("text.comments");
  ge.remove();
  var cc = group.selectAll("text.comments")
        .data(cmts1,String);
  cc.enter().insert("text")
        .attr("class","comments")
        .attr("fill","white");
  cc.attr("y", function (d,i) { return self.size.height - i*10 - 10;})
        .attr("x",10)
        .attr("font-size", function(d) {
                return ((d[1]+1)-1)/(d[1]+1)*2 + "em";} )
        .attr("fill","DarkCyan")
        .text(function(d) { return d[0]; })
        .style("cursor","pointer")
        .on("click", function (d,i) {
                modifyClouds(d,i,self,"cmt");
        });
 }
}
 
SimpleGraph.prototype.update = function() {
  var self = this;
  var lines = this.vis.select("path").attr("d", this.line(this.points));

  var pts = getCorrectBlogPoints(self.points);
//  updateBlogPoints(self,pts);
// /*
// System runs faster if I leave this code here. : /

  var dia_size = 50, stroke_width = 2;
  var cScale = d3.scale.linear()
	.domain([0,1000])
	.range([0,10000])
	.clamp(true);

// Remove presious post
self.vis.select("svg").selectAll("path.post").remove();
self.vis.select("svg").selectAll("line.post_lines").remove();
self.vis.select("svg").selectAll("path.comment").remove();



// Blog post lines
var blog_post_lines = this.vis.select("svg").selectAll("line.post_lines")
        .data(pts);
  blog_post_lines.enter().append("line")
        .attr("class", "post_lines")
        .attr("stroke", function (d) { return d.read ? "steelBlue" : "orange"; })
        .attr("stroke-width",stroke_width)
        .style("cursor", "pointer")
        .on("mouseout", function(d,i) { returnColour(
                d3.select("path#post_" + i).attr("prev"),
                i); })
        .on("mouseover", function(d,i) { hoverColourBoth(
                d3.select("path#post_" + i).style("stroke"),
                i); })
        .on("click", function(d,i) { openBlog(
                d.url,
                i); });
  blog_post_lines
        .attr("id", function(d,i) { return "post_line_" + i; })
        .attr("x1", function(d) { return self.x(d.x); })
        .attr("y1", function(d) { return self.y(d.y) +dia_size/10; })
        .attr("x2", function(d) { return self.x(d.x); })
        .attr("y2", function(d,i) { return self.y(0 - d.c_len) - Math.sqrt(cScale(d.c_num)/Math.PI); });
 blog_post_lines.exit().remove();

// Blog posts        
var blog_post = this.vis.select("svg").selectAll("path.post")
	.data(pts);
  blog_post.enter().append("path")
	.attr("class", function(d) { return "post p_" + d.type; })
	.attr("d", d3.svg.symbol().type("diamond").size(dia_size))
	.style("cursor", "pointer")
        .attr("fill","none")
        .attr("stroke", function (d) { return d.read ? "steelBlue" : "orange"; })
        .attr("stroke-width",stroke_width)
	.on("mouseout", function(d,i) { returnColour(
		d3.select("path#post_" + i).attr("prev"),
		i); })
	.on("mouseover", function(d,i) { hoverColourBoth(
		d3.select("path#post_" + i).style("stroke"),
		i); })
	.on("click", function(d,i) { openBlog(
		d.url,
		i); });
  blog_post
	.attr("id", function (d,i) { return "post_" + i; })
	.attr("transform", function(d) { return "translate(" + self.x(d.x) + "," + self.y(d.y) + ")"; });
  blog_post.exit().remove();

// Comments
var comment_post = this.vis.select("svg").selectAll("path.comment")
        .data(pts);
  comment_post.enter().append("path")
        .attr("class", function(d) { return "comment p_" + d.type; })
        .attr("d", d3.svg.symbol().type("circle").size(function (d) { return cScale(d.c_num); }))
        .style("cursor", "pointer")
        .attr("fill","none")
        .attr("stroke", function (d) { return d.read ? "steelBlue" : "orange"; })
        .attr("stroke-width",stroke_width)
        .on("mouseout", function(d,i) { returnColour(
                d3.select("path#post_" + i).attr("prev"),
                i); })
        .on("mouseover", function(d,i) { hoverColourBoth(
                d3.select("path#post_" + i).style("stroke"),
                i); })
        .on("click", function(d,i) { openBlog(
                d.url,
                i); });
  comment_post
        .attr("id", function (d,i) { return "comment_" + i; })
        .attr("transform", function(d) { return "translate(" + self.x(d.x) + "," + self.y(0 - d.c_len) + ")"; });
  comment_post.exit().remove();
// */
	
  if (d3.event && d3.event.keyCode) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
  }
}

// The following functions help with point-interactions to open
// new window for blog, change colour when hovering, and return colour
function openBlog(url, i) {
 var parts = ["path#post_","line#post_line_","path#comment_"];
 for (var m=0; m<parts.length; m++) {
  d3.select(parts[m] + i)
	.attr("stroke", function (d) {
		d.read = 1; 
		return "steelBlue";
	})
	.attr("prev", "steelBlue");
 }
 window.open(url, "_blank");
}
function hoverColourBoth(args,i) {
 var parts = ["path#post_","line#post_line_","path#comment_"];
 for (var m=0; m<parts.length; m++) {
  d3.select(parts[m] + i)
	.attr("prev", args)
	.attr("stroke", "red");
 }
}

function returnColour(args,i) {
 var parts = ["path#post_","line#post_line_","path#comment_"];
 for (var m=0; m<parts.length; m++) {
  d3.select(parts[m] + i)
	.attr("stroke", args);
 }
}
// Original function from SB code
SimpleGraph.prototype.mousemove = function() {
  var self = this;
  return function() {
    var p = d3.mouse(self.vis[0][0]),
        t = d3.event.changedTouches;
    
    if (self.dragged) {
      self.dragged.y = self.y.invert(Math.max(0, Math.min(self.size.height, p[1])));
      self.update();
    };
    if (!isNaN(self.downx)) {
      d3.select('body').style("cursor", "ew-resize");
      var rupx = self.x.invert(p[0]),
          xaxis1 = self.x.domain()[0].getTime(),
          xaxis2 = self.x.domain()[1].getTime(),
          xextent = xaxis2 - xaxis1;
      if (rupx != 0 && (rupx - xaxis1)!=0) {
        var changex, new_domain;
	changex = (self.downx - xaxis1) / (rupx - xaxis1);
        new_domain = [xaxis1, xaxis1 + (xextent * changex)];
        self.x.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };
    if (!isNaN(self.downy)) {
      d3.select('body').style("cursor", "ns-resize");
      var rupy = self.y.invert(p[1]),
          yaxis1 = self.y.domain()[1],
          yaxis2 = self.y.domain()[0],
          yextent = yaxis2 - yaxis1;
      if (rupy != 0 && (rupy - yaxis1)!=0) {
        var changey, new_domain;
	changey = (self.downy - yaxis1) / (rupy - yaxis1);
        new_domain = [yaxis1 + (yextent * changey), yaxis1];
        self.y.domain(new_domain);
        self.redraw()();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  }
};
//Original function from SB code 
SimpleGraph.prototype.mouseup = function() {
  var self = this;
  return function() {
    document.onselectstart = function() { return true; };
    d3.select('body').style("cursor", "auto");
    d3.select('body').style("cursor", "auto");
    if (!isNaN(self.downx)) {
      self.redraw()();
      self.downx = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    };
    if (!isNaN(self.downy)) {
      self.redraw()();
      self.downy = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    if (self.dragged) { 
      self.dragged = null 
    }
  }
}
//Original function from SB code (+ addition that draws clouds in initial view)
SimpleGraph.prototype.redraw = function() {
  var numXticks = 5;
  var self = this;
  return function() {
    var tx = function(d,i) {
      return "translate(" + self.x(d) + ",0)"; 
    },
    ty = function(d) { 
      return "translate(0," + self.y(d) + ")";
    },
    stroke = function(d) { 
      return d ? "#666" : "#fff"; 
    },
      fx = self.x.tickFormat(function(d) { return d3.time.format('%Y')(d); }),
    fy = self.y.tickFormat(10),
    comments = function (d,i) {
      return getClouds(d,i,self,numXticks,"comments",20);
    },
    tags = function (d,i) {
      return getClouds(d,i,self,numXticks,"tags",20); 
    },
    start = function(d) {
      return d.getTime();
    };
    // Regenerate x-ticks.
    var gx = self.vis.selectAll("g.x")
        .data(self.x.ticks(numXticks), String)
        .attr("transform", tx);

    gx.select("text.axis")
       .text(fx);//function(d) { return d3.time.format('%b %d, %Y')(d); });
 
    var gxe = gx.enter().insert("g", "a")
	.attr("id", function (d,i) { return "ax" + d.getTime(); })
        .attr("class", "x")
        .attr("transform", tx);

    gxe.append("line")
        .attr("stroke", stroke)
	.attr("class","heyo")
        .attr("y1", 0)
        .attr("y2", self.size.height);

    gxe.append("text")
        .attr("class", "axis")
	.attr("id",start)
        .attr("y", self.size.height)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
	.text(fx)//function(d) { return d3.time.format('%b %d, %Y')(d); })//fx)
        .style("cursor", "ew-resize")
        .on("mouseover", function(d) { 
d3.select(this).style("font-weight", "bold");})
        .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown.drag",  self.xaxis_drag())
        .on("touchstart.drag", self.xaxis_drag());
// /*
    // Place tag clouds
    var tc = gxe.selectAll("text.tags")
	.data(tags, String);
    tc.enter().insert("text")
	.attr("class","tags")
	.attr("fill","white");
    tc.attr("y",function (d,i) { return i*10 + 10;})
	.attr("x",10)
	.attr("font-size",function(d) { 
		return ((d[1]+1)-1)/(d[1]+1)*2 + "em";} )
	.attr("fill","DarkCyan")
	.text(function(d) { return d[0];} )
	.style("cursor","pointer")
	.on("click", function (d,i) {
		modifyClouds(d,i,self,"tag");
	});
    tc.exit().remove();

    // Place comments / commenters
    var cc = gxe.selectAll("text.comments")
        .data(comments, String);
    cc.enter().append("text")
        .attr("class","comments")
        .attr("fill","white");
    cc.attr("y",function (d,i) { return self.size.height - i*10 - 10;})
        .attr("x",10)
        .attr("font-size",function(d) { 
		return ((d[1]+1)-1)/(d[1]+1)*2 + "em";} )
        .attr("fill","DarkCyan")
        .text(function(d) { return d[0];} )
	.style("cursor","pointer")
        .on("click", function (d,i) {
                modifyClouds(d,i,self,"cmt");
        });
    cc.exit().remove();	
// */
//    gxe.exit().remove();

   gx.exit().remove();
    // Regenerate y-ticks.
    var gy = self.vis.selectAll("g.y")
        .data(self.y.ticks(10), String)
        .attr("transform", ty);
 
    gy.select("text")
        .text(fy);
 
    var gye = gy.enter().insert("g", "a")
        .attr("class", "y")
        .attr("transform", ty)
        .attr("background-fill", "#FFEEB6");
 
    gye.append("line")
        .attr("stroke", stroke)
        .attr("x1", 0)
        .attr("x2", self.size.width);
 
    gye.append("text")
        .attr("class", "axis")
        .attr("x", -3)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(fy)
        .style("cursor", "ns-resize")
	.attr("transform", function (d) {
		var temp = (Math.abs(d) + "").length;
		return "translate(-10,"+ temp*10/-2+") rotate(-90)"
	})
        .on("mouseover", function(d) { d3.select(this).style("font-weight", "bold");})
        .on("mouseout",  function(d) { d3.select(this).style("font-weight", "normal");})
        .on("mousedown.drag",  self.yaxis_drag())
        .on("touchstart.drag", self.yaxis_drag());
 
    gy.exit().remove();
    self.plot.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.redraw()));
    self.update();    
  }  
}
// Helper function fot getClouds
function between(element, index, array) {
 return (element.x.getTime() >= Vis.lower && element.x.getTime() <= Vis.upper);
}
/* This specific function was taken from:
http://stackoverflow.com/questions/5667888/counting-occurences-of-javascript-array-elements
 and was in no way wrtten by me (Jessica) */
function foo(arr) {
    var a = [], b = [], prev;

    arr.sort();
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            a.push(arr[i]);
            b.push(1);
        } else {
            b[b.length-1]++;
        }
        prev = arr[i];
    }

    return [a, b];
}
/*
 Function getClouds returns a list of tags or commenters based off:
	d = date in milliseconds
	i = period where tags are coming from
	numXticks = number of "tick" in this instance
	option = "comments" or "tags"
	limit = length of array to return 
*/
function getClouds(d,i,self,numXticks,option,limit) {
 var ret = [], comm = [];
 var num = 0;
  // Define x-axis time bounds
  var upper=0;
  if (typeof self.x.ticks(numXticks)[i+1] == 'undefined') {
   upper = self.x.domain()[1];
  } else {
   upper = self.x.ticks(numXticks)[i+1];
  }

  Vis.lower = d.getTime();
  Vis.upper = upper.getTime();
  var pts = limit==-1 ? self.points.filter(between) : self.live_points.filter(between);
  for (var m=0; m<pts.length; m++) {
   var taker;
   // If comments or tags
   if (option == "comments") {
    taker = pts[m].c_ers;
   } else if (option == "tags") {
    taker = pts[m].tags;
   }
   for (n=0; n<taker.length; n++) {
    comm.push(taker[n]);
   }
  } 
  var result = foo(comm);
  for (var m=0; m<result[0].length; m++) {
   ret.push([result[0][m],result[1][m]]);
  }
  ret.sort(comparecloud1);
  if (limit==-1) limit = Vis.limit;
  return ret.slice(0,limit);
}
 
SimpleGraph.prototype.xaxis_drag = function() {
  var self = this;
  return function(d) {
    document.onselectstart = function() { return false; };
    var p = d3.mouse(self.vis[0][0]);
    self.downx = self.x.invert(p[0]);
  }
};
 
SimpleGraph.prototype.yaxis_drag = function(d) {
  var self = this;
  return function(d) {
    document.onselectstart = function() { return false; };
    var p = d3.mouse(self.vis[0][0]);
    self.downy = self.y.invert(p[1]);
  }
};
