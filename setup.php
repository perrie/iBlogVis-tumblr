<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<title>iBlogData+tumblr Setup Page</title>
<link rel="stylesheet" type="text/css" href="styles/style.css">
</head>
<body>
<div style="width:800px">

<h1>iBlogVis+tumblr</h1>
<p>Welcome to the setup page for iBlogVis+tumblr, an application written in 
JavaScript that lets users explore blog content from recent tumblr blog posts 
in an implementation based off iBlogVis (iBlogVis as described in  
"<a href="http://dl.acm.org/citation.cfm?id=1385578">Exploring blog archives with interactive visualization</a>" by Indratmo, 
Julita Vassileva, and Carl Gutwin). This version also used code from 
<a href="https://gist.github.com/stepheneb/1182434">Stephen Bannasch</a> initially.</p>

<p>Please enter either a blog name to get posts from in <strong>Load Blog 
Content</strong> OR a popular tag in <strong>Load Tag Content</strong>. The
system will then make multiple calls to the Tumblr API and collect data 
to store and be accessible in the visualization. <strong>If you used the tag option 
please note that the Tumblr API doesn't give commenter names, 
and hense they won't be displayed in the visualization page.</strong></p>

<p>You also have the option of specifying the number of posts you'd like to 
retrieve in multiples of 20. Please note, high inputted numbers may be unfulfilled 
because the server will timeout, or, if successfuly collected, the visualization 
page will take longer to load the data. The maximum number allowed to be inputted 
is currently set at 40. </p>

<form action="setup.php" method="get">
<table style="border: gray 1px solid">
<caption><h2>Load Blog Content</h2></caption>
<tr><td>Number:</td>
<td><input type="text" name="num" value="2"></td>
<td>in terms of 20, so <em>3</em> will get you 3 * 20...about 60 posts</td></tr>
<tr><td>Blog Name:</td>
<td><input type="text" name="name"></td>
<td>for example: you'd enter 
<em>peacecorps</em> for <a href="http://peacecorps.tumblr.com/">
http://<strong>peacecorps</strong>.tumblr.com/</a></td></tr>
<tr><td></td>
<td><input class="toggle_options" type="submit" value="Submit" name="blog"></td>
<td></td></tr>
</table>
</form>


<br />
<form action="setup.php" method="get">
<table style="border: gray 1px solid">
<caption><h2>Load Tag Content</h2></caption>
<tr><td>Number:</td>
<td><input type="text" name="num" value="2"></td>
<td></td></tr>
<tr><td>Tag Name:</td>
<td><input type="text" name="name"></td>
<td>for example: you'd enter
<em>cats</em> for <a href="http://www.tumblr.com/tagged/cats">
http://www.tumblr.com/tagged/<strong>cats</strong></a></td></tr>
<tr><td></td>
<td><input class="toggle_options" type="submit" value="Submit" name="tag"></td>
<td></td></tr>
</table>
</form>


<?php
if (isset($_GET["name"])) {
 $oauth = "mdCUFZwEabT9nRUyRgTenZKdGXslZqBOHNsj6OdQZd8r22ymLE";
 $all = [];
 $next = ""; 
 $lim = isset($_GET["num"]) ? $_GET["num"] : 2;

 if (!preg_match("/^\d+$/",$lim)) {
  die("<p>Inputted number must be a non-negative integer.</p>");
 } else if ($lim > 40) {
  die("<p>Inputter number is too big. The maximum value allowed is 40.</p>");
 }

 for ($j=0; $j<$lim; $j++) {
 $url = isset($_GET["blog"]) ? 
	"http://api.tumblr.com/v2/blog/".$_GET["name"].".tumblr.com/posts/?api_key=".$oauth."&notes_info=true&limit=20&offset=".($j*20) :
	"http://api.tumblr.com/v2/tagged?tag=".$_GET["name"]."&api_key=".$oauth."&notes_info=true&limit=20&before=".$next;

 $html = file_get_contents($url);
 $json = json_decode($html);

 $msg = $json->{"meta"};
 if (!$html || !$json || $msg->{"status"}!==200) {
  die("<p>Something was found wrong with the query. Try again?</p>");
 }

 $json = $json->{"response"};
 if (isset($_GET["blog"])) {
  $json = $json->{"posts"};
 }

 if (count($json)==0) {
  break;
 }

 $all = array_merge($all, $json);
 $next = $json[count($json)-1];
 $next = $next->{"timestamp"};
 }

 if (count($all)==0) {
  die("<p>No posts were detected! Please try again!</p>");
 }

 $html = json_encode($all);
 if (file_put_contents("current.json",$html)) {
  echo '<p>Success! There are about '.count($all).' posts found! <a href="index.html">Proceed</a>...</p>';
 } else {
  die("<p>Unable to write to file! Try again?</p>");
 }
}
?>

</div>
</body>
</html>
