<?php

$oauth = "mdCUFZwEabT9nRUyRgTenZKdGXslZqBOHNsj6OdQZd8r22ymLE";
$limit = "35";

$url = "http://api.tumblr.com/v2/blog/".$_GET["name"].".tumblr.com/posts/?api_key=".$oauth."&notes_info=true&limit=".$limit;

$html = file_get_contents($url);

echo $html;
?>
